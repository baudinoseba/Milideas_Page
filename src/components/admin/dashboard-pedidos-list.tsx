"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { formatPrecio } from "@/lib/pricing";
import { confirmarPagoAction, marcarEnviadoAction } from "@/lib/actions";

interface DashboardPedidosListProps {
  pedidos: any[];
}

export function DashboardPedidosList({ pedidos }: DashboardPedidosListProps) {
  const [isPending, startTransition] = useTransition();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [ahora] = useState(() => Date.now());
  const UN_DIA_MS = 24 * 60 * 60 * 1000;

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
      <div className="rounded-3xl border border-border/60 bg-surface p-8 text-center text-xs text-muted">
        <p className="text-2xl mb-1">📦</p>
        <p className="font-semibold text-chocolate">No hay pedidos registrados recientemente.</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-border/60 bg-surface divide-y divide-border/40 shadow-xs overflow-hidden">
      {pedidos.map((pedido: any) => {
        const diffMs = ahora - new Date(pedido.created_at).getTime();
        const esDemorado = pedido.estado === "pendiente_pago" && diffMs > UN_DIA_MS;
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
            className="p-4 sm:p-5 transition-colors space-y-3 bg-surface hover:bg-arena/10"
          >
            {/* Fila 1: Cliente, Badges de Entrega y Estado */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-chocolate">
                  {pedido.nombre_contacto || "Cliente"}
                </span>

                {/* Badge de Entrega: Retiro vs Envío */}
                {esRetiro ? (
                  <span className="rounded-full bg-[#FAF0DC] text-[#785418] border border-[#ECD7B2] px-2.5 py-0.5 text-[11px] font-semibold flex items-center gap-1">
                    <span>🏠</span> Retiro en taller
                  </span>
                ) : (
                  <span className="rounded-full bg-[#EBF4FA] text-[#245D78] border border-[#CFE4F0] px-2.5 py-0.5 text-[11px] font-semibold flex items-center gap-1">
                    <span>🚚</span> Envío a domicilio
                  </span>
                )}

                {/* Badge de Estado del Pago / Pedido en Tonos Pastel Suaves */}
                {pedido.estado === "pendiente_pago" ? (
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      esDemorado
                        ? "bg-[#FDF0EE] text-[#9E3E2E] border border-[#F2CDC6]"
                        : "bg-[#FDF6E2] text-[#855D1A] border border-[#EADBBD]"
                    }`}
                  >
                    {esDemorado ? `⏳ Sin pagar (${dias} días)` : "⏳ Esperando Pago"}
                  </span>
                ) : pedido.estado === "confirmado" ? (
                  <span className="rounded-full bg-[#EDF7F1] text-[#216738] border border-[#C5E8D2] px-2.5 py-0.5 text-[11px] font-semibold">
                    ✓ Pago Confirmado {esRetiro ? "(Listo para retirar)" : "(Listo para empaque)"}
                  </span>
                ) : pedido.estado === "enviado" ? (
                  <span className="rounded-full bg-secondary/80 text-chocolate border border-border/70 px-2.5 py-0.5 text-[11px] font-medium">
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
                    <button
                      type="button"
                      onClick={() => fotoUrl && setPreviewImage(fotoUrl)}
                      className="h-10 w-10 rounded-xl bg-arena/40 overflow-hidden flex items-center justify-center text-sm shrink-0 cursor-zoom-in"
                    >
                      {fotoUrl ? (
                        <img src={fotoUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span>🏺</span>
                      )}
                    </button>
                    <div className="min-w-0 text-xs">
                      <p className="font-semibold text-chocolate truncate max-w-[150px]">
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
                  <button
                    type="button"
                    onClick={() => setPreviewImage(pedido.comprobante_url)}
                    className="inline-flex items-center gap-1 rounded-xl bg-surface border border-border px-3 py-1 text-xs text-chocolate hover:bg-secondary/40 font-medium cursor-zoom-in"
                  >
                    <span>📎</span> Comprobante
                  </button>
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

      {/* Lightbox Preview */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 cursor-zoom-out animate-in fade-in duration-150"
        >
          <div className="relative max-w-lg w-full rounded-3xl overflow-hidden bg-surface p-2 shadow-2xl">
            <img src={previewImage} alt="" className="h-full w-full object-contain rounded-2xl max-h-[80vh]" />
          </div>
        </div>
      )}
    </div>
  );
}
