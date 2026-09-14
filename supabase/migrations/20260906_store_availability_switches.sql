-- Migración: Control de Apertura y Cierre de Tienda & Agenda de Encargos (Modo Taller)
-- Permite a la artista pausar independientemente la venta de stock online y la recepción de nuevos encargos.

ALTER TABLE public.configuracion_sitio
  ADD COLUMN IF NOT EXISTS tienda_stock_abierta BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS tienda_stock_mensaje TEXT NOT NULL DEFAULT 'El stock online se encuentra en pausa temporal mientras preparamos nuevas piezas en el taller. Te invitamos a conocer nuestro portfolio de obras y seguirnos en Instagram.',
  ADD COLUMN IF NOT EXISTS encargos_abiertos BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS encargos_mensaje TEXT NOT NULL DEFAULT 'La agenda de encargos personalizados se encuentra completa por el momento. ¡Seguinos en @milideas_arte para enterarte de la próxima apertura de cupos!';

-- Asegurar que el registro singleton existente tenga los valores iniciales configurados si eran NULL
UPDATE public.configuracion_sitio
SET 
  tienda_stock_abierta = COALESCE(tienda_stock_abierta, TRUE),
  tienda_stock_mensaje = COALESCE(tienda_stock_mensaje, 'El stock online se encuentra en pausa temporal mientras preparamos nuevas piezas en el taller. Te invitamos a conocer nuestro portfolio de obras y seguirnos en Instagram.'),
  encargos_abiertos = COALESCE(encargos_abiertos, TRUE),
  encargos_mensaje = COALESCE(encargos_mensaje, 'La agenda de encargos personalizados se encuentra completa por el momento. ¡Seguinos en @milideas_arte para enterarte de la próxima apertura de cupos!')
WHERE id IS NOT NULL;
