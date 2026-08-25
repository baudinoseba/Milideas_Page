"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { formatPrecio } from "@/lib/pricing";
import { actualizarEstadoEncargoAction } from "@/lib/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import type { Encargo, EstadoEncargo } from "@/types";

interface EncargosManagerProps {
  initialEncargos: Encargo[];
}

const estadoBadges: Record<EstadoEncargo, { label: string; variant: "default" | "success" | "warning" | "muted" }> = {
  pendiente: { label: "Pendiente", variant: "warning" },
  aceptado: { label: "Aceptado", variant: "success" },
  en_proceso: { label: "En Proceso", variant: "default" },
  listo: { label: "Listo para Entrega", variant: "success" },
  rechazado: { label: "Rechazado", variant: "muted" },
  cancelado: { label: "Cancelado", variant: "muted" },
};

export function EncargosManager({ initialEncargos }: EncargosManagerProps) {
  const [encargos, setEncargos] = useState<Encargo[]>(initialEncargos);
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [isPending, startTransition] = useTransition();

  // Accept modal state
  const [selectedEncargo, setSelectedEncargo] = useState<Encargo | null>(null);
  const [demoraDias, setDemoraDias] = useState<number>(15);

  const filtrados = encargos.filter((e) => {
    if (filtroEstado === "todos") return true;
    return e.estado === filtroEstado;
  });

  const handleCambiarEstado = (encargo: Encargo, nuevoEstado: EstadoEncargo, dias?: number) => {
    startTransition(async () => {
      const res = await actualizarEstadoEncargoAction(encargo.id, nuevoEstado, dias);
      if (res.success) {
        setEncargos((prev) =>
          prev.map((item) =>
            item.id === encargo.id
              ? { ...item, estado: nuevoEstado, demora_estimada_dias: dias ?? item.demora_estimada_dias }
              : item,
          ),
        );
        if (nuevoEstado === "aceptado") {
          // Open WhatsApp to notify acceptance
          const diasTexto = dias ? `${dias} días hábiles` : "15 días hábiles";
          const text = `*MILIDEAS ARTE - ENCARGO ACEPTADO* ✨

¡Hola ${encargo.nombre_contacto}! Tu encargo de *"${encargo.productos?.nombre ?? "Pieza a medida"}"* fue aceptado por Mili Ferrero.

- *Demora estimada de producción:* ${diasTexto}
- *Total estimado:* ${formatPrecio(encargo.total_estimado)}

Te iremos avisando el avance de tu pieza. ¡Muchas gracias!`;

          const clientPhone = encargo.whatsapp_contacto.replace(/[^0-9]/g, "");
          const waUrl = `https://wa.me/${clientPhone}?text=${encodeURIComponent(text)}`;
          window.open(waUrl, "_blank");
        }
        setSelectedEncargo(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Settings Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl font-serif font-medium text-chocolate">Gestión de Encargos</h1>
          <p className="text-xs text-muted font-sans">
            Solicitudes de piezas por encargo, personalizaciones y medidas especiales
          </p>
        </div>
        <Link href="/admin/encargos/configuracion">
          <Button variant="outline" className="rounded-xl text-xs font-semibold flex items-center gap-2">
            <span>⚙️</span>
            <span>Configurar Medidas y Marcos</span>
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs">
        {["todos", "pendiente", "aceptado", "en_proceso", "listo", "rechazado"].map((st) => (
          <button
            key={st}
            onClick={() => setFiltroEstado(st)}
            className={`rounded-full px-3.5 py-1.5 font-medium transition-all shrink-0 capitalize ${
              filtroEstado === st
                ? "bg-chocolate text-crema-cruda font-semibold"
                : "bg-surface text-muted hover:bg-arena hover:text-foreground border border-border/50"
            }`}
          >
            {st === "todos" ? "Todos los encargos" : (estadoBadges[st as EstadoEncargo]?.label ?? st)}
          </button>
        ))}
      </div>

      {/* Encargos List */}
      {filtrados.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted">
          <span className="text-3xl block mb-2">📝</span>
          <p className="text-sm font-medium">No se encontraron encargos en este estado.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtrados.map((enc) => {
            const badge = estadoBadges[enc.estado] ?? { label: enc.estado, variant: "muted" };
            return (
              <div
                key={enc.id}
                className="rounded-2xl border border-border/80 bg-surface p-5 shadow-xs space-y-4 transition-all hover:border-admin-accent/50"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/40 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-admin-accent uppercase tracking-wider">
                        #{enc.id.slice(0, 8)}
                      </span>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                      <span className="text-xs text-muted">
                        · {new Date(enc.created_at).toLocaleDateString("es-AR")}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-foreground mt-1">
                      {enc.productos?.nombre ?? "Pieza a medida"} ({enc.tipo_catalogo.toUpperCase()})
                    </h3>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-muted font-sans block">TOTAL ESTIMADO</span>
                    <span className="text-lg font-bold text-chocolate font-serif">
                      {formatPrecio(enc.total_estimado)}
                    </span>
                  </div>
                </div>

                {/* Encargo Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5 bg-arena/20 p-3 rounded-xl border border-border/40">
                    <p className="font-semibold text-chocolate">👤 Cliente & Entrega</p>
                    <p><strong className="text-foreground">{enc.nombre_contacto}</strong></p>
                    <p className="text-muted">WhatsApp: <span className="text-foreground font-mono">{enc.whatsapp_contacto}</span></p>
                    {enc.email_contacto && <p className="text-muted">Email: {enc.email_contacto}</p>}
                    <p className="text-muted capitalize">Método: <strong className="text-foreground">{enc.metodo_entrega}</strong></p>
                  </div>

                  <div className="space-y-1.5 bg-arena/20 p-3 rounded-xl border border-border/40">
                    <p className="font-semibold text-chocolate">🎨 Piezas & Especificaciones</p>
                    {enc.items_encargo && enc.items_encargo.length > 0 ? (
                      <div className="space-y-2 divide-y divide-border/40">
                        {enc.items_encargo.map((it: { id: string; nombre_producto: string; tipo_catalogo?: string; cantidad: number; medida_seleccionada?: string; con_marco?: boolean; es_personalizado?: boolean; detalle_personalizacion?: string }) => (
                          <div key={it.id} className="pt-1.5 first:pt-0">
                            <p className="font-medium text-foreground">
                              {it.nombre_producto} ({it.tipo_catalogo?.toUpperCase()}) x {it.cantidad}
                            </p>
                            {it.medida_seleccionada && <p className="text-muted">· Medida: {it.medida_seleccionada}</p>}
                            {it.con_marco && <p className="text-emerald-600 dark:text-emerald-400 font-semibold">· Con marco de madera</p>}
                            {it.es_personalizado && (
                              <p className="text-terracota">
                                · Personalizado (+15%) {it.detalle_personalizacion ? `"${it.detalle_personalizacion}"` : ""}
                              </p>
                            )}
                            <p className="text-muted font-mono">{formatPrecio(it.subtotal)}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <>
                        {enc.medida_seleccionada && <p><span className="text-muted">Medida:</span> {enc.medida_seleccionada}</p>}
                        {enc.con_marco && <p className="text-emerald-600 dark:text-emerald-400 font-semibold">✓ Con marco de madera artesanal</p>}
                        {enc.es_personalizado && (
                          <div>
                            <p className="text-terracota font-semibold">✨ Personalizado (+15%)</p>
                            {enc.detalle_personalizacion && (
                              <p className="text-muted italic bg-surface p-1.5 rounded mt-1 border border-border/40">
                                &ldquo;{enc.detalle_personalizacion}&rdquo;
                              </p>
                            )}
                          </div>
                        )}
                      </>
                    )}
                    {enc.demora_estimada_dias && (
                      <p className="text-admin-accent font-semibold pt-1 border-t border-border/40 mt-1">
                        ⏳ Demora pactada: {enc.demora_estimada_dias} días hábiles
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/40">
                  <a
                    href={`https://wa.me/${enc.whatsapp_contacto.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#25D366]/10 px-3 py-1.5 text-xs font-semibold text-[#1ebe5d] hover:bg-[#25D366]/20 transition-colors"
                  >
                    <WhatsAppIcon className="h-4 w-4 fill-current" />
                    <span>Contactar por WhatsApp</span>
                  </a>

                  <div className="flex flex-wrap items-center gap-2">
                    {enc.estado === "pendiente" && (
                      <>
                        <Button
                          onClick={() => setSelectedEncargo(enc)}
                          className="bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-xs min-h-9 py-1 px-3"
                        >
                          ✅ Aceptar Encargo
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleCambiarEstado(enc, "rechazado")}
                          className="text-xs rounded-xl text-red-600 hover:bg-red-500/10 min-h-9 py-1 px-3"
                        >
                          ❌ Rechazar
                        </Button>
                      </>
                    )}

                    {enc.estado === "aceptado" && (
                      <Button
                        onClick={() => handleCambiarEstado(enc, "en_proceso")}
                        className="bg-admin-accent text-white hover:bg-admin-accent-hover rounded-xl text-xs min-h-9 py-1 px-3"
                      >
                        🎨 Marcar En Proceso
                      </Button>
                    )}

                    {enc.estado === "en_proceso" && (
                      <Button
                        onClick={() => handleCambiarEstado(enc, "listo")}
                        className="bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-xs min-h-9 py-1 px-3"
                      >
                        ✨ Marcar Listo para Entrega
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Accept Encargo Dialog */}
      {selectedEncargo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-semibold text-chocolate">Aceptar Encargo Especial</h3>
            <p className="text-xs text-muted">
              Ingresá los días estimados de producción para <strong>{selectedEncargo.nombre_contacto}</strong>.
            </p>

            <div>
              <label htmlFor="demora" className="text-xs font-semibold text-foreground block mb-1">
                Días hábiles de demora estimados
              </label>
              <Input
                id="demora"
                type="number"
                value={demoraDias}
                onChange={(e) => setDemoraDias(Number(e.target.value))}
                min={1}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <Button variant="outline" onClick={() => setSelectedEncargo(null)}>
                Cancelar
              </Button>
              <Button
                disabled={isPending}
                onClick={() => handleCambiarEstado(selectedEncargo, "aceptado", demoraDias)}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                {isPending ? "Aceptando..." : "Confirmar y Notificar WhatsApp"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
