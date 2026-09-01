-- Migration: Agregar porcentaje_sena a configuracion_encargos
ALTER TABLE public.configuracion_encargos
  ADD COLUMN IF NOT EXISTS porcentaje_sena NUMERIC(5, 2) DEFAULT 0.20;
