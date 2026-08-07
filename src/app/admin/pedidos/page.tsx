import Link from "next/link";
import { getAdminPedidos } from "@/lib/supabase/queries";
import { formatPrecio } from "@/lib/pricing";
import { Badge } from "@/components/ui/badge";
import { isPedidoProximoAVencer, formatTiempoRestanteVencimiento } from "@/lib/utils/time";

export const metadata = { title: "Pedidos" };

const estadoConfig: Record<
  string,
  { label: string; variant: "default" | "success" | "warning" | "muted" }
> = {
  reservado: { label: "Reservado (48h)", variant: "warning" },
  pendiente_pago: { label: "Pendiente de pago", variant: "warning" },
  confirmado: { label: "Confirmado", variant: "success" },
  enviado: { label: "Enviado", variant: "default" },
  cancelado: { label: "Cancelado", variant: "muted" },
};

const estados = ["reservado", "confirmado", "enviado", "cancelado"];

export default async function AdminPedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const { estado } = await searchParams;
  const pedidos = await getAdminPedidos(estado).catch(() => []);
  // eslint-disable-next-line react-hooks/purity
  const nowMs = Date.now();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Pedidos</h1>
        <p className="mt-1 text-sm text-muted">
          {pedidos.length} pedido{pedidos.length !== 1 ? "s" : ""}
          {estado ? ` con estado "${estadoConfig[estado]?.label ?? estado}"` : ""}
        </p>
      </div>

      {/* Filter tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        <Link
          href="/admin/pedidos"
          className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            !estado
              ? "bg-foreground text-background"
              : "border border-border text-muted hover:text-foreground hover:bg-surface"
          }`}
        >
          Todos
        </Link>
        {estados.map((e) => {
          const config = estadoConfig[e];
          const isActive = estado === e;
          return (
            <Link
              key={e}
              href={`/admin/pedidos?estado=${e}`}
              className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-foreground text-background"
                  : "border border-border text-muted hover:text-foreground hover:bg-surface"
              }`}
            >
              {config?.label ?? e}
            </Link>
          );
        })}
      </div>

      {/* Pedidos list */}
      {pedidos.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border p-12 text-center">
          <p className="text-3xl mb-3">📦</p>
          <p className="text-lg font-medium">No hay pedidos</p>
          <p className="mt-1 text-sm text-muted">
            {estado
              ? "No hay pedidos con este estado. Probá otro filtro."
              : "Cuando un cliente haga una compra, sus pedidos aparecerán acá."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {pedidos.map((p) => {
            const urgente = isPedidoProximoAVencer(
              p.estado,
              p.fecha_limite_pago,
              nowMs,
            );
            const config = estadoConfig[p.estado] ?? {
              label: p.estado,
              variant: "default" as const,
            };

            return (
              <Link
                key={p.id}
                href={`/admin/pedidos/${p.id}`}
                className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface p-4 transition-all hover:border-admin-accent hover:shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">
                      {p.nombre_contacto}
                    </p>
                    {p.estado === "pendiente_pago" && (
                      <Badge variant={urgente ? "warning" : "muted"}>
                        ⏰ {formatTiempoRestanteVencimiento(p.fecha_limite_pago, nowMs)}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted">
                    #{p.id.slice(0, 8)} ·{" "}
                    {new Date(p.created_at).toLocaleString("es-AR")} ·{" "}
                    {p.items_pedido.length} item
                    {p.items_pedido.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant={config.variant}>{config.label}</Badge>
                  <span className="text-sm font-medium">
                    {formatPrecio(p.total)}
                  </span>
                  <span className="text-muted">→</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
