-- Migration: Add recordatorio_24h_enviado to pedidos
ALTER TABLE public.pedidos 
  ADD COLUMN IF NOT EXISTS recordatorio_24h_enviado BOOLEAN NOT NULL DEFAULT FALSE;

-- Index to optimize cron job query for pending unpaid orders
CREATE INDEX IF NOT EXISTS idx_pedidos_recordatorio_pendientes 
  ON public.pedidos (estado, created_at, recordatorio_24h_enviado)
  WHERE estado IN ('reservado', 'pendiente_pago');
