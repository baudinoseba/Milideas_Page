-- Migración: Control de Disponibilidad Diferenciado (Cerámica vs Ilustración)
-- Permite a Mili pausar de forma independiente el stock y los encargos para cada rubro.

ALTER TABLE public.configuracion_sitio
  ADD COLUMN IF NOT EXISTS stock_ceramica_abierto BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS encargos_ceramica_abiertos BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS stock_ilustracion_abierto BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS encargos_ilustracion_abiertos BOOLEAN NOT NULL DEFAULT TRUE;

-- Limpieza opcional de las columnas generales no editables previas
ALTER TABLE public.configuracion_sitio
  DROP COLUMN IF EXISTS tienda_stock_abierta,
  DROP COLUMN IF EXISTS tienda_stock_mensaje,
  DROP COLUMN IF EXISTS encargos_abiertos,
  DROP COLUMN IF EXISTS encargos_mensaje;

-- Asegurar que el registro singleton existente tenga todas las banderas en TRUE si eran NULL
UPDATE public.configuracion_sitio
SET 
  stock_ceramica_abierto = COALESCE(stock_ceramica_abierto, TRUE),
  encargos_ceramica_abiertos = COALESCE(encargos_ceramica_abiertos, TRUE),
  stock_ilustracion_abierto = COALESCE(stock_ilustracion_abierto, TRUE),
  encargos_ilustracion_abiertos = COALESCE(encargos_ilustracion_abiertos, TRUE)
WHERE id IS NOT NULL;
