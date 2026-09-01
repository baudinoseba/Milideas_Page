-- Migration: Add 'entregado' to estado_encargo enum
DO $$
BEGIN
  ALTER TYPE public.estado_encargo ADD VALUE IF NOT EXISTS 'entregado';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
