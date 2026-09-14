-- ==============================================================================
-- Migración: Control Unificado de Disponibilidad, Cupo de 30 Días y Realtime
-- ==============================================================================

-- 1. Asegurar que TODAS las columnas de disponibilidad y cupo existan en configuracion_sitio
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

-- 2. Asegurar que ningún campo quede nulo en los registros existentes
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

-- 3. Función RPC para contar piezas de encargos en la ventana artesanal de 30 días corridos
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
  -- Ventana de producción artesanal: últimos 30 días corridos
  v_inicio := NOW() - INTERVAL '30 days';

  -- Sumar piezas desde items_encargo si existen ítems
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

  -- Si por compatibilidad existen encargos sin items_encargo registrados
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

-- 4. Función RPC para calcular el stock físico total disponible por rubro
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

-- 5. Trigger en base de datos: Al insertarse o modificarse un encargo, auto-pausar la tienda por 30 días
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

-- 6. Habilitar Supabase Realtime en configuracion_sitio
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'configuracion_sitio'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.configuracion_sitio;
  END IF;
END $$;

-- 7. EJECUCIÓN INMEDIATA PARA LAS PIEZAS ACTUALES:
-- Si el conteo actual supera el cupo mensual (ej. 63 >= 50), pausar la tienda de inmediato por 30 días.
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

-- 8. Permisos de ejecución de funciones
GRANT EXECUTE ON FUNCTION public.contar_piezas_encargo_mes(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.calcular_stock_total_disponible(TEXT) TO anon, authenticated, service_role;
