-- ==============================================================================
-- MILIDEAS ARTE - SCRIPT DE INICIALIZACIÓN COMPLETA PARA PRODUCCIÓN
-- Base de datos: Limpia, 100% estructurada, con RLS optimizado, Storage y Catálogo base
-- ==============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TIPOS / ENUMS
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_pedido') THEN
    CREATE TYPE public.estado_pedido AS ENUM (
      'pendiente_pago',
      'reservado',
      'confirmado',
      'enviado',
      'cancelado'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'metodo_pago') THEN
    CREATE TYPE public.metodo_pago AS ENUM (
      'transferencia',
      'mercadopago',
      'efectivo'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_envio') THEN
    CREATE TYPE public.tipo_envio AS ENUM (
      'agencia',
      'domicilio',
      'taller'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_catalogo') THEN
    CREATE TYPE public.tipo_catalogo AS ENUM (
      'ceramica',
      'ilustracion'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_encargo') THEN
    CREATE TYPE public.estado_encargo AS ENUM (
      'pendiente',
      'aceptado',
      'en_proceso',
      'listo',
      'entregado',
      'rechazado',
      'cancelado'
    );
  END IF;
END $$;

-- 3. TABLAS PRINCIPALES

-- Perfiles de usuario (sincronizado con auth.users)
CREATE TABLE IF NOT EXISTS public.perfiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  nombre_completo TEXT,
  nombre_usuario TEXT,
  whatsapp TEXT,
  dni TEXT,
  direccion_calle TEXT,
  direccion_numero TEXT,
  direccion_piso TEXT,
  direccion_depto TEXT,
  direccion_ciudad TEXT,
  direccion_provincia TEXT,
  direccion_codigo_postal TEXT,
  direccion_referencia TEXT,
  es_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Función auxiliar para verificar si el usuario actual es admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT es_admin FROM public.perfiles WHERE id = (SELECT auth.uid())),
    FALSE
  );
$$;

-- Categorías de piezas
CREATE TABLE IF NOT EXISTS public.categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  tipo_catalogo public.tipo_catalogo NOT NULL DEFAULT 'ceramica',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Colecciones / Producciones temáticas
CREATE TABLE IF NOT EXISTS public.producciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  tipo_catalogo public.tipo_catalogo NOT NULL DEFAULT 'ceramica',
  portada_url TEXT,
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_lanzamiento TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Productos / Piezas en catálogo o stock
CREATE TABLE IF NOT EXISTS public.productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria_id UUID REFERENCES public.categorias (id) ON DELETE SET NULL,
  produccion_id UUID REFERENCES public.producciones (id) ON DELETE SET NULL,
  tipo_catalogo public.tipo_catalogo NOT NULL DEFAULT 'ceramica',
  nombre TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  precio_base NUMERIC(12, 2) NOT NULL CHECK (precio_base >= 0),
  es_personalizable BOOLEAN NOT NULL DEFAULT FALSE,
  es_bajo_pedido BOOLEAN NOT NULL DEFAULT FALSE,
  stock_disponible INTEGER NOT NULL DEFAULT 0 CHECK (stock_disponible >= 0),
  es_entrega_inmediata BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_lanzamiento TIMESTAMPTZ,
  dimensiones TEXT,
  alto_cm NUMERIC,
  ancho_cm NUMERIC,
  capacidad_ml NUMERIC,
  material_tecnica TEXT,
  atributos_especificos JSONB DEFAULT '{}'::jsonb,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Galería de imágenes de cada producto
CREATE TABLE IF NOT EXISTS public.producto_imagenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id UUID NOT NULL REFERENCES public.productos (id) ON DELETE CASCADE,
  url_imagen TEXT NOT NULL,
  orden INTEGER NOT NULL DEFAULT 0
);

-- Configuración de zonas de logística y envíos
CREATE TABLE IF NOT EXISTS public.configuracion_logistica (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zona_nombre TEXT NOT NULL,
  precio_agencia NUMERIC(12, 2) NOT NULL CHECK (precio_agencia >= 0),
  precio_domicilio NUMERIC(12, 2) NOT NULL CHECK (precio_domicilio >= 0),
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pedidos y Compras
CREATE TABLE IF NOT EXISTS public.pedidos (
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
  fecha_limite_pago TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '48 hours'),
  recordatorio_24h_enviado BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Items de cada pedido
CREATE TABLE IF NOT EXISTS public.items_pedido (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES public.pedidos (id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES public.productos (id) ON DELETE RESTRICT,
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  precio_unitario_final NUMERIC(12, 2) NOT NULL CHECK (precio_unitario_final >= 0),
  es_personalizado BOOLEAN NOT NULL DEFAULT FALSE
);

-- Configuración del Sitio (Portada, Logo, Sobre Mí, Datos Bancarios)
CREATE TABLE IF NOT EXISTS public.configuracion_sitio (
  id UUID PRIMARY KEY DEFAULT 'a1000000-0000-4000-8000-000000000001',
  logo_url TEXT,
  hero_imagen_url TEXT,
  hero_titulo TEXT DEFAULT 'Cerámica de Autor & Estudio de Ilustración',
  hero_subtitulo TEXT DEFAULT 'Piezas únicas y personalizadas creadas a mano en Sunchales, Santa Fe.',
  login_imagen_url TEXT,
  sobre_mi_foto_url TEXT,
  sobre_mi_titulo TEXT DEFAULT 'Hola, soy Mili Ferrero',
  sobre_mi_texto TEXT DEFAULT 'Creo piezas de cerámica ilustradas a mano y obras artísticas pensadas para acompañar tus momentos cotidianos.',
  cbu TEXT DEFAULT '0000000000000000000000',
  alias TEXT DEFAULT 'milideasarte',
  titular_cuenta TEXT DEFAULT 'Milagros Ferrero',
  banco TEXT DEFAULT 'Banco Santander',
  cuit TEXT DEFAULT '27-00000000-0',
  direccion_taller TEXT DEFAULT 'Sunchales, Santa Fe',
  horarios_taller TEXT DEFAULT 'Lunes a Viernes de 9:00 a 18:00',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configuración de Encargos Personalizados
CREATE TABLE IF NOT EXISTS public.configuracion_encargos (
  id UUID PRIMARY KEY DEFAULT 'e2000000-0000-4000-8000-000000000001',
  medidas_ilustraciones JSONB DEFAULT '[
    {"id": "a4", "nombre": "A4 (21 x 30 cm)", "recargo": 0},
    {"id": "a3", "nombre": "A3 (30 x 42 cm)", "recargo": 5000},
    {"id": "large", "nombre": "Grand Format (50 x 70 cm)", "recargo": 12000}
  ]'::jsonb,
  precio_marco_madera NUMERIC(12, 2) DEFAULT 8500,
  porcentaje_recargo_personalizado NUMERIC(5, 2) DEFAULT 0.15,
  porcentaje_sena NUMERIC(5, 2) DEFAULT 0.50,
  demora_default_dias INTEGER DEFAULT 15,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Formatos Base del Catálogo (Mates, Cuencos, etc. para pedir a encargo)
CREATE TABLE IF NOT EXISTS public.formatos_catalogo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rubro TEXT NOT NULL DEFAULT 'ceramica' CHECK (rubro IN ('ceramica', 'ilustracion')),
  nombre TEXT NOT NULL,
  categoria TEXT,
  medidas TEXT,
  precio_base NUMERIC(12, 2) NOT NULL DEFAULT 0,
  foto_url TEXT,
  orden INTEGER NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Encargos de piezas a medida
CREATE TABLE IF NOT EXISTS public.encargos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  producto_id UUID REFERENCES public.productos(id) ON DELETE SET NULL,
  nombre_contacto TEXT NOT NULL,
  whatsapp_contacto TEXT NOT NULL,
  email_contacto TEXT,
  tipo_catalogo public.tipo_catalogo NOT NULL DEFAULT 'ceramica',
  es_personalizado BOOLEAN NOT NULL DEFAULT FALSE,
  detalle_personalizacion TEXT,
  medida_seleccionada TEXT,
  con_marco BOOLEAN DEFAULT FALSE,
  metodo_entrega TEXT NOT NULL DEFAULT 'taller',
  direccion_envio JSONB,
  precio_estimado NUMERIC(12, 2) NOT NULL DEFAULT 0,
  recargo_personalizado NUMERIC(12, 2) NOT NULL DEFAULT 0,
  adicional_medida NUMERIC(12, 2) NOT NULL DEFAULT 0,
  adicional_marco NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_estimado NUMERIC(12, 2) NOT NULL DEFAULT 0,
  estado public.estado_encargo NOT NULL DEFAULT 'pendiente',
  demora_estimada_dias INTEGER,
  notas_admin TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Items de encargos múltiples
CREATE TABLE IF NOT EXISTS public.items_encargo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encargo_id UUID NOT NULL REFERENCES public.encargos(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES public.productos(id) ON DELETE SET NULL,
  nombre_producto TEXT NOT NULL,
  tipo_catalogo public.tipo_catalogo NOT NULL DEFAULT 'ceramica',
  es_personalizado BOOLEAN DEFAULT FALSE,
  detalle_personalizacion TEXT,
  medida_seleccionada TEXT,
  con_marco BOOLEAN DEFAULT FALSE,
  precio_unitario_base NUMERIC(12, 2) NOT NULL DEFAULT 0,
  recargo_personalizado NUMERIC(12, 2) NOT NULL DEFAULT 0,
  adicional_medida NUMERIC(12, 2) NOT NULL DEFAULT 0,
  adicional_marco NUMERIC(12, 2) NOT NULL DEFAULT 0,
  precio_unitario_final NUMERIC(12, 2) NOT NULL DEFAULT 0,
  cantidad INTEGER NOT NULL DEFAULT 1,
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Portfolio de Colecciones Artísticas
CREATE TABLE IF NOT EXISTS public.portfolio_colecciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rubro TEXT NOT NULL DEFAULT 'ceramica' CHECK (rubro IN ('ceramica', 'ilustracion')),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  portada_url TEXT,
  fotos JSONB NOT NULL DEFAULT '[]'::jsonb,
  disenos_disponibles JSONB NOT NULL DEFAULT '[]'::jsonb,
  orden INTEGER NOT NULL DEFAULT 0,
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Obras & Proyectos Especiales (Murales, Esculturas, B2B)
CREATE TABLE IF NOT EXISTS public.obras_proyectos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria TEXT NOT NULL CHECK (categoria IN ('murales', 'esculturas', 'ilustraciones', 'gran_dimension_b2b', 'miniaturas')),
  titulo TEXT NOT NULL,
  subtitulo TEXT,
  descripcion TEXT,
  cliente_lugar TEXT,
  portada_url TEXT,
  fotos JSONB NOT NULL DEFAULT '[]'::jsonb,
  destacado_home BOOLEAN NOT NULL DEFAULT FALSE,
  orden INTEGER NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. ÍNDICES DE RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_productos_slug ON public.productos (slug);
CREATE INDEX IF NOT EXISTS idx_productos_activo ON public.productos (activo);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON public.productos (categoria_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_usuario ON public.pedidos (usuario_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON public.pedidos (estado);
CREATE INDEX IF NOT EXISTS idx_encargos_usuario ON public.encargos (usuario_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_recordatorio_pendientes 
  ON public.pedidos (estado, created_at, recordatorio_24h_enviado)
  WHERE estado IN ('reservado', 'pendiente_pago');

-- 5. FUNCIONES Y PROCEDIMIENTOS ALMACENADOS (RPC)

-- Trigger al crear un nuevo usuario en auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.perfiles (id, nombre_completo, whatsapp, es_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'nombre_completo', NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'whatsapp', ''),
    FALSE
  )
  ON CONFLICT (id) DO UPDATE
  SET
    nombre_completo = EXCLUDED.nombre_completo,
    whatsapp = EXCLUDED.whatsapp,
    updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Crear pedido con reserva atómica de stock
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

-- Confirmar pago
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

-- Cancelar pedido y restaurar stock
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

-- Expirar pedidos vencidos (cron)
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
  FOR r IN
    SELECT id
    FROM public.pedidos
    WHERE estado IN ('reservado', 'pendiente_pago')
      AND fecha_limite_pago < NOW()
    FOR UPDATE
  LOOP
    FOR item IN
      SELECT producto_id, cantidad
      FROM public.items_pedido
      WHERE pedido_id = r.id
    LOOP
      UPDATE public.productos
      SET stock_disponible = stock_disponible + item.cantidad
      WHERE id = item.producto_id;
    END LOOP;

    UPDATE public.pedidos
    SET estado = 'cancelado'
    WHERE id = r.id;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- Subir comprobante
CREATE OR REPLACE FUNCTION public.subir_comprobante(
  p_pedido_id UUID,
  p_comprobante_url TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.pedidos
  SET comprobante_url = p_comprobante_url
  WHERE id = p_pedido_id
    AND estado IN ('pendiente_pago', 'reservado');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No se encontró el pedido o ya no está pendiente de pago';
  END IF;
END;
$$;

-- 6. HABILITAR ROW LEVEL SECURITY (RLS) OPTIMIZADO
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.producciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.producto_imagenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion_logistica ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion_sitio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion_encargos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formatos_catalogo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encargos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items_encargo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_colecciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obras_proyectos ENABLE ROW LEVEL SECURITY;

-- Políticas de Perfiles
DROP POLICY IF EXISTS "perfiles_select_own" ON public.perfiles;
CREATE POLICY "perfiles_select_own" ON public.perfiles
  FOR SELECT TO authenticated USING (id = (SELECT auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "perfiles_update_own" ON public.perfiles;
CREATE POLICY "perfiles_update_own" ON public.perfiles
  FOR UPDATE TO authenticated USING (id = (SELECT auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "perfiles_insert_own" ON public.perfiles;
CREATE POLICY "perfiles_insert_own" ON public.perfiles
  FOR INSERT TO authenticated WITH CHECK (id = (SELECT auth.uid()) OR public.is_admin());

-- Políticas Públicas de Solo Lectura
DROP POLICY IF EXISTS "categorias_public_read" ON public.categorias;
CREATE POLICY "categorias_public_read" ON public.categorias FOR SELECT TO public USING (TRUE);

DROP POLICY IF EXISTS "producciones_public_read" ON public.producciones;
CREATE POLICY "producciones_public_read" ON public.producciones FOR SELECT TO public USING (activa = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "productos_public_read" ON public.productos;
CREATE POLICY "productos_public_read" ON public.productos FOR SELECT TO public USING (activo = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "producto_imagenes_public_read" ON public.producto_imagenes;
CREATE POLICY "producto_imagenes_public_read" ON public.producto_imagenes FOR SELECT TO public USING (TRUE);

DROP POLICY IF EXISTS "configuracion_logistica_public_read" ON public.configuracion_logistica;
CREATE POLICY "configuracion_logistica_public_read" ON public.configuracion_logistica FOR SELECT TO public USING (activa = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "configuracion_sitio_public_read" ON public.configuracion_sitio;
CREATE POLICY "configuracion_sitio_public_read" ON public.configuracion_sitio FOR SELECT TO public USING (TRUE);

DROP POLICY IF EXISTS "configuracion_encargos_public_read" ON public.configuracion_encargos;
CREATE POLICY "configuracion_encargos_public_read" ON public.configuracion_encargos FOR SELECT TO public USING (TRUE);

DROP POLICY IF EXISTS "formatos_catalogo_public_read" ON public.formatos_catalogo;
CREATE POLICY "formatos_catalogo_public_read" ON public.formatos_catalogo FOR SELECT TO public USING (activo = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "portfolio_colecciones_public_read" ON public.portfolio_colecciones;
CREATE POLICY "portfolio_colecciones_public_read" ON public.portfolio_colecciones FOR SELECT TO public USING (activa = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "obras_proyectos_public_read" ON public.obras_proyectos;
CREATE POLICY "obras_proyectos_public_read" ON public.obras_proyectos FOR SELECT TO public USING (activo = TRUE OR public.is_admin());

-- Políticas de Pedidos
DROP POLICY IF EXISTS "pedidos_insert_public" ON public.pedidos;
CREATE POLICY "pedidos_insert_public" ON public.pedidos FOR INSERT TO public WITH CHECK (TRUE);

DROP POLICY IF EXISTS "pedidos_select_own" ON public.pedidos;
CREATE POLICY "pedidos_select_own" ON public.pedidos FOR SELECT TO public USING (
  usuario_id = (SELECT auth.uid()) OR public.is_admin()
);

DROP POLICY IF EXISTS "items_pedido_select_own" ON public.items_pedido;
CREATE POLICY "items_pedido_select_own" ON public.items_pedido FOR SELECT TO public USING (
  EXISTS (
    SELECT 1 FROM public.pedidos p
    WHERE p.id = items_pedido.pedido_id
      AND (p.usuario_id = (SELECT auth.uid()) OR public.is_admin())
  )
);

DROP POLICY IF EXISTS "items_pedido_insert_public" ON public.items_pedido;
CREATE POLICY "items_pedido_insert_public" ON public.items_pedido FOR INSERT TO public WITH CHECK (TRUE);

-- Políticas de Encargos
DROP POLICY IF EXISTS "encargos_insert_public" ON public.encargos;
CREATE POLICY "encargos_insert_public" ON public.encargos FOR INSERT TO public WITH CHECK (TRUE);

DROP POLICY IF EXISTS "encargos_select_own" ON public.encargos;
CREATE POLICY "encargos_select_own" ON public.encargos FOR SELECT TO public USING (
  usuario_id = (SELECT auth.uid()) 
  OR LOWER((SELECT auth.jwt() ->> 'email')) = LOWER(email_contacto)
  OR public.is_admin()
);

DROP POLICY IF EXISTS "items_encargo_insert_public" ON public.items_encargo;
CREATE POLICY "items_encargo_insert_public" ON public.items_encargo FOR INSERT TO public WITH CHECK (TRUE);

DROP POLICY IF EXISTS "items_encargo_select_public" ON public.items_encargo;
CREATE POLICY "items_encargo_select_public" ON public.items_encargo FOR SELECT TO public USING (TRUE);

-- Políticas de Escritura Total para Administrador
CREATE POLICY "admin_all_categorias" ON public.categorias FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "admin_all_producciones" ON public.producciones FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "admin_all_productos" ON public.productos FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "admin_all_producto_imagenes" ON public.producto_imagenes FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "admin_all_config_logistica" ON public.configuracion_logistica FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "admin_all_pedidos" ON public.pedidos FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "admin_all_items_pedido" ON public.items_pedido FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "admin_all_config_sitio" ON public.configuracion_sitio FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "admin_all_config_encargos" ON public.configuracion_encargos FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "admin_all_formatos_catalogo" ON public.formatos_catalogo FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "admin_all_encargos" ON public.encargos FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "admin_all_items_encargo" ON public.items_encargo FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "admin_all_portfolio" ON public.portfolio_colecciones FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "admin_all_obras" ON public.obras_proyectos FOR ALL TO authenticated USING (public.is_admin());

-- 7. CONFIGURACIÓN DE STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) VALUES
  ('productos', 'productos', TRUE),
  ('comprobantes', 'comprobantes', TRUE),
  ('configuracion', 'configuracion', TRUE),
  ('obras', 'obras', TRUE)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- Políticas de Storage (Acceso y Carga)
DROP POLICY IF EXISTS "Acceso publico lectura storage" ON storage.objects;
CREATE POLICY "Acceso publico lectura storage" ON storage.objects
  FOR SELECT TO public USING (bucket_id IN ('productos', 'configuracion', 'obras', 'comprobantes'));

DROP POLICY IF EXISTS "Carga publica comprobantes" ON storage.objects;
CREATE POLICY "Carga publica comprobantes" ON storage.objects
  FOR INSERT TO public WITH CHECK (bucket_id = 'comprobantes');

DROP POLICY IF EXISTS "Admin control total storage" ON storage.objects;
CREATE POLICY "Admin control total storage" ON storage.objects
  FOR ALL TO authenticated USING (public.is_admin());

-- 8. DATOS BASE ESENCIALES (SEED LIMPIO PARA PRODUCCIÓN)

-- Fila única de configuración del sitio
INSERT INTO public.configuracion_sitio (id)
SELECT 'a1000000-0000-4000-8000-000000000001'
WHERE NOT EXISTS (SELECT 1 FROM public.configuracion_sitio);

-- Fila única de configuración de encargos
INSERT INTO public.configuracion_encargos (id)
SELECT 'e2000000-0000-4000-8000-000000000001'
WHERE NOT EXISTS (SELECT 1 FROM public.configuracion_encargos);

-- Categorías por defecto
INSERT INTO public.categorias (nombre, tipo_catalogo) VALUES
  ('Mates', 'ceramica'),
  ('Tazas & Tazones', 'ceramica'),
  ('Cuencos & Bowls', 'ceramica'),
  ('Platos & Bandejas', 'ceramica'),
  ('Floreros & Jarrones', 'ceramica'),
  ('Velas Aromáticas', 'ceramica'),
  ('Láminas & Prints', 'ilustracion'),
  ('Obras Originales', 'ilustracion'),
  ('Cuadros Enmarcados', 'ilustracion')
ON CONFLICT DO NOTHING;

-- Zonas de logística por defecto
INSERT INTO public.configuracion_logistica (zona_nombre, precio_agencia, precio_domicilio, activa) VALUES
  ('Retiro en Taller (Sunchales, Santa Fe)', 0, 0, TRUE),
  ('Santa Fe & Córdoba (Vía Cargo)', 6500, 9500, TRUE),
  ('Buenos Aires & CABA (Vía Cargo)', 7500, 11500, TRUE),
  ('Resto del País (Vía Cargo)', 8900, 13900, TRUE)
ON CONFLICT DO NOTHING;

-- Formatos del Catálogo Oficial de Cerámica para encargos a medida
INSERT INTO public.formatos_catalogo (rubro, categoria, nombre, medidas, precio_base, orden) VALUES
  ('ceramica', 'Mates', 'Mate Chico', 'forma a elección', 20625, 1),
  ('ceramica', 'Mates', 'Mate Común con Manija', 'con manija', 24375, 2),
  ('ceramica', 'Mates', 'Mate Común', 'forma a elección', 23125, 3),
  ('ceramica', 'Cuencos', 'Cuenco Mini', '8 cm x 4 cm', 11875, 4),
  ('ceramica', 'Cuencos', 'Cuenco Chico', '13 cm x 6 cm', 19125, 5),
  ('ceramica', 'Cuencos', 'Cuenco Mediano', '16 x 9 cm', 27500, 6),
  ('ceramica', 'Cuencos', 'Cazuela Mediana', '14 x 7 cm', 20625, 7),
  ('ceramica', 'Ensaladeras', 'Ensaladera Grande Alta', '23 x 16 cm', 48125, 8),
  ('ceramica', 'Ensaladeras', 'Ensaladera Mediana Baja', '19 x 8 cm', 44000, 9),
  ('ceramica', 'Cuencos', 'Cuenco Cónico', '25 x 16 cm', 34750, 10),
  ('ceramica', 'Cuencos', 'Cuenco Playo (tipo plato hondo)', '17 x 6 cm', 25625, 11),
  ('ceramica', 'Ensaladeras', 'Ensaladera Grande Playa (tipo frutera)', '24 x 8 cm', 49375, 12),
  ('ceramica', 'Platos', 'Plato Grande', '28 cm diám', 36875, 13),
  ('ceramica', 'Platos', 'Plato Cuadrado', '17 x 17 cm', 25625, 14),
  ('ceramica', 'Platos', 'Plato Mediano', '19 cm diám', 23500, 15),
  ('ceramica', 'Platos', 'Plato Corazón', '15 x 16 cm', 21875, 16),
  ('ceramica', 'Platos', 'Plato Tostada', '14 x 11 cm', 19375, 17),
  ('ceramica', 'Bandejas', 'Bandeja Chica con Asas', '21 x 14 cm', 26875, 18),
  ('ceramica', 'Bandejas', 'Bandeja Mediana con Asas', '25 x 16 cm', 33125, 19),
  ('ceramica', 'Bandejas', 'Bandeja Grande con Asas', '30 x 20 cm', 41875, 20),
  ('ceramica', 'Bandejas', 'Bandeja Ovalada Chica', '24 x 13 cm', 25625, 21),
  ('ceramica', 'Bandejas', 'Bandeja Ovalada Mediana', '27 x 15 cm', 31250, 22),
  ('ceramica', 'Bandejas', 'Bandeja Ovalada Grande', '30 x 17 cm', 37500, 23),
  ('ceramica', 'Bandejas', 'Bandeja Rectangular Mediana', '28 x 18 cm', 33750, 24),
  ('ceramica', 'Bandejas', 'Bandeja Rectangular Grande', '35 x 20 cm', 46250, 25),
  ('ceramica', 'Tazas', 'Taza Chica (pocillo)', '150 ml', 16875, 26),
  ('ceramica', 'Tazas', 'Taza Mediana (clásica)', '250 ml', 21875, 27),
  ('ceramica', 'Tazas', 'Tazón Grande', '400 ml', 26875, 28),
  ('ceramica', 'Tazas', 'Vaso Térmico de Cerámica', '300 ml', 23750, 29),
  ('ceramica', 'Jarras', 'Jarra Chica (lechera)', '500 ml', 29375, 30),
  ('ceramica', 'Jarras', 'Jarra Mediana', '1 Litro', 41250, 31),
  ('ceramica', 'Jarras', 'Jarra Grande', '1.5 Litros', 52500, 32),
  ('ceramica', 'Floreros', 'Florero Cilindro Chico', '15 cm alto', 24375, 33),
  ('ceramica', 'Floreros', 'Florero Cilindro Mediano', '20 cm alto', 33125, 34),
  ('ceramica', 'Floreros', 'Florero Botellón', '22 cm alto', 39375, 35),
  ('ceramica', 'Accesorios', 'Jabonera con Drenaje', '12 x 9 cm', 15625, 36),
  ('ceramica', 'Accesorios', 'Portacepillos Dental', '10 cm alto', 17500, 37),
  ('ceramica', 'Accesorios', 'Porta Sahumerio / Vela', '10 cm diám', 14375, 38),
  ('ceramica', 'Accesorios', 'Cuchara de Cerámica', '14 cm largo', 9375, 39)
ON CONFLICT DO NOTHING;

-- Formatos del Catálogo Oficial de Ilustraciones Personalizadas (Cuadro Box con Vidrio)
INSERT INTO public.formatos_catalogo (rubro, categoria, nombre, medidas, precio_base, orden, activo) VALUES
  ('ilustracion', 'Cuadro Box con Vidrio', 'Ilustración Personalizada 10 x 15 cm', '10 x 15 cm (Papel 300g · Marco pino box con vidrio)', 57000, 1, TRUE),
  ('ilustracion', 'Cuadro Box con Vidrio', 'Ilustración Personalizada 13 x 18 cm', '13 x 18 cm (Papel 300g · Marco pino box con vidrio)', 67000, 2, TRUE),
  ('ilustracion', 'Cuadro Box con Vidrio', 'Ilustración Personalizada 15 x 21 cm', '15 x 21 cm (Papel 300g · Marco pino box con vidrio)', 77000, 3, TRUE),
  ('ilustracion', 'Cuadro Box con Vidrio', 'Ilustración Personalizada 20 x 25 cm', '20 x 25 cm (Papel 300g · Marco pino box con vidrio)', 87000, 4, TRUE),
  ('ilustracion', 'Cuadro Box con Vidrio', 'Ilustración Personalizada 30 x 40 cm', '30 x 40 cm (Papel 300g · Marco pino box con vidrio)', 105000, 5, TRUE)
ON CONFLICT DO NOTHING;

-- Actualizar configuración de encargos de ilustraciones según PDF
UPDATE public.configuracion_encargos
SET
  medidas_ilustraciones = '[
    {"id": "10x15", "nombre": "10 x 15 cm (Marco pino box con vidrio)", "precio_simple": 57000, "precio_complejo": 65550, "recargo": 0},
    {"id": "13x18", "nombre": "13 x 18 cm (Marco pino box con vidrio)", "precio_simple": 67000, "precio_complejo": 77050, "recargo": 10000},
    {"id": "15x21", "nombre": "15 x 21 cm (Marco pino box con vidrio)", "precio_simple": 77000, "precio_complejo": 88550, "recargo": 20000},
    {"id": "20x25", "nombre": "20 x 25 cm (Marco pino box con vidrio)", "precio_simple": 87000, "precio_complejo": 100050, "recargo": 30000},
    {"id": "30x40", "nombre": "30 x 40 cm (Marco pino box con vidrio)", "precio_simple": 105000, "precio_complejo": 120750, "recargo": 48000}
  ]'::jsonb,
  porcentaje_recargo_personalizado = 0.15,
  demora_default_dias = 21,
  updated_at = NOW()
WHERE id = 'e2000000-0000-4000-8000-000000000001';

-- Notificar a PostgREST para refrescar el schema
NOTIFY pgrst, 'reload schema';
