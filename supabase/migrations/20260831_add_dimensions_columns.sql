-- ==============================================================================
-- MIGRACIÓN: Agregar columnas de medidas, técnica y atributos a tabla productos
-- ==============================================================================

ALTER TABLE public.productos 
ADD COLUMN IF NOT EXISTS alto_cm NUMERIC,
ADD COLUMN IF NOT EXISTS ancho_cm NUMERIC,
ADD COLUMN IF NOT EXISTS capacidad_ml NUMERIC,
ADD COLUMN IF NOT EXISTS material_tecnica TEXT,
ADD COLUMN IF NOT EXISTS atributos_especificos JSONB DEFAULT '{}'::jsonb;

-- Notificar a PostgREST para refrescar el schema cache
NOTIFY pgrst, 'reload schema';
