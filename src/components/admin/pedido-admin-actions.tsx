"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { formatPrecio } from "@/lib/pricing";
import {
  confirmarPagoAction,
  cancelarPedidoAction,
  marcarEnviadoAction,
} from "@/lib/actions";

type PedidoAdmin = {
  id: string;
  estado: string;
  total: number;
  subtotal: number;
  descuento_aplicado: number;
  costo_envio: number;
  nombre_contacto: string;
  whatsapp_contacto: string;
  email_contacto: string | null;
  tipo_envio: string;
  metodo_pago: string;
  fecha_limite_pago: string;
  comprobante_url: string | null;
  direccion_envio: Record<string, string> | null;
  created_at: string;
  items_pedido: Array<{
    id: string;
    cantidad: number;
    precio_unitario_final: number;
    es_personalizado: boolean;
    detalle_personalizacion?: string | null;
    productos: {
      id?: string;
      slug?: string;
      nombre: string;
      descripcion?: string | null;
      dimensiones?: string | null;
      alto_cm?: number | null;
      ancho_cm?: number | null;
      capacidad_ml?: number | null;
      tipo_catalogo?: string | null;
      producto_imagenes?: Array<{ url_imagen: string }>;
      categorias?: { nombre: string } | null;
      producciones?: { nombre: string } | null;
    } | null;
  }>;
};

const estadoSteps = ["pendiente_pago", "confirmado", "enviado"];

function PedidoTimeline({ estado, esRetiro }: { estado: string; esRetiro: boolean }) {
  const currentIdx = estadoSteps.indexOf(estado);
  const labels = [
    "Esperando Pago",
    esRetiro ? "Confirmado (Listo en taller)" : "Confirmado (Listo para despacho)",
    esRetiro ? "Entregado en taller" : "Despachado",
  ];

  if (estado === "cancelado") {
    return (
      <div className="flex items-center gap-2 rounded-2xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
        <span>✕</span>
        <span>Este pedido fue cancelado</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
      {estadoSteps.map((step, idx) => {
        const isCompleted = idx < currentIdx;
        const isCurrent = idx === currentIdx;

        return (
          <div key={step} className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                isCurrent
                  ? "bg-chocolate text-crema-cruda shadow-xs"
                  : isCompleted
                    ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                    : "bg-surface text-muted border border-border/70"
              }`}
            >
              <span>{isCompleted ? "✓" : idx + 1}</span>
              <span>{labels[idx]}</span>
            </div>
            {idx < estadoSteps.length - 1 && (
              <span className="text-muted text-xs">→</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function PedidoAdminActions({
  pedido,
  proximoAVencer,
}: {
  pedido: PedidoAdmin;
  proximoAVencer: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const esRetiro =
    String(pedido.tipo_envio || "").toLowerCase().includes("retiro") ||
    String(pedido.costo_envio) === "0";

  const telLimpio = String(pedido.whatsapp_contacto || "").replace(/\D/g, "");

  const handleConfirmar = () => {
    startTransition(async () => {
      await confirmarPagoAction(pedido.id);
      window.location.reload();
    });
  };

  const handleEnviado = () => {
    const txt = esRetiro
      ? "¿Marcar pedido como entregado al cliente en el taller?"
      : "¿Marcar pedido como despachado por correo?";
    if (!confirm(txt)) return;
    startTransition(async () => {
      await marcarEnviadoAction(pedido.id);
      window.location.reload();
    });
  };

  const handleCancelar = () => {
    if (!confirm("¿Cancelar pedido y restaurar stock?")) return;
    startTransition(async () => {
      await cancelarPedidoAction(pedido.id);
      window.location.reload();
    });
  };

  const limite = new Date(pedido.fecha_limite_pago);

  return (
    <div className="space-y-6 pb-12">
      
      {/* ─── 1. TIMELINE Y ESTADO ─── */}
      <div className="rounded-3xl border border-border/80 bg-surface p-5 sm:p-6 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-barro font-sans">
            Estado del Pedido
          </p>
          <span className="text-xs text-muted">
            {new Date(pedido.created_at).toLocaleDateString("es-AR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        <PedidoTimeline estado={pedido.estado} esRetiro={esRetiro} />

        {proximoAVencer && pedido.estado === "pendiente_pago" && (
          <div className="rounded-2xl bg-[#FDF6E2] border border-[#EADBBD] p-3 text-xs text-[#855D1A] font-medium flex items-center gap-2">
            <span>⏰</span>
            <span>Reserva de 24hs por vencer: {limite.toLocaleString("es-AR")}</span>
          </div>
        )}
      </div>

      {/* ─── 2. DATOS DEL CLIENTE Y ENTREGA ─── */}
      <div className="rounded-3xl border border-border/80 bg-surface p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-barro font-sans">
            Datos del Cliente & Entrega
          </p>
          {telLimpio && (
            <a
              href={`https://wa.me/${telLimpio}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-800 border border-emerald-300 px-3 py-1 text-xs font-semibold transition-colors"
            >
              <span>💬</span> Escribir por WhatsApp
            </a>
          )}
        </div>

        <div className="grid gap-4 text-xs sm:grid-cols-2">
          <div>
            <span className="text-muted block mb-0.5">Nombre de Contacto</span>
            <p className="font-semibold text-chocolate text-sm">{pedido.nombre_contacto}</p>
          </div>

          <div>
            <span className="text-muted block mb-0.5">WhatsApp</span>
            <p className="font-semibold text-chocolate text-sm font-mono">{pedido.whatsapp_contacto}</p>
          </div>

          {pedido.email_contacto && (
            <div>
              <span className="text-muted block mb-0.5">Email</span>
              <p className="font-semibold text-chocolate">{pedido.email_contacto}</p>
            </div>
          )}

          <div>
            <span className="text-muted block mb-0.5">Método de Pago</span>
            <p className="font-semibold text-chocolate uppercase">{pedido.metodo_pago.replace("_", " ")}</p>
          </div>

          <div className="sm:col-span-2 rounded-2xl bg-arena/20 border border-border/60 p-3.5 space-y-1">
            <span className="text-[11px] font-semibold text-barro block">Modalidad de Entrega:</span>
            {esRetiro ? (
              <div className="flex items-center gap-2">
                <span className="text-lg">🏠</span>
                <div>
                  <p className="font-semibold text-chocolate text-xs">Retiro personal en taller (Sunchales, Santa Fe)</p>
                  <p className="text-[11px] text-muted">Apartar la pieza en la estantería del taller sin embalaje de envío.</p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <span className="text-lg">🚚</span>
                <div>
                  <p className="font-semibold text-chocolate text-xs">Envío a Domicilio por Correo</p>
                  {pedido.direccion_envio && (
                    <p className="text-xs text-chocolate mt-0.5 font-medium">
                      {pedido.direccion_envio.calle} {pedido.direccion_envio.numero},{" "}
                      {pedido.direccion_envio.ciudad} (CP: {pedido.direccion_envio.codigoPostal})
                      {pedido.direccion_envio.referencia && ` · ${pedido.direccion_envio.referencia}`}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── 3. DETALLE VISUAL DE PIEZAS COMPRADAS ─── */}
      <div className="rounded-3xl border border-border/80 bg-surface p-5 sm:p-6 shadow-xs space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-barro font-sans">
          Piezas Compradas ({pedido.items_pedido.length})
        </p>

        <div className="divide-y divide-border/40">
          {pedido.items_pedido.map((item) => {
            const prod = item.productos;
            const fotoUrl = prod?.producto_imagenes?.[0]?.url_imagen;
            const coleccionNom = prod?.producciones?.nombre;
            const categoriaNom = prod?.categorias?.nombre;

            // Formatear medidas
            const partesDim: string[] = [];
            if (prod?.alto_cm && prod?.ancho_cm) {
              partesDim.push(`${prod.alto_cm}x${prod.ancho_cm} cm`);
            } else if (prod?.dimensiones) {
              partesDim.push(prod.dimensiones);
            }
            if (prod?.capacidad_ml) {
              partesDim.push(`${prod.capacidad_ml} ml`);
            }
            const dimensionesTexto = partesDim.join(" · ");

            const rubroRuta = prod?.tipo_catalogo === "ilustraciones" ? "ilustracion" : "ceramica";

            return (
              <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Foto e Info Rica */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => fotoUrl && setPreviewImage(fotoUrl)}
                    className="h-16 w-16 sm:h-20 sm:w-20 shrink-0 rounded-2xl bg-arena/40 border border-border/60 overflow-hidden flex items-center justify-center text-2xl cursor-zoom-in shadow-2xs"
                    title="Click para ampliar foto"
                  >
                    {fotoUrl ? (
                      <img src={fotoUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span>🏺</span>
                    )}
                  </button>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-chocolate">
                        {prod?.nombre || "Pieza de autor"}
                      </p>
                      
                      {categoriaNom && (
                        <span className="rounded-full bg-secondary/80 border border-border/60 px-2 py-0.2 text-[10px] font-semibold text-barro">
                          🏷️ {categoriaNom}
                        </span>
                      )}

                      {coleccionNom && (
                        <span className="rounded-full bg-arena/60 border border-terracota/30 px-2 py-0.2 text-[10px] font-semibold text-terracota">
                          ✨ {coleccionNom}
                        </span>
                      )}
                    </div>

                    {dimensionesTexto && (
                      <p className="text-xs text-barro font-medium">
                        📐 Medidas: {dimensionesTexto}
                      </p>
                    )}

                    {prod?.descripcion && (
                      <p className="text-xs text-muted line-clamp-1">
                        {prod.descripcion}
                      </p>
                    )}

                    {item.es_personalizado && (
                      <span className="inline-block rounded-full bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 text-[10px] font-bold">
                        Personalizado: {item.detalle_personalizacion || "A pedido"}
                      </span>
                    )}

                    {/* Enlace directo a ver la pieza */}
                    <div className="pt-1">
                      <Link
                        href={`/admin/${rubroRuta}`}
                        className="text-[11px] font-semibold text-terracota hover:underline inline-flex items-center gap-1"
                      >
                        <span>🔗 Ver en stock / catálogo</span>
                        <span>→</span>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Precios y Cantidad */}
                <div className="text-right shrink-0 self-end sm:self-center">
                  <p className="text-xs text-muted font-sans">
                    {formatPrecio(item.precio_unitario_final)} × {item.cantidad} u.
                  </p>
                  <p className="text-base font-mono font-bold text-chocolate">
                    {formatPrecio(item.precio_unitario_final * item.cantidad)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Totales */}
        <div className="mt-4 space-y-1.5 border-t border-border/60 pt-4 text-xs">
          <div className="flex justify-between text-muted">
            <span>Subtotal de piezas</span>
            <span className="font-mono">{formatPrecio(pedido.subtotal)}</span>
          </div>
          {pedido.descuento_aplicado > 0 && (
            <div className="flex justify-between text-emerald-700 font-medium">
              <span>Descuento aplicado</span>
              <span className="font-mono">-{formatPrecio(pedido.descuento_aplicado)}</span>
            </div>
          )}
          <div className="flex justify-between text-muted">
            <span>Costo de envío</span>
            <span className="font-mono">{pedido.costo_envio > 0 ? formatPrecio(pedido.costo_envio) : "Gratis (Retiro en taller)"}</span>
          </div>
          <div className="flex justify-between border-t border-border/60 pt-2.5 text-base font-bold text-chocolate">
            <span>Total a Cobrar</span>
            <span className="font-mono text-lg text-terracota">{formatPrecio(pedido.total)}</span>
          </div>
        </div>
      </div>

      {/* ─── 4. COMPROBANTE DE PAGO CON ZOOM ─── */}
      {pedido.comprobante_url && (
        <div className="rounded-3xl border border-border/80 bg-surface p-5 sm:p-6 shadow-xs space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-barro font-sans">
            Comprobante de Pago Adjunto
          </p>
          <div
            onClick={() => setPreviewImage(pedido.comprobante_url)}
            className="cursor-zoom-in max-w-sm rounded-2xl overflow-hidden border border-border/70 hover:border-terracota/50 transition-colors bg-arena/20 p-2"
          >
            <img
              src={pedido.comprobante_url}
              alt="Comprobante de pago"
              className="max-h-72 w-full object-contain rounded-xl"
            />
            <p className="text-center text-[10px] text-muted mt-1.5 font-medium">Click para ampliar comprobante</p>
          </div>
        </div>
      )}

      {/* ─── 5. BOTONES DE ACCIÓN OPERATIVA ─── */}
      <div className="rounded-3xl border border-border/80 bg-surface p-5 sm:p-6 shadow-xs space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-barro font-sans">
          Acciones del Pedido
        </p>

        <div className="flex flex-wrap items-center gap-3">
          {pedido.estado === "pendiente_pago" && (
            <button
              type="button"
              disabled={pending}
              onClick={handleConfirmar}
              className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 text-xs font-semibold shadow-xs cursor-pointer transition-all disabled:opacity-50"
            >
              ✓ Confirmar Pago de Transferencia
            </button>
          )}

          {pedido.estado === "confirmado" && (
            <button
              type="button"
              disabled={pending}
              onClick={handleEnviado}
              className="rounded-full bg-terracota hover:bg-terracota/90 text-white px-5 py-2.5 text-xs font-semibold shadow-xs cursor-pointer transition-all disabled:opacity-50"
            >
              {esRetiro ? "🏠 Marcar como Entregado en Taller" : "📦 Marcar como Despachado por Correo"}
            </button>
          )}

          {pedido.estado !== "cancelado" && pedido.estado !== "enviado" && (
            <button
              type="button"
              disabled={pending}
              onClick={handleCancelar}
              className="rounded-full border border-red-300 text-red-600 hover:bg-red-50 px-4 py-2.5 text-xs font-medium cursor-pointer transition-colors"
            >
              Cancelar Pedido
            </button>
          )}
        </div>
      </div>

      {/* Lightbox Preview */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 cursor-zoom-out animate-in fade-in duration-150"
        >
          <div className="relative max-w-2xl w-full rounded-3xl overflow-hidden bg-surface p-3 shadow-2xl">
            <img src={previewImage} alt="" className="h-full w-full object-contain rounded-2xl max-h-[85vh]" />
          </div>
        </div>
      )}

    </div>
  );
}
