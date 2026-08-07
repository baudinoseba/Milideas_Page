-- Migration: Add tipo_catalogo to producciones and atributos_especificos to productos

-- 1. Add tipo_catalogo column to producciones table
ALTER TABLE public.producciones
  ADD COLUMN IF NOT EXISTS tipo_catalogo public.tipo_catalogo NOT NULL DEFAULT 'ceramica';

-- 2. Add JSONB column for dynamic catalog-specific attributes in productos table
ALTER TABLE public.productos
  ADD COLUMN IF NOT EXISTS atributos_especificos JSONB DEFAULT '{}'::jsonb;

-- 3. Add explicit columns for common attributes for high-performance filtering & structured queries
ALTER TABLE public.productos
  ADD COLUMN IF NOT EXISTS material_tecnica TEXT,
  ADD COLUMN IF NOT EXISTS papel_soporte TEXT,
  ADD COLUMN IF NOT EXISTS tamano_lamina TEXT,
  ADD COLUMN IF NOT EXISTS capacidad_ml INTEGER,
  ADD COLUMN IF NOT EXISTS edicion_numerada TEXT,
  ADD COLUMN IF NOT EXISTS marco_incluido BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS pedestal_incluido BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS apto_lavavajillas BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS apto_microondas BOOLEAN DEFAULT TRUE;
