-- ==============================================================================
-- ACTUALIZACIÓN DE CONTACTO OFICIAL Y WHATSAPP (3493664420)
-- Ejecutar en el SQL Editor de Supabase (Producción / Test)
-- ==============================================================================

-- 1. Asegurar columnas de contacto si no existen
ALTER TABLE public.configuracion_sitio
  ADD COLUMN IF NOT EXISTS vendedor_whatsapp TEXT DEFAULT '5493493664420',
  ADD COLUMN IF NOT EXISTS email_contacto TEXT DEFAULT 'contacto@milideasarte.com.ar',
  ADD COLUMN IF NOT EXISTS instagram_url TEXT DEFAULT 'https://instagram.com/milideas_arte';

-- 2. Actualizar la fila única de configuración del sitio con el nuevo número y datos
UPDATE public.configuracion_sitio
SET 
  vendedor_whatsapp = '5493493664420',
  email_contacto = 'contacto@milideasarte.com.ar',
  instagram_url = 'https://instagram.com/milideas_arte',
  updated_at = NOW();

-- 3. Confirmar resultado
SELECT id, vendedor_whatsapp, email_contacto, instagram_url, updated_at 
FROM public.configuracion_sitio;
