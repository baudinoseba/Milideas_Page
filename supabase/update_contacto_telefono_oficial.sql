-- ==============================================================================
-- ACTUALIZACIÓN COMPLETA DE COLUMNAS Y CONTACTO EN CONFIGURACION_SITIO
-- Ejecuta TODO este bloque completo en el SQL Editor de Supabase
-- ==============================================================================

-- 1. Crear las columnas si aún no existen en la tabla
ALTER TABLE public.configuracion_sitio
  ADD COLUMN IF NOT EXISTS vendedor_whatsapp TEXT DEFAULT '5493493664420',
  ADD COLUMN IF NOT EXISTS email_contacto TEXT DEFAULT 'contacto@milideasarte.com.ar',
  ADD COLUMN IF NOT EXISTS instagram_url TEXT DEFAULT 'https://instagram.com/milideas_arte',
  ADD COLUMN IF NOT EXISTS banco_titular TEXT DEFAULT 'Milagros Anita Ferrero',
  ADD COLUMN IF NOT EXISTS banco_cuit TEXT DEFAULT '27-43717260-4',
  ADD COLUMN IF NOT EXISTS banco_nombre TEXT DEFAULT 'Brubank',
  ADD COLUMN IF NOT EXISTS banco_alias TEXT DEFAULT 'milideasarte',
  ADD COLUMN IF NOT EXISTS banco_cbu TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS taller_direccion TEXT DEFAULT 'Florentino Ameghino 1576',
  ADD COLUMN IF NOT EXISTS taller_ciudad TEXT DEFAULT 'Sunchales',
  ADD COLUMN IF NOT EXISTS taller_provincia TEXT DEFAULT 'Santa Fe',
  ADD COLUMN IF NOT EXISTS taller_codigo_postal TEXT DEFAULT '2322';

-- 2. Asegurar que exista al menos una fila en la tabla
INSERT INTO public.configuracion_sitio (id, vendedor_whatsapp, email_contacto, instagram_url)
VALUES (
  'a1000000-0000-4000-8000-000000000001',
  '5493493664420',
  'contacto@milideasarte.com.ar',
  'https://instagram.com/milideas_arte'
)
ON CONFLICT (id) DO NOTHING;

-- 3. Actualizar la configuración con los datos oficiales de contacto
UPDATE public.configuracion_sitio
SET 
  vendedor_whatsapp = '5493493664420',
  email_contacto = 'contacto@milideasarte.com.ar',
  instagram_url = 'https://instagram.com/milideas_arte',
  updated_at = NOW();

-- 4. Comprobar que todo quedó perfecto
SELECT id, vendedor_whatsapp, email_contacto, instagram_url, updated_at 
FROM public.configuracion_sitio;
