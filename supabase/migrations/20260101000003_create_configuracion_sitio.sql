-- Tabla para personalización general del sitio
CREATE TABLE IF NOT EXISTS public.configuracion_sitio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url TEXT,
  hero_titulo TEXT DEFAULT 'Piezas únicas, hechas a mano.',
  hero_subtitulo TEXT DEFAULT 'Cerámica de autor en ediciones limitadas. Cada lanzamiento es único y las piezas se agotan rápidamente.',
  hero_imagen_url TEXT,
  coleccion_destacada_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar fila inicial por defecto si la tabla está vacía
INSERT INTO public.configuracion_sitio (id, hero_titulo, hero_subtitulo)
SELECT 'd1000000-0000-4000-8000-000000000001', 'Piezas únicas, hechas a mano.', 'Cerámica de autor en ediciones limitadas. Cada lanzamiento es único y las piezas se agotan rápidamente.'
WHERE NOT EXISTS (SELECT 1 FROM public.configuracion_sitio);

-- Habilitar RLS
ALTER TABLE public.configuracion_sitio ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
DROP POLICY IF EXISTS "Lectura pública de configuracion_sitio" ON public.configuracion_sitio;
CREATE POLICY "Lectura pública de configuracion_sitio" ON public.configuracion_sitio
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Escritura exclusiva para admin en configuracion_sitio" ON public.configuracion_sitio;
CREATE POLICY "Escritura exclusiva para admin en configuracion_sitio" ON public.configuracion_sitio
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.perfiles
      WHERE perfiles.id = auth.uid() AND perfiles.es_admin = true
    )
  );

-- Crear bucket de storage 'sitio' si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('sitio', 'sitio', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para 'sitio'
DROP POLICY IF EXISTS "Lectura pública de objetos en sitio" ON storage.objects;
CREATE POLICY "Lectura pública de objetos en sitio" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'sitio');

DROP POLICY IF EXISTS "Escritura admin en objetos de sitio" ON storage.objects;
CREATE POLICY "Escritura admin en objetos de sitio" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'sitio' AND
    EXISTS (
      SELECT 1 FROM public.perfiles
      WHERE perfiles.id = auth.uid() AND perfiles.es_admin = true
    )
  );
