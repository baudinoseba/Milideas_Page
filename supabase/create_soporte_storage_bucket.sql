-- ==============================================================================
-- CREACIÓN DEL BUCKET 'soporte' EN SUPABASE STORAGE
-- Ejecuta este bloque completo en el SQL Editor de Supabase.
-- Habilita la subida y visualización de capturas de pantalla de soporte técnico.
-- ==============================================================================

-- 1. Crear el bucket 'soporte' público
INSERT INTO storage.buckets (id, name, public)
VALUES ('soporte', 'soporte', TRUE)
ON CONFLICT (id) DO UPDATE SET public = TRUE;

-- 2. Asegurar también los otros buckets habituales por si aún no existían
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('comprobantes', 'comprobantes', TRUE),
  ('productos', 'productos', TRUE)
ON CONFLICT (id) DO UPDATE SET public = TRUE;

-- 3. Habilitar política de lectura pública para ver las imágenes desde el correo
DROP POLICY IF EXISTS "Acceso publico lectura soporte" ON storage.objects;
CREATE POLICY "Acceso publico lectura soporte" ON storage.objects
  FOR SELECT TO public USING (bucket_id IN ('soporte', 'comprobantes', 'productos'));

-- 4. Habilitar política de inserción
DROP POLICY IF EXISTS "Carga publica soporte" ON storage.objects;
CREATE POLICY "Carga publica soporte" ON storage.objects
  FOR INSERT TO public WITH CHECK (bucket_id IN ('soporte', 'comprobantes'));

-- 5. Comprobar que los buckets quedaron creados y públicos
SELECT id, name, public, created_at
FROM storage.buckets
WHERE id IN ('soporte', 'comprobantes', 'productos');
