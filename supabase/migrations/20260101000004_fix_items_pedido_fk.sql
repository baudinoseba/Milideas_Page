-- Permitir que producto_id en items_pedido sea NULL al eliminar un producto
ALTER TABLE public.items_pedido ALTER COLUMN producto_id DROP NOT NULL;

-- Cambiar constraint de clave foránea a ON DELETE SET NULL
ALTER TABLE public.items_pedido
  DROP CONSTRAINT IF EXISTS items_pedido_producto_id_fkey,
  ADD CONSTRAINT items_pedido_producto_id_fkey
    FOREIGN KEY (producto_id)
    REFERENCES public.productos (id)
    ON DELETE SET NULL;

-- Habilitar políticas de UPDATE y DELETE para administradores en items_pedido
DROP POLICY IF EXISTS "items_admin_update" ON public.items_pedido;
CREATE POLICY "items_admin_update" ON public.items_pedido
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.perfiles
      WHERE perfiles.id = auth.uid() AND perfiles.es_admin = true
    )
  );

DROP POLICY IF EXISTS "items_admin_delete" ON public.items_pedido;
CREATE POLICY "items_admin_delete" ON public.items_pedido
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.perfiles
      WHERE perfiles.id = auth.uid() AND perfiles.es_admin = true
    )
  );
