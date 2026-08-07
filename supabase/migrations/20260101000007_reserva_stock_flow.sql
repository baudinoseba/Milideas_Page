-- Migration: Reserva temporal de stock con estado 'reservado' y expiración automática

-- 1. Add 'reservado' to estado_pedido enum
ALTER TYPE public.estado_pedido ADD VALUE IF NOT EXISTS 'reservado' BEFORE 'confirmado';

-- 2. Update crear_pedido RPC to use 'reservado' state and 48h limit
CREATE OR REPLACE FUNCTION public.crear_pedido(
  p_items JSONB,
  p_nombre_contacto TEXT,
  p_whatsapp_contacto TEXT,
  p_email_contacto TEXT,
  p_tipo_envio public.tipo_envio,
  p_zona_logistica_id UUID,
  p_direccion_envio JSONB,
  p_metodo_pago public.metodo_pago,
  p_subtotal NUMERIC,
  p_descuento_aplicado NUMERIC,
  p_costo_envio NUMERIC,
  p_total NUMERIC
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pedido_id UUID;
  v_item JSONB;
  v_producto_id UUID;
  v_cantidad INTEGER;
  v_es_personalizado BOOLEAN;
  v_precio_unitario NUMERIC;
  v_stock INTEGER;
  v_usuario_id UUID;
BEGIN
  v_usuario_id := auth.uid();

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'El pedido debe tener al menos un item';
  END IF;

  -- Lock and validate stock for all items first (atomic concurrency control)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_producto_id := (v_item ->> 'producto_id')::UUID;
    v_cantidad := (v_item ->> 'cantidad')::INTEGER;

    SELECT stock_disponible INTO v_stock
    FROM public.productos
    WHERE id = v_producto_id AND activo = TRUE
    FOR UPDATE;  -- Row-level lock prevents concurrent reservations

    IF NOT FOUND THEN
      RAISE EXCEPTION 'PRODUCTO_NO_ENCONTRADO';
    END IF;

    IF v_stock < v_cantidad THEN
      RAISE EXCEPTION 'STOCK_INSUFICIENTE';
    END IF;
  END LOOP;

  -- Create order with 'reservado' state and 48h expiration
  INSERT INTO public.pedidos (
    usuario_id,
    estado,
    subtotal,
    descuento_aplicado,
    costo_envio,
    total,
    tipo_envio,
    metodo_pago,
    direccion_envio,
    zona_logistica_id,
    nombre_contacto,
    whatsapp_contacto,
    email_contacto,
    fecha_limite_pago
  ) VALUES (
    v_usuario_id,
    'reservado',
    p_subtotal,
    p_descuento_aplicado,
    p_costo_envio,
    p_total,
    p_tipo_envio,
    p_metodo_pago,
    p_direccion_envio,
    p_zona_logistica_id,
    p_nombre_contacto,
    p_whatsapp_contacto,
    p_email_contacto,
    NOW() + INTERVAL '48 hours'
  )
  RETURNING id INTO v_pedido_id;

  -- Insert items and decrement stock (reservation)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_producto_id := (v_item ->> 'producto_id')::UUID;
    v_cantidad := (v_item ->> 'cantidad')::INTEGER;
    v_es_personalizado := COALESCE((v_item ->> 'es_personalizado')::BOOLEAN, FALSE);
    v_precio_unitario := (v_item ->> 'precio_unitario_final')::NUMERIC;

    INSERT INTO public.items_pedido (
      pedido_id,
      producto_id,
      cantidad,
      precio_unitario_final,
      es_personalizado
    ) VALUES (
      v_pedido_id,
      v_producto_id,
      v_cantidad,
      v_precio_unitario,
      v_es_personalizado
    );

    -- Decrement stock immediately (reserved)
    UPDATE public.productos
    SET stock_disponible = stock_disponible - v_cantidad
    WHERE id = v_producto_id;
  END LOOP;

  RETURN v_pedido_id;
END;
$$;

-- 3. Update confirmar_pago to accept 'reservado' -> 'confirmado'
CREATE OR REPLACE FUNCTION public.confirmar_pago(p_pedido_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'NO_AUTORIZADO';
  END IF;

  UPDATE public.pedidos
  SET estado = 'confirmado'
  WHERE id = p_pedido_id
    AND estado IN ('pendiente_pago', 'reservado');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PEDIDO_NO_VALIDO';
  END IF;
END;
$$;

-- 4. Update cancelar_pedido to handle 'reservado' state too
CREATE OR REPLACE FUNCTION public.cancelar_pedido(p_pedido_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_estado public.estado_pedido;
  r RECORD;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'NO_AUTORIZADO';
  END IF;

  SELECT estado INTO v_estado
  FROM public.pedidos
  WHERE id = p_pedido_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PEDIDO_NO_ENCONTRADO';
  END IF;

  IF v_estado = 'cancelado' THEN
    RETURN;
  END IF;

  -- Restore stock for reserved/pending orders
  IF v_estado IN ('reservado', 'pendiente_pago') THEN
    FOR r IN
      SELECT producto_id, cantidad
      FROM public.items_pedido
      WHERE pedido_id = p_pedido_id
    LOOP
      UPDATE public.productos
      SET stock_disponible = stock_disponible + r.cantidad
      WHERE id = r.producto_id;
    END LOOP;
  END IF;

  UPDATE public.pedidos
  SET estado = 'cancelado'
  WHERE id = p_pedido_id;
END;
$$;

-- 5. NEW: Expire stale reservations automatically (admin-only or cron)
CREATE OR REPLACE FUNCTION public.expirar_pedidos_vencidos()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
  r RECORD;
  item RECORD;
BEGIN
  -- Find all expired reservations
  FOR r IN
    SELECT id
    FROM public.pedidos
    WHERE estado = 'reservado'
      AND fecha_limite_pago < NOW()
    FOR UPDATE
  LOOP
    -- Restore stock for each item
    FOR item IN
      SELECT producto_id, cantidad
      FROM public.items_pedido
      WHERE pedido_id = r.id
    LOOP
      UPDATE public.productos
      SET stock_disponible = stock_disponible + item.cantidad
      WHERE id = item.producto_id;
    END LOOP;

    -- Mark as cancelled
    UPDATE public.pedidos
    SET estado = 'cancelado'
    WHERE id = r.id;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.expirar_pedidos_vencidos TO authenticated;
