-- RPC: actualizar comprobante (invitado o usuario dueño del pedido)
CREATE OR REPLACE FUNCTION public.actualizar_comprobante(
  p_pedido_id UUID,
  p_comprobante_url TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pedido public.pedidos%ROWTYPE;
BEGIN
  SELECT * INTO v_pedido
  FROM public.pedidos
  WHERE id = p_pedido_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PEDIDO_NO_ENCONTRADO';
  END IF;

  IF v_pedido.estado != 'pendiente_pago' THEN
    RAISE EXCEPTION 'PEDIDO_NO_VALIDO';
  END IF;

  IF v_pedido.usuario_id IS NOT NULL AND v_pedido.usuario_id != auth.uid() THEN
    RAISE EXCEPTION 'NO_AUTORIZADO';
  END IF;

  UPDATE public.pedidos
  SET comprobante_url = p_comprobante_url
  WHERE id = p_pedido_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.actualizar_comprobante TO anon, authenticated;
