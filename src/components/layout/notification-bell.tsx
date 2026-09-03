"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatPrecio } from "@/lib/pricing";
import { cn } from "@/lib/utils/cn";

export interface SystemNotification {
  id: string;
  tipo: "pago_pendiente" | "en_taller" | "listo_retiro" | "enviado" | "seña_pendiente" | "info";
  titulo: string;
  descripcion: string;
  fecha: string;
  linkHref: string;
  linkLabel: string;
  leido: boolean;
  itemTipo: "pedido" | "encargo";
  itemId: string;
  monto?: number;
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [leidas, setLeidas] = useState<string[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load read notifications from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("milideas_notifs_leidas");
      if (stored) {
        setLeidas(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  // Fetch active orders and encargos to generate notifications
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data?.user;
      if (!user) {
        setIsLoggedIn(false);
        setNotifications([]);
        return;
      }

      setIsLoggedIn(true);

      try {
        const [pedidosRes, encargosRes] = await Promise.all([
          supabase
            .from("pedidos")
            .select("id, estado, total, created_at, tipo_envio, items_pedido(cantidad, productos(nombre))")
            .eq("usuario_id", user.id)
            .order("created_at", { ascending: false })
            .limit(10),
          supabase
            .from("encargos")
            .select("id, estado, total_estimado, precio_base_cotizado, created_at, metodo_entrega, productos(nombre), formatos_catalogo(nombre)")
            .eq("usuario_id", user.id)
            .order("created_at", { ascending: false })
            .limit(10),
        ]);

        const notifs: SystemNotification[] = [];

        // Generate notifications from pedidos
        if (pedidosRes.data) {
          pedidosRes.data.forEach((p: any) => {
            const shortId = p.id.slice(0, 8).toUpperCase();
            const dateStr = new Date(p.created_at).toLocaleDateString("es-AR", {
              day: "numeric",
              month: "short",
            });

            if (p.estado === "pendiente_pago") {
              notifs.push({
                id: `p-pago-${p.id}`,
                tipo: "pago_pendiente",
                titulo: `🟡 Compra #${shortId}: Pago Pendiente`,
                descripcion: `Tu reserva por ${formatPrecio(p.total)} aguarda comprobante de transferencia al alias 'milideasarte'.`,
                fecha: dateStr,
                linkHref: `/cuenta/pedidos?id=${p.id}&action=pagar`,
                linkLabel: "💳 Ver Datos de Pago",
                leido: false,
                itemTipo: "pedido",
                itemId: p.id,
                monto: p.total,
              });
            } else if (p.estado === "confirmado") {
              notifs.push({
                id: `p-conf-${p.id}`,
                tipo: "en_taller",
                titulo: `🟢 Compra #${shortId}: Pago Acreditado`,
                descripcion: "¡Tu pago fue confirmado! Mili está preparando el empaque artesanal de tus piezas.",
                fecha: dateStr,
                linkHref: "/cuenta/pedidos",
                linkLabel: "Ver compra",
                leido: false,
                itemTipo: "pedido",
                itemId: p.id,
              });
            } else if (p.estado === "enviado") {
              notifs.push({
                id: `p-env-${p.id}`,
                tipo: "enviado",
                titulo: `🚚 Compra #${shortId}: En Camino`,
                descripcion: "Tu paquete fue despachado por Vía Cargo y se encuentra viajando a destino.",
                fecha: dateStr,
                linkHref: "/cuenta/pedidos",
                linkLabel: "Ver seguimiento",
                leido: false,
                itemTipo: "pedido",
                itemId: p.id,
              });
            }
          });
        }

        // Generate notifications from encargos
        if (encargosRes.data) {
          encargosRes.data.forEach((e: any) => {
            const shortId = e.id.slice(0, 8).toUpperCase();
            const dateStr = new Date(e.created_at).toLocaleDateString("es-AR", {
              day: "numeric",
              month: "short",
            });
            const nombrePieza = e.productos?.nombre || e.formatos_catalogo?.nombre || "Pieza a medida";

            if (e.estado === "pendiente") {
              notifs.push({
                id: `e-pend-${e.id}`,
                tipo: "info",
                titulo: `⏳ Encargo #${shortId}: En Revisión`,
                descripcion: `Tu solicitud de ${nombrePieza} está siendo revisada por Mili en el taller.`,
                fecha: dateStr,
                linkHref: "/cuenta/pedidos",
                linkLabel: "Ver encargo",
                leido: false,
                itemTipo: "encargo",
                itemId: e.id,
              });
            } else if (e.estado === "aceptado") {
              notifs.push({
                id: `e-acep-${e.id}`,
                tipo: "seña_pendiente",
                titulo: `✨ Encargo #${shortId}: Aceptado (Seña Pendiente)`,
                descripcion: `¡Mili aceptó tu encargo de ${nombrePieza}! Coordiná la seña del 20% para comenzar el modelado.`,
                fecha: dateStr,
                linkHref: `/cuenta/pedidos?id=${e.id}&action=pagar`,
                linkLabel: "💳 Pagar Seña",
                leido: false,
                itemTipo: "encargo",
                itemId: e.id,
              });
            } else if (e.estado === "en_proceso") {
              notifs.push({
                id: `e-proc-${e.id}`,
                tipo: "en_taller",
                titulo: `🎨 Encargo #${shortId}: En Elaboración`,
                descripcion: `Tu pieza (${nombrePieza}) está en proceso artesanal de modelado, secado y horneada en el taller.`,
                fecha: dateStr,
                linkHref: "/cuenta/pedidos",
                linkLabel: "Ver avance",
                leido: false,
                itemTipo: "encargo",
                itemId: e.id,
              });
            } else if (e.estado === "listo") {
              notifs.push({
                id: `e-listo-${e.id}`,
                tipo: "listo_retiro",
                titulo: `📦 Encargo #${shortId}: ¡Listo para Retirar!`,
                descripcion: `Tu pieza artesanal ${nombrePieza} ya está lista en el taller de Sunchales.`,
                fecha: dateStr,
                linkHref: "/cuenta/pedidos",
                linkLabel: "📍 Coordinar Retiro",
                leido: false,
                itemTipo: "encargo",
                itemId: e.id,
              });
            }
          });
        }

        setNotifications(notifs);
      } catch (err) {
        console.error("Error al cargar notificaciones:", err);
      }
    });
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const noLeidasCount = notifications.filter((n) => !leidas.includes(n.id)).length;

  const marcarTodasLeidas = () => {
    const allIds = notifications.map((n) => n.id);
    setLeidas(allIds);
    localStorage.setItem("milideas_notifs_leidas", JSON.stringify(allIds));
  };

  const marcarLeida = (id: string) => {
    if (!leidas.includes(id)) {
      const nuevo = [...leidas, id];
      setLeidas(nuevo);
      localStorage.setItem("milideas_notifs_leidas", JSON.stringify(nuevo));
    }
  };

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón Campanita con badge numérico */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 transition-all duration-200 hover:text-chocolate hover:bg-stone-100 active:scale-95 cursor-pointer shadow-xs",
          isOpen && "ring-2 ring-terracota/50 text-chocolate bg-stone-100",
        )}
        title="Notificaciones y Novedades de tus compras"
        aria-label="Centro de notificaciones"
      >
        <span className="text-base leading-none">🔔</span>
        {noLeidasCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-terracota text-[10px] font-mono font-bold text-white px-1 shadow-sm animate-pulse">
            {noLeidasCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown de Notificaciones */}
      {isOpen && (
        <div className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 top-14 sm:top-full mt-2 w-auto sm:w-96 rounded-3xl border border-[#E5E0D8] bg-white p-3.5 sm:p-4 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150 z-50 max-h-[calc(100dvh-130px)] sm:max-h-none flex flex-col">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-stone-100 pb-2 mb-2 shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-chocolate text-xs sm:text-sm">
                🔔 Notificaciones
              </span>
              {noLeidasCount > 0 && (
                <span className="rounded-full bg-terracota/15 text-terracota px-2 py-0.5 text-[10px] font-bold">
                  {noLeidasCount} nuevas
                </span>
              )}
            </div>

            {noLeidasCount > 0 && (
              <button
                type="button"
                onClick={marcarTodasLeidas}
                className="text-[11px] font-medium text-stone-500 hover:text-chocolate transition-colors cursor-pointer"
              >
                Marcar leídas
              </button>
            )}
          </div>

          {/* Lista de Notificaciones con scroll controlado */}
          <div className="flex-1 max-h-[38vh] sm:max-h-80 overflow-y-auto space-y-2 pr-1 divide-y divide-stone-100 scrollbar-thin">
            {notifications.length === 0 ? (
              <div className="py-6 text-center space-y-1.5 text-xs text-stone-500">
                <span className="text-2xl block">✨</span>
                <p className="font-medium text-chocolate">¡Todo al día!</p>
                <p className="text-[11px]">No tenés notificaciones pendientes en tus pedidos.</p>
              </div>
            ) : (
              notifications.map((n) => {
                const esNoLeida = !leidas.includes(n.id);
                return (
                  <div
                    key={n.id}
                    onClick={() => marcarLeida(n.id)}
                    className={cn(
                      "pt-2.5 first:pt-0 pb-1 rounded-2xl p-2.5 transition-all text-xs space-y-1.5",
                      esNoLeida ? "bg-arena/25 border border-terracota/20" : "hover:bg-stone-50",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-serif font-bold text-chocolate text-xs leading-snug">
                        {n.titulo}
                      </h4>
                      <span className="text-[10px] text-stone-400 shrink-0 font-sans">{n.fecha}</span>
                    </div>

                    <p className="text-[11px] text-stone-600 leading-relaxed font-sans">
                      {n.descripcion}
                    </p>

                    <div className="pt-1 flex items-center justify-between">
                      <Link
                        href={n.linkHref}
                        onClick={() => {
                          marcarLeida(n.id);
                          setIsOpen(false);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-terracota hover:text-chocolate hover:underline cursor-pointer"
                      >
                        <span>{n.linkLabel}</span>
                        <span>→</span>
                      </Link>

                      {esNoLeida && (
                        <span className="h-2 w-2 rounded-full bg-terracota shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-stone-100 pt-2.5 mt-2.5 text-center">
            <Link
              href="/cuenta/pedidos"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-chocolate hover:text-terracota transition-colors py-1 cursor-pointer"
            >
              <span>🛍️ Ir a Mis Compras & Encargos</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
