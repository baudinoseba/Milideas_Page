import Link from "next/link";
import { getAdminPedidos } from "@/lib/supabase/queries";
import { formatPrecio } from "@/lib/pricing";
import { Badge } from "@/components/ui/badge";
import { isPedidoProximoAVencer } from "@/lib/utils/time";

export const metadata = { title: "Pedidos" };

export default async function AdminPedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const { estado } = await searchParams;
  const pedidos = await getAdminPedidos(estado).catch(() => []);
  const nowMs = new Date().toISOString();

  const estados = ["pendiente_pago", "confirmado", "enviado", "cancelado"];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-medium">Pedidos</h1>
      <div className="mb-6 flex gap-2 overflow-x-auto">
        <Link
          href="/admin/pedidos"
          className="shrink-0 rounded-sm border px-3 py-1 text-sm"
        >
          Todos
        </Link>
        {estados.map((e) => (
          <Link
            key={e}
            href={`/admin/pedidos?estado=${e}`}
            className="shrink-0 rounded-sm border px-3 py-1 text-sm"
          >
            {e}
          </Link>
        ))}
      </div>
      <ul className="divide-y divide-border rounded-sm border border-border">
        {pedidos.map((p) => {
          const urgente = isPedidoProximoAVencer(
            p.estado,
            p.fecha_limite_pago,
            new Date(nowMs).getTime(),
          );

          return (
            <li key={p.id}>
              <Link
                href={`/admin/pedidos/${p.id}`}
                className="flex items-center justify-between gap-4 p-4 hover:bg-surface"
              >
                <div>
                  <p className="font-medium">{p.nombre_contacto}</p>
                  <p className="text-xs text-muted">
                    {new Date(p.created_at).toLocaleString("es-AR")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {urgente && <Badge variant="warning">Por vencer</Badge>}
                  <Badge>{p.estado}</Badge>
                  <span className="text-sm">{formatPrecio(p.total)}</span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
