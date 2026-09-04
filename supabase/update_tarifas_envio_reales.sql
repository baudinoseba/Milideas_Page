-- ==============================================================================
-- ACTUALIZACIÓN DE TARIFAS REALES DE ENVÍO (VÍA CARGO)
-- Ejecuta este bloque en el SQL Editor de Supabase para actualizar los valores
-- de configuracion_logistica con las tarifas reales promedio del servicio.
-- ==============================================================================

-- 1. Actualizar zonas existentes si ya fueron creadas previamente con valores antiguos
UPDATE public.configuracion_logistica
SET precio_agencia = 17000, precio_domicilio = 25000, activa = TRUE
WHERE zona_nombre ILIKE '%santa fe%' OR zona_nombre ILIKE '%córdoba%';

UPDATE public.configuracion_logistica
SET precio_agencia = 17000, precio_domicilio = 25000, activa = TRUE
WHERE zona_nombre ILIKE '%buenos aires%' OR zona_nombre ILIKE '%caba%';

UPDATE public.configuracion_logistica
SET precio_agencia = 22000, precio_domicilio = 28000, activa = TRUE
WHERE zona_nombre ILIKE '%resto%';

-- 2. Asegurar que las zonas base existan si la tabla estuviera vacía
INSERT INTO public.configuracion_logistica (zona_nombre, precio_agencia, precio_domicilio, activa)
VALUES
  ('Retiro en Taller (Sunchales, Santa Fe)', 0, 0, TRUE),
  ('Santa Fe & Córdoba (Vía Cargo)', 17000, 25000, TRUE),
  ('Buenos Aires & CABA (Vía Cargo)', 17000, 25000, TRUE),
  ('Resto del País (Vía Cargo)', 22000, 28000, TRUE)
ON CONFLICT DO NOTHING;

-- 3. Consultar las tarifas actualizadas para comprobar
SELECT id, zona_nombre, precio_agencia, precio_domicilio, activa, updated_at
FROM public.configuracion_logistica
ORDER BY precio_agencia ASC;
