import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPedidoById } from "@/lib/supabase/queries";
import { formatPrecio } from "@/lib/pricing";
import type { PedidoConItems } from "@/types";

import { BackButton } from "@/components/ui/back-button";

export default async function PedidoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const pedido = await getPedidoById(id);
  if (!pedido || pedido.usuario_id !== user.id) notFound();

  const p = pedido as PedidoConItems;

  return (
    <div className="max-w-lg space-y-6">
      <div className="mb-4">
        <BackButton fallbackHref="/cuenta/pedidos">Volver a mis pedidos</BackButton>
      </div>
      <h1 className="text-xl font-medium">Pedido #{p.id.slice(0, 8)}</h1>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted">Estado</span>
          <span>{p.estado}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Total</span>
          <span>{formatPrecio(p.total)}</span>
        </div>
      </div>
      <ul className="space-y-3 border-t border-border pt-4">
        {p.items_pedido.map((item) => (
          <li key={item.id} className="flex justify-between text-sm">
            <span>
              {item.productos?.nombre ?? "Producto"} × {item.cantidad}
            </span>
            <span>{formatPrecio(item.precio_unitario_final * item.cantidad)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
