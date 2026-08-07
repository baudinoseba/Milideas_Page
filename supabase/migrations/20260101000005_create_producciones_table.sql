-- ====================================================
-- MIGRACIÓN: CREACIÓN DE LA TABLA PRODUCCIONES
-- Separa las Colecciones/Producciones de las Categorías físicas de producto.
-- ====================================================

-- 1. Crear tabla producciones
CREATE TABLE IF NOT EXISTS public.producciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  fecha_lanzamiento TIMESTAMPTZ,
  activa BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Agregar la columna produccion_id en productos (FK opcional)
ALTER TABLE public.productos 
  ADD COLUMN IF NOT EXISTS produccion_id UUID REFERENCES public.producciones(id) ON DELETE SET NULL;

-- 3. Habilitar Row Level Security (RLS)
ALTER TABLE public.producciones ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de RLS
DROP POLICY IF EXISTS "Lectura pública de producciones" ON public.producciones;
CREATE POLICY "Lectura pública de producciones" ON public.producciones
  FOR SELECT TO anon, authenticated
  USING (activa = TRUE OR EXISTS (
    SELECT 1 FROM public.perfiles
    WHERE perfiles.id = auth.uid() AND perfiles.es_admin = true
  ));

DROP POLICY IF EXISTS "Escritura admin en producciones" ON public.producciones;
CREATE POLICY "Escritura admin en producciones" ON public.producciones
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.perfiles
      WHERE perfiles.id = auth.uid() AND perfiles.es_admin = true
    )
  );

-- Index para búsquedas rápidas por producción
CREATE INDEX IF NOT EXISTS idx_productos_produccion_id ON public.productos(produccion_id);
