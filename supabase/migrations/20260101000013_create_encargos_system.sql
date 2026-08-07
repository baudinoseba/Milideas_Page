-- Migration: Create Encargos (Made-to-Order) System

-- 1. Enum para estado de encargos
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_encargo') THEN
    CREATE TYPE public.estado_encargo AS ENUM ('pendiente', 'aceptado', 'en_proceso', 'listo', 'rechazado', 'cancelado');
  END IF;
END $$;

-- 2. Permitir marcar productos como 'es_bajo_pedido'
ALTER TABLE public.productos
  ADD COLUMN IF NOT EXISTS es_bajo_pedido BOOLEAN NOT NULL DEFAULT FALSE;

-- 3. Tabla principal de encargos solicitados
CREATE TABLE IF NOT EXISTS public.encargos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id UUID REFERENCES public.productos(id) ON DELETE SET NULL,
  nombre_contacto TEXT NOT NULL,
  whatsapp_contacto TEXT NOT NULL,
  email_contacto TEXT,
  tipo_catalogo public.tipo_catalogo NOT NULL DEFAULT 'ceramica',
  es_personalizado BOOLEAN NOT NULL DEFAULT FALSE,
  detalle_personalizacion TEXT,
  medida_seleccionada TEXT,
  con_marco BOOLEAN DEFAULT FALSE,
  metodo_entrega TEXT NOT NULL DEFAULT 'taller',
  direccion_envio JSONB,
  precio_estimado NUMERIC(12, 2) NOT NULL DEFAULT 0,
  recargo_personalizado NUMERIC(12, 2) NOT NULL DEFAULT 0,
  adicional_medida NUMERIC(12, 2) NOT NULL DEFAULT 0,
  adicional_marco NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_estimado NUMERIC(12, 2) NOT NULL DEFAULT 0,
  estado public.estado_encargo NOT NULL DEFAULT 'pendiente',
  demora_estimada_dias INTEGER,
  notas_admin TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Tabla para configuraciones del módulo de encargos (medidas, marcos, recargos)
CREATE TABLE IF NOT EXISTS public.configuracion_encargos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medidas_ilustraciones JSONB DEFAULT '[
    {"id": "a4", "nombre": "A4 (21 x 30 cm)", "recargo": 0},
    {"id": "a3", "nombre": "A3 (30 x 42 cm)", "recargo": 5000},
    {"id": "large", "nombre": "Grand Format (50 x 70 cm)", "recargo": 12000}
  ]'::jsonb,
  precio_marco_madera NUMERIC(12, 2) DEFAULT 8500,
  porcentaje_recargo_personalizado NUMERIC(5, 2) DEFAULT 0.15,
  demora_default_dias INTEGER DEFAULT 15,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar fila inicial de configuración
INSERT INTO public.configuracion_encargos (id)
SELECT 'e2000000-0000-4000-8000-000000000001'
WHERE NOT EXISTS (SELECT 1 FROM public.configuracion_encargos);

-- Habilitar RLS
ALTER TABLE public.encargos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion_encargos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Inserción pública de encargos" ON public.encargos;
CREATE POLICY "Inserción pública de encargos" ON public.encargos FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Lectura pública de configuracion_encargos" ON public.configuracion_encargos;
CREATE POLICY "Lectura pública de configuracion_encargos" ON public.configuracion_encargos FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Admin total en encargos" ON public.encargos;
CREATE POLICY "Admin total en encargos" ON public.encargos FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.perfiles WHERE perfiles.id = auth.uid() AND perfiles.es_admin = true)
);

DROP POLICY IF EXISTS "Admin total en configuracion_encargos" ON public.configuracion_encargos;
CREATE POLICY "Admin total en configuracion_encargos" ON public.configuracion_encargos FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.perfiles WHERE perfiles.id = auth.uid() AND perfiles.es_admin = true)
);
