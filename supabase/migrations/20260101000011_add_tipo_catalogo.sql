-- Migration: Add tipo_catalogo enum and columns to productos and categorias
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_catalogo') THEN
    CREATE TYPE public.tipo_catalogo AS ENUM ('ceramica', 'esculturas', 'ilustraciones');
  END IF;
END $$;

-- Add tipo_catalogo to productos
ALTER TABLE public.productos
  ADD COLUMN IF NOT EXISTS tipo_catalogo public.tipo_catalogo NOT NULL DEFAULT 'ceramica';

-- Add index for high-performance catalog filtering
CREATE INDEX IF NOT EXISTS idx_productos_tipo_catalogo ON public.productos(tipo_catalogo);

-- Add tipo_catalogo to categorias / producciones
ALTER TABLE public.categorias
  ADD COLUMN IF NOT EXISTS tipo_catalogo public.tipo_catalogo DEFAULT 'ceramica';
