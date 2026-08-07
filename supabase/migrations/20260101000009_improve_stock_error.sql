-- Migration: Include product name in STOCK_INSUFICIENTE exception
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
  v_nombre_prod TEXT;
  v_usuario_id UUID;
BEGIN
  v_usuario_id := auth.uid();

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'El pedido debe tener al menos un item';
  END IF;

  -- Lock and validate stock for all items first
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_producto_id := (v_item ->> 'producto_id')::UUID;
    v_cantidad := (v_item ->> 'cantidad')::INTEGER;

    SELECT stock_disponible, nombre INTO v_stock, v_nombre_prod
    FROM public.productos
    WHERE id = v_producto_id AND activo = TRUE
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'PRODUCTO_NO_ENCONTRADO';
    END IF;

    IF v_stock < v_cantidad THEN
      RAISE EXCEPTION 'STOCK_INSUFICIENTE:%', v_nombre_prod;
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

  -- Insert items and decrement stock
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

    UPDATE public.productos
    SET stock_disponible = stock_disponible - v_cantidad
    WHERE id = v_producto_id;
  END LOOP;

  RETURN v_pedido_id;
END;
$$;
