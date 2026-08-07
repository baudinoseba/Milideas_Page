-- Migration: Add items_encargo table for multi-item commissions

CREATE TABLE IF NOT EXISTS public.items_encargo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encargo_id UUID NOT NULL REFERENCES public.encargos(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES public.productos(id) ON DELETE SET NULL,
  nombre_producto TEXT NOT NULL,
  tipo_catalogo public.tipo_catalogo NOT NULL DEFAULT 'ceramica',
  es_personalizado BOOLEAN DEFAULT FALSE,
  detalle_personalizacion TEXT,
  medida_seleccionada TEXT,
  con_marco BOOLEAN DEFAULT FALSE,
  precio_unitario_base NUMERIC(12, 2) NOT NULL DEFAULT 0,
  recargo_personalizado NUMERIC(12, 2) NOT NULL DEFAULT 0,
  adicional_medida NUMERIC(12, 2) NOT NULL DEFAULT 0,
  adicional_marco NUMERIC(12, 2) NOT NULL DEFAULT 0,
  precio_unitario_final NUMERIC(12, 2) NOT NULL DEFAULT 0,
  cantidad INTEGER NOT NULL DEFAULT 1,
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.items_encargo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Inserción pública de items_encargo" ON public.items_encargo;
CREATE POLICY "Inserción pública de items_encargo" ON public.items_encargo FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Lectura pública de items_encargo" ON public.items_encargo;
CREATE POLICY "Lectura pública de items_encargo" ON public.items_encargo FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Admin total en items_encargo" ON public.items_encargo;
CREATE POLICY "Admin total en items_encargo" ON public.items_encargo FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.perfiles WHERE perfiles.id = auth.uid() AND perfiles.es_admin = true)
);
