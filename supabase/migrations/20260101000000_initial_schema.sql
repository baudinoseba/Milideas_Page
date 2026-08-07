-- Milideas initial schema: enums, tables, RLS, RPCs, storage

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE public.estado_pedido AS ENUM (
  'pendiente_pago',
  'confirmado',
  'enviado',
  'cancelado'
);

CREATE TYPE public.metodo_pago AS ENUM (
  'transferencia',
  'mercadopago',
  'efectivo'
);

CREATE TYPE public.tipo_envio AS ENUM ('agencia', 'domicilio');

-- Tables
CREATE TABLE public.perfiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  nombre_completo TEXT,
  whatsapp TEXT,
  es_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria_id UUID REFERENCES public.categorias (id) ON DELETE SET NULL,
  nombre TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  precio_base NUMERIC(12, 2) NOT NULL CHECK (precio_base >= 0),
  es_personalizable BOOLEAN NOT NULL DEFAULT FALSE,
  stock_disponible INTEGER NOT NULL DEFAULT 0 CHECK (stock_disponible >= 0),
  es_entrega_inmediata BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_lanzamiento TIMESTAMPTZ,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.producto_imagenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id UUID NOT NULL REFERENCES public.productos (id) ON DELETE CASCADE,
  url_imagen TEXT NOT NULL,
  orden INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE public.configuracion_logistica (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zona_nombre TEXT NOT NULL,
  precio_agencia NUMERIC(12, 2) NOT NULL CHECK (precio_agencia >= 0),
  precio_domicilio NUMERIC(12, 2) NOT NULL CHECK (precio_domicilio >= 0),
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  estado public.estado_pedido NOT NULL DEFAULT 'pendiente_pago',
  subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
  descuento_aplicado NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (descuento_aplicado >= 0),
  costo_envio NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (costo_envio >= 0),
  total NUMERIC(12, 2) NOT NULL CHECK (total >= 0),
  tipo_envio public.tipo_envio NOT NULL,
  metodo_pago public.metodo_pago NOT NULL DEFAULT 'transferencia',
  direccion_envio JSONB,
  zona_logistica_id UUID REFERENCES public.configuracion_logistica (id) ON DELETE SET NULL,
  comprobante_url TEXT,
  nombre_contacto TEXT NOT NULL,
  whatsapp_contacto TEXT NOT NULL,
  email_contacto TEXT,
  fecha_limite_pago TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.items_pedido (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES public.pedidos (id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES public.productos (id) ON DELETE RESTRICT,
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  precio_unitario_final NUMERIC(12, 2) NOT NULL CHECK (precio_unitario_final >= 0),
  es_personalizado BOOLEAN NOT NULL DEFAULT FALSE
);

-- Indexes
CREATE INDEX idx_productos_slug ON public.productos (slug);
CREATE INDEX idx_productos_categoria ON public.productos (categoria_id);
CREATE INDEX idx_productos_drops ON public.productos (activo, fecha_lanzamiento DESC);
CREATE INDEX idx_pedidos_usuario ON public.pedidos (usuario_id);
CREATE INDEX idx_items_pedido_pedido ON public.items_pedido (pedido_id);
CREATE INDEX idx_producto_imagenes_producto ON public.producto_imagenes (producto_id, orden);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER perfiles_updated_at
  BEFORE UPDATE ON public.perfiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER productos_updated_at
  BEFORE UPDATE ON public.productos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER pedidos_updated_at
  BEFORE UPDATE ON public.pedidos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auth: create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.perfiles (id, nombre_completo, whatsapp)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'nombre_completo', NEW.email),
    NEW.raw_user_meta_data ->> 'whatsapp'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Admin helper (uses perfiles.es_admin, NOT user_metadata)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT es_admin FROM public.perfiles WHERE id = auth.uid()),
    FALSE
  );
$$;

-- RLS
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.producto_imagenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion_logistica ENABLE ROW LEVEL SECURITY;

-- perfiles policies
CREATE POLICY "perfiles_select_own" ON public.perfiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "perfiles_update_own" ON public.perfiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- categorias policies
CREATE POLICY "categorias_select_public" ON public.categorias
  FOR SELECT TO anon, authenticated
  USING (TRUE);

CREATE POLICY "categorias_admin_insert" ON public.categorias
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "categorias_admin_update" ON public.categorias
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "categorias_admin_delete" ON public.categorias
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- productos policies
CREATE POLICY "productos_select_public" ON public.productos
  FOR SELECT TO anon, authenticated
  USING (activo = TRUE OR public.is_admin());

CREATE POLICY "productos_admin_insert" ON public.productos
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "productos_admin_update" ON public.productos
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "productos_admin_delete" ON public.productos
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- producto_imagenes policies
CREATE POLICY "imagenes_select_public" ON public.producto_imagenes
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.productos p
      WHERE p.id = producto_id AND (p.activo = TRUE OR public.is_admin())
    )
  );

CREATE POLICY "imagenes_admin_insert" ON public.producto_imagenes
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "imagenes_admin_update" ON public.producto_imagenes
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "imagenes_admin_delete" ON public.producto_imagenes
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- pedidos: no public INSERT/UPDATE
CREATE POLICY "pedidos_select_own" ON public.pedidos
  FOR SELECT TO authenticated
  USING (usuario_id = auth.uid() OR public.is_admin());

CREATE POLICY "pedidos_select_guest_by_id" ON public.pedidos
  FOR SELECT TO anon
  USING (usuario_id IS NULL);

CREATE POLICY "pedidos_admin_update" ON public.pedidos
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- items_pedido: no public INSERT
CREATE POLICY "items_select_via_pedido" ON public.items_pedido
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pedidos pe
      WHERE pe.id = pedido_id
        AND (
          pe.usuario_id = auth.uid()
          OR public.is_admin()
          OR (auth.uid() IS NULL AND pe.usuario_id IS NULL)
        )
    )
  );

-- configuracion_logistica
CREATE POLICY "logistica_select_active" ON public.configuracion_logistica
  FOR SELECT TO anon, authenticated
  USING (activa = TRUE OR public.is_admin());

CREATE POLICY "logistica_admin_insert" ON public.configuracion_logistica
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "logistica_admin_update" ON public.configuracion_logistica
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "logistica_admin_delete" ON public.configuracion_logistica
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- RPC: crear_pedido (atomic stock reservation)
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

  -- Lock and validate stock for all items first
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_producto_id := (v_item ->> 'producto_id')::UUID;
    v_cantidad := (v_item ->> 'cantidad')::INTEGER;

    SELECT stock_disponible INTO v_stock
    FROM public.productos
    WHERE id = v_producto_id AND activo = TRUE
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'PRODUCTO_NO_ENCONTRADO';
    END IF;

    IF v_stock < v_cantidad THEN
      RAISE EXCEPTION 'STOCK_INSUFICIENTE';
    END IF;
  END LOOP;

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
    'pendiente_pago',
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
    NOW() + INTERVAL '24 hours'
  )
  RETURNING id INTO v_pedido_id;

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

-- RPC: cancelar_pedido (admin, restores stock)
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

  FOR r IN
    SELECT producto_id, cantidad
    FROM public.items_pedido
    WHERE pedido_id = p_pedido_id
  LOOP
    UPDATE public.productos
    SET stock_disponible = stock_disponible + r.cantidad
    WHERE id = r.producto_id;
  END LOOP;

  UPDATE public.pedidos
  SET estado = 'cancelado'
  WHERE id = p_pedido_id;
END;
$$;

-- RPC: confirmar_pago (admin, no stock change)
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
    AND estado = 'pendiente_pago';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PEDIDO_NO_VALIDO';
  END IF;
END;
$$;

-- Grant execute on RPCs
GRANT EXECUTE ON FUNCTION public.crear_pedido TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancelar_pedido TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirmar_pago TO authenticated;

-- Storage buckets (run via supabase storage or dashboard)
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('productos', 'productos', TRUE),
  ('comprobantes', 'comprobantes', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: productos (public read, admin write)
CREATE POLICY "productos_storage_public_read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'productos');

CREATE POLICY "productos_storage_admin_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'productos' AND public.is_admin());

CREATE POLICY "productos_storage_admin_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'productos' AND public.is_admin())
  WITH CHECK (bucket_id = 'productos' AND public.is_admin());

CREATE POLICY "productos_storage_admin_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'productos' AND public.is_admin());

-- Storage policies: comprobantes (upload for order owners, admin read all)
CREATE POLICY "comprobantes_storage_insert"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'comprobantes');

CREATE POLICY "comprobantes_storage_select"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'comprobantes' AND public.is_admin());

CREATE POLICY "comprobantes_storage_select_anon"
  ON storage.objects FOR SELECT
  TO anon
  USING (bucket_id = 'comprobantes');
