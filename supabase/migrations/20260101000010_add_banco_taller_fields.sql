-- Migration: Add bank details and taller address fields to configuracion_sitio
ALTER TABLE public.configuracion_sitio
  ADD COLUMN IF NOT EXISTS banco_titular TEXT DEFAULT 'Milagros Anita Ferrero',
  ADD COLUMN IF NOT EXISTS banco_cuit TEXT DEFAULT '27-43717260-4',
  ADD COLUMN IF NOT EXISTS banco_nombre TEXT DEFAULT 'Brubank',
  ADD COLUMN IF NOT EXISTS banco_alias TEXT DEFAULT 'milideasarte',
  ADD COLUMN IF NOT EXISTS banco_cbu TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS taller_direccion TEXT DEFAULT 'Florentino Ameghino 1576',
  ADD COLUMN IF NOT EXISTS taller_ciudad TEXT DEFAULT 'Sunchales',
  ADD COLUMN IF NOT EXISTS taller_provincia TEXT DEFAULT 'Santa Fe',
  ADD COLUMN IF NOT EXISTS taller_codigo_postal TEXT DEFAULT '2322',
  ADD COLUMN IF NOT EXISTS vendedor_whatsapp TEXT DEFAULT '5493493668308';
