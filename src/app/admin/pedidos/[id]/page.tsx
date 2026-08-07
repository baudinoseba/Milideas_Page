import { notFound } from "next/navigation";
import { getPedidoById } from "@/lib/supabase/queries";
import { PedidoAdminActions } from "@/components/admin/pedido-admin-actions";
import { isPedidoProximoAVencer } from "@/lib/utils/time";
import { BackButton } from "@/components/ui/back-button";

export default async function AdminPedidoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pedido = await getPedidoById(id);
  if (!pedido) notFound();

  // eslint-disable-next-line react-hooks/purity
  const nowMs = Date.now();
  const proximoAVencer = isPedidoProximoAVencer(
    pedido.estado,
    pedido.fecha_limite_pago,
    nowMs,
  );

  return (
    <div className="max-w-2xl">
      <div className="mb-4">
        <BackButton fallbackHref="/admin/pedidos">Volver a pedidos</BackButton>
      </div>
      <h1 className="mb-6 text-2xl font-semibold">
        Pedido <span className="text-muted">#{pedido.id.slice(0, 8)}</span>
      </h1>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <PedidoAdminActions pedido={pedido as any} proximoAVencer={proximoAVencer} />
    </div>
  );
}
