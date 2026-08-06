import { notFound } from "next/navigation";
import { getPedidoById } from "@/lib/supabase/queries";
import { PedidoAdminActions } from "@/components/admin/pedido-admin-actions";
import { isPedidoProximoAVencer } from "@/lib/utils/time";

export default async function AdminPedidoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pedido = await getPedidoById(id);
  if (!pedido) notFound();

  const referenceMs = new Date(pedido.created_at).getTime() + 24 * 60 * 60 * 1000;
  const proximoAVencer = isPedidoProximoAVencer(
    pedido.estado,
    pedido.fecha_limite_pago,
    referenceMs - 12 * 60 * 60 * 1000,
  );

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-medium">
        Pedido #{pedido.id.slice(0, 8)}
      </h1>
      <PedidoAdminActions pedido={pedido} proximoAVencer={proximoAVencer} />
    </div>
  );
}
