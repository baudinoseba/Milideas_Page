"use client";

import { useTransition } from "react";
import Link from "next/link";
import { formatPrecio } from "@/lib/pricing";
import { confirmarPagoAction, marcarEnviadoAction } from "@/lib/actions";

interface DashboardPedidosListProps {
  pedidos: any[];
}

export function DashboardPedidosList({ pedidos }: DashboardPedidosListProps) {
  const [isPending, startTransition] = useTransition();

  const ahora = Date.now();
  const DOS_DIAS_MS = 48 * 60 * 60 * 1000;

  const handleConfirmarPago = (id: string, cliente: string) => {
    if (!confirm(`¿Confirmar recepción de pago para el pedido de ${cliente}?`)) return;
    startTransition(async () => {
      await confirmarPagoAction(id);
      window.location.reload();
    });
  };

  const handleMarcarDespachado = (id: string, esRetiro: boolean) => {
    const texto = esRetiro
      ? "¿Marcar pedido como entregado al cliente en el taller?"
      : "¿Marcar pedido como despachado / enviado por correo?";
    if (!confirm(texto)) return;
    startTransition(async () => {
      await marcarEnviadoAction(id);
      window.location.reload();
    });
  };

  if (pedidos.length === 0) {
    return (
      <div className="rounded-3xl border border-border/60 bg-arena/20 p-8 text-center text-xs text-muted">
        <p className="text-2xl mb-1">📦</p>
        <p className="font-semibold text-chocolate">No hay pedidos registrados recientemente.</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-border/60 bg-surface divide-y divide-border/40 shadow-xs overflow-hidden">
      {pedidos.map((pedido: any) => {
        const diffMs = ahora - new Date(pedido.created_at).getTime();
        const esDemorado = pedido.estado === "pendiente_pago" && diffMs > DOS_DIAS_MS;
        const dias = Math.floor(diffMs / (24 * 60 * 60 * 1000));
        
        const items = pedido.items_pedido || [];
        const esRetiro =
          String(pedido.tipo_envio || "").toLowerCase().includes("retiro") ||
          String(pedido.costo_envio) === "0";

        // Teléfono limpio para WhatsApp
        const telLimpio = String(pedido.whatsapp_contacto || "").replace(/\D/g, "");

        return (
          <div
            key={pedido.id}
            className={`p-4 sm:p-5 transition-colors space-y-3 ${
              esDemorado
                ? "bg-rose-50/40 dark:bg-rose-950/20 hover:bg-rose-50/60"
                : "hover:bg-arena/10"
            }`}
          >
            {/* Fila 1: Cliente, Badges de Entrega y Estado */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-chocolate">
                  {pedido.nombre_contacto || "Cliente"}
                </span>

                {/* Badge de Entrega: Retiro vs Envío */}
                {esRetiro ? (
                  <span className="rounded-full bg-amber-100/90 text-amber-900 border border-amber-300/80 px-2.5 py-0.5 text-[11px] font-bold flex items-center gap-1">
                    <span>🏠</span> Retiro en taller
                  </span>
                ) : (
                  <span className="rounded-full bg-sky-100/90 text-sky-900 border border-sky-300/80 px-2.5 py-0.5 text-[11px] font-bold flex items-center gap-1">
                    <span>🚚</span> Envío a domicilio
                  </span>
                )}

                {/* Badge de Estado del Pago / Pedido */}
                {pedido.estado === "pendiente_pago" ? (
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      esDemorado
                        ? "bg-rose-600 text-white shadow-xs"
                        : "bg-amber-100 text-amber-950 border border-amber-300"
                    }`}
                  >
                    {esDemorado ? `🚨 Sin pagar (${dias} días)` : "⏳ Esperando Pago"}
                  </span>
                ) : pedido.estado === "confirmado" ? (
                  <span className="rounded-full bg-emerald-100 text-emerald-950 border border-emerald-300 px-2.5 py-0.5 text-[11px] font-bold">
                    ✓ Pago Confirmado {esRetiro ? "(Listo para retirar)" : "(Listo para empaque)"}
                  </span>
                ) : pedido.estado === "enviado" ? (
                  <span className="rounded-full bg-secondary text-chocolate border border-border px-2.5 py-0.5 text-[11px] font-medium">
                    ✓ {esRetiro ? "Entregado en taller" : "Despachado"}
                  </span>
                ) : (
                  <span className="rounded-full bg-secondary/80 text-muted px-2.5 py-0.5 text-[10px]">
                    {pedido.estado}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-muted font-sans self-start sm:self-auto">
                <span>
                  {new Date(pedido.created_at).toLocaleDateString("es-AR", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span>·</span>
                <span className="font-mono font-bold text-chocolate text-sm">
                  {formatPrecio(pedido.total)}
                </span>
              </div>
            </div>

            {/* Fila 2: Lista Visual de Piezas Compradas */}
            <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
              {items.map((it: any, i: number) => {
                const prod = it.productos;
                const fotoUrl = prod?.producto_imagenes?.[0]?.url_imagen;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-2 bg-surface border border-border/80 rounded-2xl p-1.5 pr-3 shrink-0 shadow-2xs"
                  >
                    <div className="h-9 w-9 rounded-xl bg-arena/40 overflow-hidden flex items-center justify-center text-sm shrink-0">
                      {fotoUrl ? (
                        <img src={fotoUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span>🏺</span>
                      )}
                    </div>
                    <div className="min-w-0 text-xs">
                      <p className="font-semibold text-chocolate truncate max-w-[140px]">
                        {prod?.nombre || "Pieza de autor"}
                      </p>
                      <p className="text-[10px] text-muted">
                        Cantidad: <span className="font-bold text-terracota">{it.cantidad || 1} u.</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Fila 3: Botones de Acción Rápida Inline */}
            <div className="flex items-center justify-between pt-1 border-t border-border/40 gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                {telLimpio && (
                  <a
                    href={`https://wa.me/${telLimpio}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-800 border border-emerald-300/60 px-3 py-1 text-xs font-semibold transition-colors"
                  >
                    <span>💬</span> WhatsApp
                  </a>
                )}
                {pedido.comprobante_url && (
                  <a
                    href={pedido.comprobante_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-xl bg-surface border border-border px-3 py-1 text-xs text-chocolate hover:bg-secondary/40 font-medium"
                  >
                    <span>📎</span> Comprobante
                  </a>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Botón Acción 1: Confirmar Pago en 1 Clic */}
                {pedido.estado === "pendiente_pago" && (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleConfirmarPago(pedido.id, pedido.nombre_contacto)}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1 text-xs font-semibold shadow-xs cursor-pointer transition-all disabled:opacity-50"
                  >
                    ✓ Confirmar Pago
                  </button>
                )}

                {/* Botón Acción 2: Marcar Despachado / Retirado en 1 Clic */}
                {pedido.estado === "confirmado" && (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleMarcarDespachado(pedido.id, esRetiro)}
                    className="rounded-xl bg-terracota hover:bg-terracota/90 text-white px-3.5 py-1 text-xs font-semibold shadow-xs cursor-pointer transition-all disabled:opacity-50"
                  >
                    {esRetiro ? "🏠 Marcar como Retirado" : "📦 Marcar como Despachado"}
                  </button>
                )}

                <Link
                  href={`/admin/pedidos/${pedido.id}`}
                  className="rounded-xl border border-border bg-surface px-3 py-1 text-xs text-chocolate hover:bg-secondary/40 font-semibold shadow-2xs"
                >
                  Ver detalle →
                </Link>
              </div>
            </div>

          </div>
        );
      })}
    </div>
  );
}
