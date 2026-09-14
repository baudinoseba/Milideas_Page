-- ==============================================================================
-- MIGRACIÓN CONSOLIDADA PARA PRODUCCIÓN - MILIDEAS ARTE
-- Contiene todas las actualizaciones de base de datos pendientes:
-- 1. Auditoría Legal & Compliance (Ley 24.240 y Disp. 954/2025):
--    - Botón y Solicitudes de Arrepentimiento
--    - Trazabilidad y Aceptación de Términos
--    - Registro de Auditoría de Estados de Pedidos (Audit Log)
--    - Plazo de Reserva Estricta de 24 Horas
-- 2. Sistema de Disponibilidad, Cupos Mensuales (~50 u.) y Pausa por 30 Días:
--    - Control Diferenciado e Independiente de Cerámica vs Ilustración
--    - Ventana Rodante de Producción Artesanal de 30 Días
--    - Trigger Automático de Cierre al Alcanzar el Cupo
--    - Sincronización en Tiempo Real (Supabase Realtime) sin recargar la página
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- PARTE 1: AUDITORÍA LEGAL & COMPLIANCE
-- ------------------------------------------------------------------------------

-- 1.1 Tabla de Solicitudes de Arrepentimiento
CREATE TABLE IF NOT EXISTS public.solicitudes_arrepentimiento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_tramite TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  contacto TEXT NOT NULL,
  email TEXT,
  pedido_numero TEXT,
  producto TEXT NOT NULL,
  motivo TEXT,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'contactado', 'resuelto', 'rechazado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.solicitudes_arrepentimiento ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir insercion publica de solicitudes de arrepentimiento" ON public.solicitudes_arrepentimiento;
CREATE POLICY "Permitir insercion publica de solicitudes de arrepentimiento"
  ON public.solicitudes_arrepentimiento
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir lectura y gestion a administradores" ON public.solicitudes_arrepentimiento;
CREATE POLICY "Permitir lectura y gestion a administradores"
  ON public.solicitudes_arrepentimiento
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.perfiles
      WHERE perfiles.id = auth.uid() AND perfiles.es_admin = true
    )
  );

-- 1.2 Trazabilidad de Términos y Reserva de 24 Horas en Pedidos
ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS terminos_version TEXT DEFAULT '2026-v1',
  ADD COLUMN IF NOT EXISTS terminos_aceptados_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.pedidos
  ALTER COLUMN fecha_limite_pago SET DEFAULT (NOW() + INTERVAL '24 hours');

-- 1.3 Tabla de Audit Log para Trazabilidad de Estados de Pedidos
CREATE TABLE IF NOT EXISTS public.pedidos_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  estado_anterior public.estado_pedido,
  estado_nuevo public.estado_pedido,
  cambiado_por UUID,
  detalles JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.pedidos_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Solo administradores pueden ver audit log" ON public.pedidos_audit_log;
CREATE POLICY "Solo administradores pueden ver audit log"
  ON public.pedidos_audit_log
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.perfiles
      WHERE perfiles.id = auth.uid() AND perfiles.es_admin = true
    )
  );

CREATE OR REPLACE FUNCTION public.trg_pedidos_audit_estado()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.estado IS DISTINCT FROM NEW.estado) THEN
    INSERT INTO public.pedidos_audit_log (
      pedido_id,
      estado_anterior,
      estado_nuevo,
      cambiado_por,
      detalles
    ) VALUES (
      NEW.id,
      OLD.estado,
      NEW.estado,
      auth.uid(),
      jsonb_build_object(
        'motivo', 'Cambio de estado del pedido',
        'comprobante_url', NEW.comprobante_url
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_pedidos_audit_estado ON public.pedidos;
CREATE TRIGGER trg_pedidos_audit_estado
  AFTER UPDATE ON public.pedidos
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_pedidos_audit_estado();


-- ------------------------------------------------------------------------------
-- PARTE 2: CONTROL DE DISPONIBILIDAD, CUPOS Y PAUSA POR 30 DÍAS
-- ------------------------------------------------------------------------------

-- 2.1 Columnas en configuracion_sitio
ALTER TABLE public.configuracion_sitio
  ADD COLUMN IF NOT EXISTS stock_ceramica_abierto BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS encargos_ceramica_abiertos BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS stock_ilustracion_abierto BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS encargos_ilustracion_abiertos BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS cupo_mensual_total INTEGER NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS cupo_mensual_ceramica INTEGER NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS cupo_mensual_ilustracion INTEGER NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS encargos_pausado_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS encargos_pausado_hasta TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS encargos_ceramica_pausado_mes TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS encargos_ilustracion_pausado_mes TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS auto_pausar_stock_agotado BOOLEAN NOT NULL DEFAULT TRUE;

-- 2.2 Asegurar que no queden nulos en configuracion_sitio
UPDATE public.configuracion_sitio
SET 
  stock_ceramica_abierto = COALESCE(stock_ceramica_abierto, TRUE),
  encargos_ceramica_abiertos = COALESCE(encargos_ceramica_abiertos, TRUE),
  stock_ilustracion_abierto = COALESCE(stock_ilustracion_abierto, TRUE),
  encargos_ilustracion_abiertos = COALESCE(encargos_ilustracion_abiertos, TRUE),
  cupo_mensual_total = COALESCE(cupo_mensual_total, 50),
  cupo_mensual_ceramica = COALESCE(cupo_mensual_ceramica, 50),
  cupo_mensual_ilustracion = COALESCE(cupo_mensual_ilustracion, 50),
  auto_pausar_stock_agotado = COALESCE(auto_pausar_stock_agotado, TRUE)
WHERE id IS NOT NULL;

-- 2.3 RPC Conteo de Piezas en Ventana de Producción de 30 Días Corridos
CREATE OR REPLACE FUNCTION public.contar_piezas_encargo_mes(p_tipo TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inicio TIMESTAMPTZ;
  v_total INTEGER := 0;
BEGIN
  -- Ventana de producción rodante: últimos 30 días corridos
  v_inicio := NOW() - INTERVAL '30 days';

  SELECT COALESCE(SUM(ie.cantidad), 0)
  INTO v_total
  FROM public.items_encargo ie
  JOIN public.encargos e ON ie.encargo_id = e.id
  WHERE e.created_at >= v_inicio
    AND e.estado != 'cancelado'
    AND (
      p_tipo IS NULL 
      OR (p_tipo = 'ceramica' AND ie.tipo_catalogo::TEXT = 'ceramica')
      OR (p_tipo IN ('ilustracion', 'ilustraciones') AND ie.tipo_catalogo::TEXT = 'ilustraciones')
    );

  -- Fallback de compatibilidad si existen encargos sin items_encargo registrados
  IF v_total = 0 THEN
    SELECT COALESCE(COUNT(*), 0)
    INTO v_total
    FROM public.encargos e
    WHERE e.created_at >= v_inicio
      AND e.estado != 'cancelado'
      AND (
        p_tipo IS NULL 
        OR (p_tipo = 'ceramica' AND e.tipo_catalogo::TEXT = 'ceramica')
        OR (p_tipo IN ('ilustracion', 'ilustraciones') AND e.tipo_catalogo::TEXT = 'ilustraciones')
      );
  END IF;

  RETURN v_total;
END;
$$;

-- 2.4 RPC Cálculo de Stock Físico Disponible
CREATE OR REPLACE FUNCTION public.calcular_stock_total_disponible(p_tipo TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stock INTEGER := 0;
BEGIN
  SELECT COALESCE(SUM(stock_disponible), 0)
  INTO v_stock
  FROM public.productos
  WHERE activo = TRUE
    AND (
      p_tipo IS NULL
      OR (p_tipo = 'ceramica' AND tipo_catalogo::TEXT = 'ceramica')
      OR (p_tipo IN ('ilustracion', 'ilustraciones') AND tipo_catalogo::TEXT = 'ilustraciones')
    );

  RETURN v_stock;
END;
$$;

-- 2.5 Trigger en Base de Datos: Auto-Pausar por 30 Días al Alcanzar el Cupo
CREATE OR REPLACE FUNCTION public.fn_auto_pausar_cupo_taller()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_piezas_totales INTEGER := 0;
  v_cupo_max INTEGER := 50;
  v_cfg_id UUID;
BEGIN
  SELECT id, COALESCE(cupo_mensual_total, 50)
  INTO v_cfg_id, v_cupo_max
  FROM public.configuracion_sitio
  LIMIT 1;

  IF v_cfg_id IS NOT NULL THEN
    v_piezas_totales := public.contar_piezas_encargo_mes(NULL);

    IF v_piezas_totales >= v_cupo_max THEN
      UPDATE public.configuracion_sitio
      SET 
        encargos_ceramica_abiertos = FALSE,
        encargos_ilustracion_abiertos = FALSE,
        encargos_pausado_at = COALESCE(encargos_pausado_at, NOW()),
        encargos_pausado_hasta = COALESCE(encargos_pausado_hasta, NOW() + INTERVAL '30 days'),
        updated_at = NOW()
      WHERE id = v_cfg_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_auto_pausar_cupo_encargos ON public.encargos;
CREATE TRIGGER tr_auto_pausar_cupo_encargos
  AFTER INSERT OR UPDATE OF estado ON public.encargos
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_auto_pausar_cupo_taller();

DROP TRIGGER IF EXISTS tr_auto_pausar_cupo_items ON public.items_encargo;
CREATE TRIGGER tr_auto_pausar_cupo_items
  AFTER INSERT ON public.items_encargo
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_auto_pausar_cupo_taller();

-- 2.6 Habilitar Supabase Realtime para configuracion_sitio
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'configuracion_sitio'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.configuracion_sitio;
  END IF;
END $$;

-- 2.7 PAUSA INMEDIATA SI YA SE SUPERÓ EL CUPO (Ej. 63 >= 50 piezas):
DO $$
DECLARE
  v_piezas INTEGER := 0;
  v_cupo INTEGER := 50;
  v_cfg_id UUID;
BEGIN
  v_piezas := public.contar_piezas_encargo_mes(NULL);
  
  SELECT id, COALESCE(cupo_mensual_total, 50)
  INTO v_cfg_id, v_cupo
  FROM public.configuracion_sitio
  LIMIT 1;

  IF v_cfg_id IS NOT NULL AND v_piezas >= v_cupo THEN
    UPDATE public.configuracion_sitio
    SET 
      encargos_ceramica_abiertos = FALSE,
      encargos_ilustracion_abiertos = FALSE,
      encargos_pausado_at = NOW(),
      encargos_pausado_hasta = NOW() + INTERVAL '30 days',
      updated_at = NOW()
    WHERE id = v_cfg_id;
  END IF;
END $$;

-- 2.8 Permisos de Ejecución
GRANT EXECUTE ON FUNCTION public.contar_piezas_encargo_mes(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.calcular_stock_total_disponible(TEXT) TO anon, authenticated, service_role;
