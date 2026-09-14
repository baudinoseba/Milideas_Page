-- Migración: Auditoría Legal y Compliance
-- 1. Tabla de solicitudes de arrepentimiento (Disposición 954/2025 y Art. 34 Ley 24.240)
CREATE TABLE IF NOT EXISTS public.solicitudes_arrepentimiento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_tramite TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  contacto TEXT NOT NULL,
  email TEXT,
  pedido_numero TEXT,
  producto TEXT NOT NULL,
  motivo TEXT,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'contactado', 'resuelto', 'rechazado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar RLS en solicitudes_arrepentimiento
ALTER TABLE public.solicitudes_arrepentimiento ENABLE ROW LEVEL SECURITY;

-- Política: Inserción pública permitida para que cualquier consumidor pueda ejercer su derecho sin login obligatorio
DROP POLICY IF EXISTS "Permitir insercion publica de solicitudes de arrepentimiento" ON public.solicitudes_arrepentimiento;
CREATE POLICY "Permitir insercion publica de solicitudes de arrepentimiento"
  ON public.solicitudes_arrepentimiento
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Política: Administradores pueden ver y gestionar las solicitudes
DROP POLICY IF EXISTS "Permitir lectura y gestion a administradores" ON public.solicitudes_arrepentimiento;
CREATE POLICY "Permitir lectura y gestion a administradores"
  ON public.solicitudes_arrepentimiento
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.perfiles
      WHERE perfiles.id = auth.uid() AND perfiles.es_admin = true
    )
  );

-- 2. Trazabilidad de Aceptación de Términos y Condiciones en Pedidos
ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS terminos_version TEXT DEFAULT '2026-v1',
  ADD COLUMN IF NOT EXISTS terminos_aceptados_at TIMESTAMPTZ DEFAULT NOW();

-- Asegurar reserva estricta de 24 horas por defecto en pedidos
ALTER TABLE public.pedidos
  ALTER COLUMN fecha_limite_pago SET DEFAULT (NOW() + INTERVAL '24 hours');

-- 3. Tabla de Audit Log para Trazabilidad de Estados de Pedidos (Art. 53 Ley 24.240)
CREATE TABLE IF NOT EXISTS public.pedidos_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  estado_anterior public.estado_pedido,
  estado_nuevo public.estado_pedido,
  cambiado_por UUID,
  detalles JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.pedidos_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Solo administradores pueden ver audit log" ON public.pedidos_audit_log;
CREATE POLICY "Solo administradores pueden ver audit log"
  ON public.pedidos_audit_log
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.perfiles
      WHERE perfiles.id = auth.uid() AND perfiles.es_admin = true
    )
  );

-- Trigger para registrar cambios de estado en pedidos automáticamente
CREATE OR REPLACE FUNCTION public.trg_pedidos_audit_estado()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.estado IS DISTINCT FROM NEW.estado) THEN
    INSERT INTO public.pedidos_audit_log (
      pedido_id,
      estado_anterior,
      estado_nuevo,
      cambiado_por,
      detalles
    ) VALUES (
      NEW.id,
      OLD.estado,
      NEW.estado,
      auth.uid(),
      jsonb_build_object(
        'motivo', 'Cambio de estado del pedido',
        'comprobante_url', NEW.comprobante_url
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_pedidos_audit_estado ON public.pedidos;
CREATE TRIGGER trg_pedidos_audit_estado
  AFTER UPDATE ON public.pedidos
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_pedidos_audit_estado();
