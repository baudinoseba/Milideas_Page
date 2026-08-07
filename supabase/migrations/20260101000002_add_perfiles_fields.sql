-- Add new fields to the perfiles table
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS nombre_usuario TEXT;
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS dni TEXT;
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS direccion_calle TEXT;
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS direccion_numero TEXT;
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS direccion_piso TEXT;
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS direccion_depto TEXT;
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS direccion_ciudad TEXT;
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS direccion_provincia TEXT;
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS direccion_codigo_postal TEXT;
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS direccion_referencia TEXT;
