-- Habilitar Supabase Realtime para la tabla public.productos
-- Permite que los cambios de stock_disponible (por compras, reservas o admin)
-- se reflejen de inmediato en todos los navegadores conectados sin necesidad de F5 / recargar.

DO $$
BEGIN
  -- Configurar réplica completa para que los payloads de realtime incluyan todos los campos
  ALTER TABLE public.productos REPLICA IDENTITY FULL;

  -- Agregar la tabla productos a la publicación supabase_realtime si no está agregada
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'productos'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.productos;
  END IF;
END $$;
