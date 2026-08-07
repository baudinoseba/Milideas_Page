-- Migration: Add dimensions fields (alto_cm, ancho_cm, dimensiones) to productos table
ALTER TABLE productos ADD COLUMN IF NOT EXISTS alto_cm NUMERIC NULL;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS ancho_cm NUMERIC NULL;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS dimensiones TEXT NULL;
