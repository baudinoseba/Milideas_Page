"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatPrecio } from "@/lib/pricing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { toast } from "@/stores/toast-store";
import { cn } from "@/lib/utils/cn";

interface ComprasEncargosViewProps {
  pedidos: any[];
  encargos: any[];
  userEmail: string;
}

const ESTADOS_PEDIDO: Record<string, { label: string; variant: "warning" | "success" | "accent" | "muted" | "default"; finalizado: boolean; stepIndex: number }> = {
  pendiente_pago: { label: "🟡 Pendiente de pago", variant: "warning", finalizado: false, stepIndex: 1 },
  confirmado: { label: "🟢 Pago Confirmado / En preparación", variant: "success", finalizado: false, stepIndex: 2 },
  enviado: { label: "🚚 Despachado / En camino", variant: "accent", finalizado: true, stepIndex: 3 },
  entregado: { label: "📦 Entregado / Finalizado", variant: "success", finalizado: true, stepIndex: 4 },
  cancelado: { label: "❌ Cancelado", variant: "muted", finalizado: true, stepIndex: 0 },
};

const ESTADOS_ENCARGO: Record<string, { label: string; variant: "warning" | "success" | "accent" | "muted" | "default"; finalizado: boolean; stepIndex: number }> = {
  pendiente: { label: "⏳ Solicitud enviada (En revisión)", variant: "warning", finalizado: false, stepIndex: 1 },
  aceptado: { label: "✨ Aceptado (Pendiente de seña)", variant: "accent", finalizado: false, stepIndex: 2 },
  en_proceso: { label: "🎨 En elaboración en taller", variant: "default", finalizado: false, stepIndex: 3 },
  listo: { label: "📦 ¡Listo para retirar en taller!", variant: "success", finalizado: false, stepIndex: 4 },
  entregado: { label: "✅ Entregado / Finalizado", variant: "success", finalizado: true, stepIndex: 4 },
  rechazado: { label: "❌ Rechazado", variant: "muted", finalizado: true, stepIndex: 0 },
  cancelado: { label: "❌ Cancelado", variant: "muted", finalizado: true, stepIndex: 0 },
};

export function ComprasEncargosView({ pedidos, encargos }: ComprasEncargosViewProps) {
  const searchParams = useSearchParams();
  const [filtroTipo, setFiltroTipo] = useState<"todos" | "compras" | "encargos">("todos");
  const [filtroEstado, setFiltroEstado] = useState<"todos" | "pendientes_pago" | "en_proceso" | "en_camino" | "finalizados">("todos");
  
  const [itemSeleccionado, setItemSeleccionado] = useState<{ tipo: "pedido" | "encargo"; data: any } | null>(null);
  const [itemParaPagar, setItemParaPagar] = useState<{ tipo: "pedido" | "encargo"; data: any } | null>(null);
  const [itemParaOcultar, setItemParaOcultar] = useState<{ id: string; titulo: string } | null>(null);
  const [aliasCopiado, setAliasCopiado] = useState(false);
  
  const [ocultos, setOcultos] = useState<string[]>([]);
  const [mostrarOcultos, setMostrarOcultos] = useState(false);

  // Load hidden items from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("milideas_pedidos_ocultos");
      if (stored) {
        setOcultos(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  // Handle URL query parameters (e.g. ?id=xxx&action=pagar)
  useEffect(() => {
    const targetId = searchParams.get("id");
    const action = searchParams.get("action");
    if (targetId) {
      const foundPedido = pedidos.find((p) => p.id === targetId);
      if (foundPedido) {
        if (action === "pagar") {
          setItemParaPagar({ tipo: "pedido", data: foundPedido });
        } else {
          setItemSeleccionado({ tipo: "pedido", data: foundPedido });
        }
        return;
      }
      const foundEncargo = encargos.find((e) => e.id === targetId);
      if (foundEncargo) {
        if (action === "pagar") {
          setItemParaPagar({ tipo: "encargo", data: foundEncargo });
        } else {
          setItemSeleccionado({ tipo: "encargo", data: foundEncargo });
        }
      }
    }
  }, [searchParams, pedidos, encargos]);

  const copiarAlias = () => {
    navigator.clipboard.writeText("milideasarte");
    setAliasCopiado(true);
    setTimeout(() => setAliasCopiado(false), 2000);
  };

  const handleConfirmarOcultar = () => {
    if (!itemParaOcultar) return;
    const nuevoOcultos = [...ocultos, itemParaOcultar.id];
    setOcultos(nuevoOcultos);
    localStorage.setItem("milideas_pedidos_ocultos", JSON.stringify(nuevoOcultos));
    setItemParaOcultar(null);
    if (itemSeleccionado?.data.id === itemParaOcultar.id) {
      setItemSeleccionado(null);
    }
    toast.success("Pedido removido del historial");
  };

  const handleRestablecerOcultos = () => {
    setOcultos([]);
    localStorage.removeItem("milideas_pedidos_ocultos");
    setMostrarOcultos(false);
    toast.success("Historial restablecido completamente");
  };

  // Switch Main Type Tab and reset state filter
  const handleSelectTab = (tab: "todos" | "compras" | "encargos") => {
    setFiltroTipo(tab);
    setFiltroEstado("todos");
  };

  // Unify timeline items
  const allTimelineItems = useMemo(() => {
    const listaCompras = pedidos.map((p) => ({
      id: p.id,
      tipo: "pedido" as const,
      fecha: new Date(p.created_at).getTime(),
      fechaStr: new Date(p.created_at).toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      estadoRaw: p.estado,
      finalizado: ESTADOS_PEDIDO[p.estado]?.finalizado ?? false,
      data: p,
    }));

    const listaEncargos = encargos.map((e) => ({
      id: e.id,
      tipo: "encargo" as const,
      fecha: new Date(e.created_at).getTime(),
      fechaStr: new Date(e.created_at).toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      estadoRaw: e.estado,
      finalizado: ESTADOS_ENCARGO[e.estado]?.finalizado ?? false,
      data: e,
    }));

    return [...listaCompras, ...listaEncargos].sort((a, b) => b.fecha - a.fecha);
  }, [pedidos, encargos]);

  // Total tab counts
  const tabCounts = useMemo(() => {
    const visible = allTimelineItems.filter((i) => !ocultos.includes(i.id));
    return {
      todos: visible.length,
      compras: visible.filter((i) => i.tipo === "pedido").length,
      encargos: visible.filter((i) => i.tipo === "encargo").length,
    };
  }, [allTimelineItems, ocultos]);

  // Current scope items according to active tab
  const currentScopeItems = useMemo(() => {
    const visible = allTimelineItems.filter((i) => !ocultos.includes(i.id));
    if (filtroTipo === "compras") return visible.filter((i) => i.tipo === "pedido");
    if (filtroTipo === "encargos") return visible.filter((i) => i.tipo === "encargo");
    return visible;
  }, [allTimelineItems, ocultos, filtroTipo]);

  // Precise chip counts calculated STRICTLY over the current scope
  const chipCounts = useMemo(() => {
    return {
      todos: currentScopeItems.length,
      pendientes_pago: currentScopeItems.filter((i) =>
        i.tipo === "pedido"
          ? i.estadoRaw === "pendiente_pago"
          : i.estadoRaw === "pendiente" || i.estadoRaw === "aceptado",
      ).length,
      en_proceso: currentScopeItems.filter((i) =>
        i.tipo === "pedido"
          ? i.estadoRaw === "confirmado"
          : i.estadoRaw === "en_proceso",
      ).length,
      en_camino: currentScopeItems.filter((i) =>
        i.tipo === "pedido"
          ? i.estadoRaw === "enviado"
          : i.estadoRaw === "listo",
      ).length,
      finalizados: currentScopeItems.filter((i) =>
        i.tipo === "pedido"
          ? i.estadoRaw === "entregado" || i.estadoRaw === "cancelado"
          : i.estadoRaw === "entregado" || i.estadoRaw === "rechazado" || i.estadoRaw === "cancelado",
      ).length,
    };
  }, [currentScopeItems]);

  // Final filtered timeline
  const timeline = useMemo(() => {
    let list = currentScopeItems;

    if (filtroEstado === "pendientes_pago") {
      list = list.filter((i) =>
        i.tipo === "pedido"
          ? i.estadoRaw === "pendiente_pago"
          : i.estadoRaw === "pendiente" || i.estadoRaw === "aceptado",
      );
    } else if (filtroEstado === "en_proceso") {
      list = list.filter((i) =>
        i.tipo === "pedido"
          ? i.estadoRaw === "confirmado"
          : i.estadoRaw === "en_proceso",
      );
    } else if (filtroEstado === "en_camino") {
      list = list.filter((i) =>
        i.tipo === "pedido"
          ? i.estadoRaw === "enviado"
          : i.estadoRaw === "listo",
      );
    } else if (filtroEstado === "finalizados") {
      list = list.filter((i) =>
        i.tipo === "pedido"
          ? i.estadoRaw === "entregado" || i.estadoRaw === "cancelado"
          : i.estadoRaw === "entregado" || i.estadoRaw === "rechazado" || i.estadoRaw === "cancelado",
      );
    }

    return list;
  }, [currentScopeItems, filtroEstado]);

  const cantidadOcultos = pedidos.filter((p) => ocultos.includes(p.id)).length + encargos.filter((e) => ocultos.includes(e.id)).length;

  return (
    <div className="space-y-6 w-full pb-16">
      
      {/* ─── Encabezado Principal del Panel de Control ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E0D8] pb-4">
        <div className="text-center sm:text-left flex flex-col items-center sm:items-start w-full sm:w-auto">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="text-xl">🛍️</span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-chocolate">
              Panel de Compras & Encargos
            </h1>
          </div>
          <p className="text-xs text-stone-600 font-sans mt-1">
            Seguimiento en tiempo real de tus compras y encargos realizados
          </p>
        </div>

        {/* Pestañas de Tipo Principal (Todos / Compras / Encargos) Centradas en Mobile */}
        <div className="flex items-center justify-center gap-1.5 p-1 rounded-2xl bg-[#FAF7F2] border border-[#E5E0D8] shrink-0 mx-auto sm:mx-0 w-full sm:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => handleSelectTab("todos")}
            className={cn(
              "rounded-xl px-3 py-1.5 text-xs font-semibold font-sans transition-all cursor-pointer",
              filtroTipo === "todos"
                ? "bg-chocolate text-crema-cruda shadow-2xs"
                : "text-stone-700 hover:bg-stone-200/50",
            )}
          >
            ✨ Todos ({tabCounts.todos})
          </button>
          <button
            type="button"
            onClick={() => handleSelectTab("compras")}
            className={cn(
              "rounded-xl px-3 py-1.5 text-xs font-semibold font-sans transition-all cursor-pointer",
              filtroTipo === "compras"
                ? "bg-chocolate text-crema-cruda shadow-2xs"
                : "text-stone-700 hover:bg-stone-200/50",
            )}
          >
            🛍️ Compras ({tabCounts.compras})
          </button>
          <button
            type="button"
            onClick={() => handleSelectTab("encargos")}
            className={cn(
              "rounded-xl px-3 py-1.5 text-xs font-semibold font-sans transition-all cursor-pointer",
              filtroTipo === "encargos"
                ? "bg-chocolate text-crema-cruda shadow-2xs"
                : "text-stone-700 hover:bg-stone-200/50",
            )}
          >
            📝 Encargos ({tabCounts.encargos})
          </button>
        </div>
      </div>

      {/* ─── Filtros Rápidos por Estado (Dropdown en Mobile / Chips Responsivos en Desktop) ─── */}
      
      {/* 1. Selector Desplegable para Pantallas Móviles (sm:hidden) */}
      <div className="sm:hidden flex items-center gap-2 bg-[#FAF7F2] border border-[#E5E0D8] p-2.5 rounded-2xl shadow-2xs">
        <label htmlFor="filtro-estado-mobile" className="text-xs font-bold text-chocolate whitespace-nowrap">
          Filtrar estado:
        </label>
        <select
          id="filtro-estado-mobile"
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value as any)}
          className="w-full bg-white border border-stone-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-stone-900 focus:outline-none focus:border-chocolate cursor-pointer shadow-2xs"
        >
          <option value="todos">
            {filtroTipo === "compras"
              ? `Todas las compras (${chipCounts.todos})`
              : filtroTipo === "encargos"
              ? `Todos los encargos (${chipCounts.todos})`
              : `Todos los estados (${chipCounts.todos})`}
          </option>
          <option value="pendientes_pago">
            {filtroTipo === "compras"
              ? `🟡 Pendientes de Pago (${chipCounts.pendientes_pago})`
              : filtroTipo === "encargos"
              ? `🟡 Espera de Seña (${chipCounts.pendientes_pago})`
              : `🟡 Pendientes (${chipCounts.pendientes_pago})`}
          </option>
          <option value="en_proceso">
            {filtroTipo === "compras"
              ? `📦 En Preparación (${chipCounts.en_proceso})`
              : filtroTipo === "encargos"
              ? `🎨 En Taller (${chipCounts.en_proceso})`
              : `🎨 En Proceso (${chipCounts.en_proceso})`}
          </option>
          <option value="en_camino">
            {filtroTipo === "compras"
              ? `🚚 Despachados / En Camino (${chipCounts.en_camino})`
              : filtroTipo === "encargos"
              ? `📦 Listos para Retirar (${chipCounts.en_camino})`
              : `📦 Listos / En Camino (${chipCounts.en_camino})`}
          </option>
          <option value="finalizados">
            {filtroTipo === "compras"
              ? `✅ Entregadas / Concluidas (${chipCounts.finalizados})`
              : filtroTipo === "encargos"
              ? `✅ Concluidos / Entregados (${chipCounts.finalizados})`
              : `✅ Finalizados (${chipCounts.finalizados})`}
          </option>
        </select>
      </div>

      {/* 2. Chips Interactivos para Pantallas Medianas y Grandes (hidden sm:flex flex-wrap) */}
      <div className="hidden sm:flex flex-wrap items-center gap-2">
        {/* Chip 1: Todos los estados */}
        <button
          type="button"
          onClick={() => setFiltroEstado("todos")}
          className={cn(
            "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all shrink-0 cursor-pointer border",
            filtroEstado === "todos"
              ? "bg-stone-800 text-white border-stone-800 shadow-2xs"
              : "bg-surface border-border/70 text-stone-600 hover:border-chocolate",
          )}
        >
          {filtroTipo === "compras"
            ? `Todas (${chipCounts.todos})`
            : filtroTipo === "encargos"
            ? `Todos (${chipCounts.todos})`
            : `Todos (${chipCounts.todos})`}
        </button>

        {/* Chip 2: Pendientes de pago o seña */}
        <button
          type="button"
          onClick={() => setFiltroEstado("pendientes_pago")}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-bold transition-all shrink-0 cursor-pointer border flex items-center gap-1.5",
            filtroEstado === "pendientes_pago"
              ? "bg-amber-600 text-white border-amber-600 shadow-2xs"
              : chipCounts.pendientes_pago > 0
              ? "bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100"
              : "bg-surface border-border/70 text-stone-600 hover:border-amber-400",
          )}
        >
          <span>
            {filtroTipo === "compras"
              ? "🟡 Pendientes de Pago"
              : filtroTipo === "encargos"
              ? "🟡 Espera de Seña"
              : "🟡 Pendientes"}
          </span>
          <span
            className={cn(
              "rounded-full px-1.5 py-0.2 text-[10px] font-bold",
              filtroEstado === "pendientes_pago"
                ? "bg-white/30 text-white"
                : "bg-amber-200/80 text-amber-900",
            )}
          >
            {chipCounts.pendientes_pago}
          </span>
        </button>

        {/* Chip 3: En taller o preparación */}
        <button
          type="button"
          onClick={() => setFiltroEstado("en_proceso")}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-semibold transition-all shrink-0 cursor-pointer border flex items-center gap-1.5",
            filtroEstado === "en_proceso"
              ? "bg-chocolate text-white border-chocolate shadow-2xs"
              : "bg-surface border-border/70 text-stone-600 hover:border-chocolate",
          )}
        >
          <span>
            {filtroTipo === "compras"
              ? "📦 En Preparación"
              : filtroTipo === "encargos"
              ? "🎨 En Taller"
              : "🎨 En Proceso"}
          </span>
          <span
            className={cn(
              "rounded-full px-1.5 py-0.2 text-[10px] font-bold",
              filtroEstado === "en_proceso"
                ? "bg-white/30 text-white"
                : "bg-arena text-chocolate",
            )}
          >
            {chipCounts.en_proceso}
          </span>
        </button>

        {/* Chip 4: Listos para retirar o despachados en camino */}
        <button
          type="button"
          onClick={() => setFiltroEstado("en_camino")}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-semibold transition-all shrink-0 cursor-pointer border flex items-center gap-1.5",
            filtroEstado === "en_camino"
              ? "bg-emerald-700 text-white border-emerald-700 shadow-2xs"
              : "bg-surface border-border/70 text-stone-600 hover:border-emerald-600",
          )}
        >
          <span>
            {filtroTipo === "compras"
              ? "🚚 En Camino"
              : filtroTipo === "encargos"
              ? "📦 Listos para Retirar"
              : "📦 Listos / En Camino"}
          </span>
          <span
            className={cn(
              "rounded-full px-1.5 py-0.2 text-[10px] font-bold",
              filtroEstado === "en_camino"
                ? "bg-white/30 text-white"
                : "bg-emerald-100 text-emerald-800",
            )}
          >
            {chipCounts.en_camino}
          </span>
        </button>

        {/* Chip 5: Finalizados / Entregados */}
        <button
          type="button"
          onClick={() => setFiltroEstado("finalizados")}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-semibold transition-all shrink-0 cursor-pointer border flex items-center gap-1.5",
            filtroEstado === "finalizados"
              ? "bg-stone-700 text-white border-stone-700 shadow-2xs"
              : "bg-surface border-border/70 text-stone-600 hover:border-stone-400",
          )}
        >
          <span>
            {filtroTipo === "compras"
              ? "✅ Entregadas"
              : filtroTipo === "encargos"
              ? "✅ Concluidos"
              : "✅ Finalizados"}
          </span>
          <span
            className={cn(
              "rounded-full px-1.5 py-0.2 text-[10px] font-bold",
              filtroEstado === "finalizados"
                ? "bg-white/30 text-white"
                : "bg-stone-200 text-stone-700",
            )}
          >
            {chipCounts.finalizados}
          </span>
        </button>
      </div>

      {/* ─── Lista de Items o Empty State ─── */}
      {timeline.length === 0 ? (
        <div className="rounded-3xl border border-[#E5E0D8] bg-white p-12 text-center space-y-4 shadow-2xs">
          <span className="text-4xl block">🏺</span>
          <div className="space-y-1">
            <h3 className="text-base font-serif font-bold text-chocolate">
              {filtroEstado !== "todos"
                ? "No hay pedidos con el filtro seleccionado"
                : filtroTipo === "compras"
                ? "No tenés compras de stock registradas"
                : filtroTipo === "encargos"
                ? "No tenés encargos a medida activos"
                : "No tenés compras ni encargos visibles en este momento"}
            </h3>
            <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
              Explorá las piezas únicas listas para entrega o encargá tu diseño personalizado modelado a mano por Mili.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/ceramica/stock"
              className="rounded-full bg-chocolate text-crema-cruda px-5 py-2 text-xs font-bold shadow-xs hover:bg-chocolate/90 transition-transform active:scale-95"
            >
              Ver Stock Disponible →
            </Link>
            <Link
              href="/ceramica/catalogo"
              className="rounded-full border border-stone-300 bg-surface px-5 py-2 text-xs font-semibold text-chocolate hover:bg-stone-100 transition-colors"
            >
              Ver Catálogo de Encargos →
            </Link>
            {cantidadOcultos > 0 && !mostrarOcultos && (
              <button
                type="button"
                onClick={() => setMostrarOcultos(true)}
                className="rounded-full border border-stone-300 bg-stone-50 text-stone-700 px-4 py-2 text-xs font-semibold hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Ver {cantidadOcultos} pedidos archivados
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {timeline.map((item) => {
            if (item.tipo === "pedido") {
              const pedido = item.data;
              const estado = ESTADOS_PEDIDO[pedido.estado] || {
                label: pedido.estado,
                variant: "muted",
                finalizado: false,
                stepIndex: 1,
              };
              const items = Array.isArray(pedido.items_pedido) ? pedido.items_pedido : [];
              const primerItem = items[0];
              const fotos = primerItem?.productos?.producto_imagenes || [];
              const fotoUrl = fotos[0]?.url_imagen || "/milideas_logo.png";
              const esPendientePago = pedido.estado === "pendiente_pago";

              return (
                <div
                  key={`pedido-${pedido.id}`}
                  onClick={() => setItemSeleccionado({ tipo: "pedido", data: pedido })}
                  className={cn(
                    "group relative rounded-3xl border p-4 sm:p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4",
                    esPendientePago
                      ? "border-amber-400/80 bg-amber-50/30 hover:border-amber-500"
                      : "border-[#E5E0D8] bg-white hover:border-chocolate/40",
                  )}
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    {/* Miniatura Foto */}
                    <div className="h-16 w-16 shrink-0 rounded-2xl overflow-hidden bg-arena/20 border border-stone-200 p-1 flex items-center justify-center shadow-2xs">
                      <img src={fotoUrl} alt="Producto" className="h-full w-full object-contain rounded-xl" />
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[10px] font-mono font-bold text-stone-700">
                          🛍️ Compra #{pedido.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span className="text-[11px] text-stone-400">• {item.fechaStr}</span>
                      </div>
                      <h4 className="text-sm font-serif font-bold text-chocolate truncate">
                        {items.length > 0
                          ? items.map((it: any) => `${it.cantidad}x ${it.productos?.nombre || "Pieza"}`).join(", ")
                          : "Compra de Piezas"}
                      </h4>
                      <p className="text-xs text-stone-500 font-sans">
                        {pedido.tipo_envio === "taller"
                          ? "Retiro en Taller (Florentino Ameghino 1576)"
                          : pedido.tipo_envio === "agencia"
                          ? "Sucursal Vía Cargo"
                          : "Envío a Domicilio"}
                      </p>
                    </div>
                  </div>

                  {/* Estado, Monto Total y Botones de Acción */}
                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100 gap-3 shrink-0">
                    <div className="flex flex-col items-start sm:items-end gap-1">
                      <Badge variant={estado.variant} className="text-[10px] font-semibold py-0.5 px-2.5 rounded-full">
                        {estado.label}
                      </Badge>
                      <span className="font-serif font-bold text-base text-stone-900">
                        {formatPrecio(pedido.total)}
                      </span>
                    </div>

                    {/* Acciones agrupadas juntas a la derecha */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Botón Pagar / Ver Alias si está pendiente */}
                      {esPendientePago && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setItemParaPagar({ tipo: "pedido", data: pedido });
                          }}
                          className="h-9 px-3 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                          title="Ver datos de transferencia bancaria y detalle de piezas"
                        >
                          <span>💳</span>
                          <span>Pagar</span>
                        </button>
                      )}

                      {/* Botón WhatsApp */}
                      <a
                        href={`https://wa.me/5493493664420?text=${encodeURIComponent(
                          `¡Hola Mili! Te escribo por mi compra #${pedido.id.slice(0, 8).toUpperCase()} para consultar el estado.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="h-9 px-3 rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                        title="Escribir por WhatsApp"
                      >
                        <WhatsAppIcon className="w-4 h-4 text-emerald-700" />
                        <span className="hidden md:inline">Chat</span>
                      </a>

                      {/* Botón Crucecita (✕) para archivar */}
                      {estado.finalizado && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setItemParaOcultar({ id: pedido.id, titulo: `Compra #${pedido.id.slice(0, 8).toUpperCase()}` });
                          }}
                          className="h-8 w-8 rounded-full border border-stone-200 bg-stone-50 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600 text-stone-400 transition-all flex items-center justify-center text-xs font-bold shrink-0 cursor-pointer"
                          title="Quitar del historial"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            } else {
              // Encargo a Medida
              const encargo = item.data;
              const estado = ESTADOS_ENCARGO[encargo.estado] || {
                label: encargo.estado,
                variant: "muted",
                finalizado: false,
                stepIndex: 1,
              };
              const tituloPieza =
                encargo.productos?.nombre ||
                encargo.formatos_catalogo?.nombre ||
                "Pieza a Medida";

              const precioCalculado = Number(
                encargo.total_estimado ??
                encargo.precio_total_estimado ??
                encargo.precio_base_cotizado ??
                encargo.precio_estimado ??
                0,
              );

              const esAceptadoSeña = encargo.estado === "aceptado";

              return (
                <div
                  key={`encargo-${encargo.id}`}
                  onClick={() => setItemSeleccionado({ tipo: "encargo", data: encargo })}
                  className={cn(
                    "group relative rounded-3xl border p-4 sm:p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4",
                    esAceptadoSeña
                      ? "border-emerald-400/80 bg-emerald-50/20 hover:border-emerald-500"
                      : "border-[#E5E0D8] bg-[#FAF7F2]/90 hover:border-terracota/40",
                  )}
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    {/* Icono de Taller */}
                    <div className="h-16 w-16 shrink-0 rounded-2xl bg-white border border-[#E5E0D8] flex flex-col items-center justify-center text-2xl shadow-2xs">
                      <span>🎨</span>
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="rounded-md bg-terracota/10 text-terracota px-2 py-0.5 text-[10px] font-mono font-bold border border-terracota/20">
                          📝 Encargo #{encargo.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span className="text-[11px] text-stone-400">• {item.fechaStr}</span>
                      </div>
                      <h4 className="text-sm font-serif font-bold text-chocolate truncate">
                        {tituloPieza}
                      </h4>
                      {encargo.detalle_personalizacion && (
                        <p className="text-xs text-stone-600 font-sans line-clamp-1">
                          &ldquo;{encargo.detalle_personalizacion}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Estado, Monto y Botones */}
                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-200/60 gap-3 shrink-0">
                    <div className="flex flex-col items-start sm:items-end gap-1">
                      <Badge variant={estado.variant} className="text-[10px] font-semibold py-0.5 px-2.5 rounded-full">
                        {estado.label}
                      </Badge>
                      {precioCalculado > 0 ? (
                        <span className="font-serif font-bold text-base text-stone-900">
                          {formatPrecio(precioCalculado)}
                        </span>
                      ) : (
                        <span className="text-xs italic font-medium text-stone-500">
                          A cotizar por Mili
                        </span>
                      )}
                    </div>

                    {/* Acciones agrupadas juntas a la derecha */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Botón Pagar Seña */}
                      {esAceptadoSeña && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setItemParaPagar({ tipo: "encargo", data: encargo });
                          }}
                          className="h-9 px-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                          title="Pagar seña del 20%"
                        >
                          <span>🪙</span>
                          <span>Seña (20%)</span>
                        </button>
                      )}

                      {/* Botón WhatsApp de Acción Directa para Encargo */}
                      <a
                        href={`https://wa.me/5493493664420?text=${encodeURIComponent(
                          encargo.estado === "aceptado"
                            ? `¡Hola Mili! Te escribo por mi encargo #${encargo.id.slice(0, 8).toUpperCase()} (${tituloPieza}) para coordinar la seña.`
                            : encargo.estado === "listo"
                            ? `¡Hola Mili! Te consulto por mi encargo #${encargo.id.slice(0, 8).toUpperCase()} (${tituloPieza}) para coordinar el retiro en el taller.`
                            : `¡Hola Mili! Te consulto por mi encargo #${encargo.id.slice(0, 8).toUpperCase()} (${tituloPieza}).`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="h-9 px-3 rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                        title="Escribir a Mili por WhatsApp"
                      >
                        <WhatsAppIcon className="w-4 h-4 text-emerald-700" />
                        <span className="hidden md:inline">
                          {encargo.estado === "listo" ? "Retirar" : "Chat"}
                        </span>
                      </a>

                      {/* Botón Crucecita (✕) para archivar */}
                      {estado.finalizado && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setItemParaOcultar({ id: encargo.id, titulo: `Encargo #${encargo.id.slice(0, 8).toUpperCase()}` });
                          }}
                          className="h-8 w-8 rounded-full border border-stone-200 bg-white hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600 text-stone-400 transition-all flex items-center justify-center text-xs font-bold shrink-0 cursor-pointer"
                          title="Quitar del historial"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            }
          })}

          {/* Enlace para ver u ocultar archivados */}
          {cantidadOcultos > 0 && (
            <div className="flex items-center justify-between pt-4 border-t border-stone-200 text-xs text-stone-500">
              <span>{cantidadOcultos} pedido(s) oculto(s) en este dispositivo</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMostrarOcultos(!mostrarOcultos)}
                  className="font-semibold text-chocolate hover:underline cursor-pointer"
                >
                  {mostrarOcultos ? "Ocultar archivados" : "Mostrar archivados"}
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={handleRestablecerOcultos}
                  className="font-semibold text-rose-600 hover:underline cursor-pointer"
                >
                  Restablecer todos
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── MODAL RÁPIDO DE PAGO / TRANSFERENCIA CON DESGLOSE DE PIEZAS (💳) ─── */}
      {itemParaPagar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl border border-[#E5E0D8] bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏦</span>
                <h3 className="font-serif font-bold text-chocolate text-base">
                  Datos de Transferencia Bancaria
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setItemParaPagar(null)}
                className="text-stone-400 hover:text-stone-700 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-stone-600">
                {itemParaPagar.tipo === "pedido"
                  ? `Para confirmar tu Compra #${itemParaPagar.data.id.slice(0, 8).toUpperCase()}, realizá la transferencia por:`
                  : `Para iniciar la producción de tu Encargo #${itemParaPagar.data.id.slice(0, 8).toUpperCase()}, transferí la seña del 20%:`}
              </p>
              <p className="text-2xl font-mono font-black text-terracota">
                {itemParaPagar.tipo === "pedido"
                  ? formatPrecio(itemParaPagar.data.total)
                  : formatPrecio(Math.round((itemParaPagar.data.total_estimado || itemParaPagar.data.precio_base_cotizado || 0) * 0.2))}
              </p>
            </div>

            {/* ─── DESGLOSE DE PIEZAS SOLICITADAS / COMPRADAS ─── */}
            {itemParaPagar.tipo === "pedido" && (
              <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-3.5 space-y-2 text-xs">
                <span className="text-[11px] font-bold text-chocolate uppercase tracking-wider block font-sans">
                  📦 Piezas en tu Compra:
                </span>
                <ul className="divide-y divide-stone-200/60 max-h-36 overflow-y-auto pr-1">
                  {itemParaPagar.data.items_pedido?.map((it: any) => (
                    <li key={it.id || Math.random()} className="py-1.5 first:pt-0 last:pb-0 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-stone-900">{it.productos?.nombre || "Pieza en Stock"}</p>
                        <p className="text-[11px] text-stone-500 font-sans">
                          {it.cantidad}x unidad(es) {it.es_personalizado ? "· Personalizado (+15%)" : ""}
                        </p>
                      </div>
                      <span className="font-mono font-bold text-stone-900">
                        {formatPrecio(it.precio_unitario_final * it.cantidad)}
                      </span>
                    </li>
                  ))}
                </ul>
                
                <div className="pt-2 border-t border-stone-200 text-[11px] text-stone-600 space-y-1 font-sans">
                  <div className="flex justify-between">
                    <span>Subtotal piezas:</span>
                    <span>{formatPrecio(itemParaPagar.data.subtotal)}</span>
                  </div>
                  {itemParaPagar.data.descuento_aplicado > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Descuento aplicado:</span>
                      <span>-{formatPrecio(itemParaPagar.data.descuento_aplicado)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Envío:</span>
                    <span>{itemParaPagar.data.costo_envio === 0 ? "Sin Cargo ($0)" : formatPrecio(itemParaPagar.data.costo_envio)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-xs text-chocolate pt-1 border-t border-stone-200">
                    <span>Total a transferir:</span>
                    <span className="font-mono text-terracota">{formatPrecio(itemParaPagar.data.total)}</span>
                  </div>
                </div>
              </div>
            )}

            {itemParaPagar.tipo === "encargo" && (
              <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-3.5 space-y-1.5 text-xs font-sans">
                <span className="text-[11px] font-bold text-chocolate uppercase tracking-wider block font-sans">
                  🎨 Pieza por Encargo:
                </span>
                <p className="font-bold text-stone-900 text-sm">
                  {itemParaPagar.data.productos?.nombre || itemParaPagar.data.formatos_catalogo?.nombre || "Pieza a Medida"}
                </p>
                {itemParaPagar.data.detalle_personalizacion && (
                  <p className="text-[11px] text-stone-600 italic">
                    &ldquo;{itemParaPagar.data.detalle_personalizacion}&rdquo;
                  </p>
                )}
                <div className="flex justify-between text-[11px] text-stone-600 pt-2 border-t border-stone-200">
                  <span>Total estimado de la pieza:</span>
                  <span className="font-mono font-bold text-stone-900">{formatPrecio(itemParaPagar.data.total_estimado || itemParaPagar.data.precio_base_cotizado || 0)}</span>
                </div>
                <div className="flex justify-between text-xs text-emerald-800 font-bold pt-0.5">
                  <span>Seña inicial del 20%:</span>
                  <span className="font-mono text-emerald-700">{formatPrecio(Math.round((itemParaPagar.data.total_estimado || itemParaPagar.data.precio_base_cotizado || 0) * 0.2))}</span>
                </div>
              </div>
            )}

            {/* Caja de Alias Clickeable */}
            <div className="rounded-2xl bg-arena/30 border-2 border-dashed border-terracota/40 p-4 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-barro block font-sans">
                    Alias de la Cuenta:
                  </span>
                  <span className="font-mono text-lg font-black text-chocolate select-all">
                    milideasarte
                  </span>
                </div>
                <button
                  type="button"
                  onClick={copiarAlias}
                  className="rounded-full bg-terracota hover:bg-terracota/90 text-white px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  {aliasCopiado ? "✓ ¡Copiado!" : "📋 Copiar"}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40 text-[11px] text-stone-600 font-sans">
                <p><span className="font-semibold text-chocolate">Titular:</span> Milagros Anita Ferrero</p>
                <p><span className="font-semibold text-chocolate">Banco:</span> Brubank</p>
                <p><span className="font-semibold text-chocolate">CUIT:</span> 27-43717260-4</p>
                <p><span className="font-semibold text-chocolate">Cuenta:</span> Caja de Ahorro $</p>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <a
                href={`https://wa.me/5493493664420?text=${encodeURIComponent(
                  `¡Hola Mili! Te adjunto el comprobante de transferencia para mi ${itemParaPagar.tipo === "pedido" ? "compra" : "encargo"} #${itemParaPagar.data.id.slice(0, 8).toUpperCase()}.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <WhatsAppIcon className="w-4 h-4 text-white" />
                <span>Enviar Comprobante por WhatsApp →</span>
              </a>

              <Button
                variant="outline"
                onClick={() => setItemParaPagar(null)}
                className="w-full rounded-full text-xs font-semibold cursor-pointer"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL CONFIRMAR OCULTAR PEDIDO (✕) ─── */}
      {itemParaOcultar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl border border-[#E5E0D8] bg-white p-6 shadow-2xl space-y-4 text-center">
            <div className="h-12 w-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-xl">
              🗑️
            </div>
            <div className="space-y-1">
              <h3 className="font-serif font-bold text-chocolate text-base">
                ¿Quitar del historial?
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                ¿Deseás remover <strong>{itemParaOcultar.titulo}</strong> de tu lista visible?
              </p>
            </div>
            <div className="flex justify-center gap-2 pt-2 border-t border-stone-100">
              <Button
                variant="outline"
                onClick={() => setItemParaOcultar(null)}
                className="rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmarOcultar}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 cursor-pointer"
              >
                Quitar del Historial
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL DETALLE COMPLETO DE COMPRA / ENCARGO ─── */}
      {itemSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-[#E5E0D8] bg-white p-6 shadow-2xl space-y-5">
            
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
                  {itemSeleccionado.tipo === "pedido" ? "Detalle de Compra en Stock" : "Detalle de Encargo a Medida"}
                </span>
                <h3 className="font-serif font-bold text-chocolate text-lg">
                  #{itemSeleccionado.data.id.slice(0, 8).toUpperCase()}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setItemSeleccionado(null)}
                className="text-stone-400 hover:text-stone-700 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Content for Pedido */}
            {itemSeleccionado.tipo === "pedido" && (
              <div className="space-y-4 text-xs">
                <div className="flex justify-between items-center bg-stone-50 p-3 rounded-2xl border border-stone-200">
                  <span className="text-stone-500 font-medium">Estado del pedido:</span>
                  <Badge variant={ESTADOS_PEDIDO[itemSeleccionado.data.estado]?.variant || "muted"}>
                    {ESTADOS_PEDIDO[itemSeleccionado.data.estado]?.label || itemSeleccionado.data.estado}
                  </Badge>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-chocolate text-xs uppercase tracking-wider">
                    Piezas Compradas
                  </h4>
                  <ul className="divide-y divide-stone-100 border border-stone-200 rounded-2xl p-3 bg-stone-50 space-y-2">
                    {itemSeleccionado.data.items_pedido?.map((it: any) => (
                      <li key={it.id} className="pt-2 first:pt-0 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-chocolate">{it.productos?.nombre || "Pieza"}</p>
                          <p className="text-[11px] text-stone-500">Cantidad: {it.cantidad}</p>
                        </div>
                        <span className="font-mono font-bold text-stone-900">
                          {formatPrecio(it.precio_unitario_final * it.cantidad)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Totals */}
                <div className="space-y-1.5 border-t border-stone-200 pt-3">
                  <div className="flex justify-between text-stone-600">
                    <span>Subtotal:</span>
                    <span>{formatPrecio(itemSeleccionado.data.subtotal)}</span>
                  </div>
                  {itemSeleccionado.data.descuento_aplicado > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Descuento:</span>
                      <span>-{formatPrecio(itemSeleccionado.data.descuento_aplicado)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-stone-600">
                    <span>Envío:</span>
                    <span>{itemSeleccionado.data.costo_envio === 0 ? "Gratis ($0)" : formatPrecio(itemSeleccionado.data.costo_envio)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-chocolate border-t border-stone-200 pt-2">
                    <span>TOTAL:</span>
                    <span className="font-mono text-base text-terracota">{formatPrecio(itemSeleccionado.data.total)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3">
                  {itemSeleccionado.data.estado === "pendiente_pago" && (
                    <Button
                      onClick={() => {
                        const data = itemSeleccionado.data;
                        setItemSeleccionado(null);
                        setItemParaPagar({ tipo: "pedido", data });
                      }}
                      className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-full py-2.5 cursor-pointer"
                    >
                      💳 Ver Datos de Pago
                    </Button>
                  )}
                  <a
                    href={`https://wa.me/5493493664420?text=${encodeURIComponent(
                      `¡Hola Mili! Te consulto por mi compra #${itemSeleccionado.data.id.slice(0, 8).toUpperCase()}.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold py-2.5 transition-all cursor-pointer"
                  >
                    <WhatsAppIcon className="w-4 h-4 text-white" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            )}

            {/* Content for Encargo */}
            {itemSeleccionado.tipo === "encargo" && (
              <div className="space-y-4 text-xs">
                <div className="flex justify-between items-center bg-stone-50 p-3 rounded-2xl border border-stone-200">
                  <span className="text-stone-500 font-medium">Estado del encargo:</span>
                  <Badge variant={ESTADOS_ENCARGO[itemSeleccionado.data.estado]?.variant || "muted"}>
                    {ESTADOS_ENCARGO[itemSeleccionado.data.estado]?.label || itemSeleccionado.data.estado}
                  </Badge>
                </div>

                <div className="rounded-2xl border border-stone-200 p-3 bg-stone-50 space-y-2">
                  <p className="font-serif font-bold text-chocolate text-sm">
                    {itemSeleccionado.data.productos?.nombre || itemSeleccionado.data.formatos_catalogo?.nombre || "Pieza por Encargo"}
                  </p>
                  {itemSeleccionado.data.detalle_personalizacion && (
                    <p className="text-stone-600 italic">
                      &ldquo;{itemSeleccionado.data.detalle_personalizacion}&rdquo;
                    </p>
                  )}
                  <p className="text-stone-500 font-mono text-[11px]">
                    Presupuesto estimado: {formatPrecio(itemSeleccionado.data.total_estimado || itemSeleccionado.data.precio_base_cotizado || 0)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3">
                  {itemSeleccionado.data.estado === "aceptado" && (
                    <Button
                      onClick={() => {
                        const data = itemSeleccionado.data;
                        setItemSeleccionado(null);
                        setItemParaPagar({ tipo: "encargo", data });
                      }}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-full py-2.5 cursor-pointer"
                    >
                      🪙 Pagar Seña (20%)
                    </Button>
                  )}
                  <a
                    href={`https://wa.me/5493493664420?text=${encodeURIComponent(
                      `¡Hola Mili! Te consulto por mi encargo #${itemSeleccionado.data.id.slice(0, 8).toUpperCase()}.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold py-2.5 transition-all cursor-pointer"
                  >
                    <WhatsAppIcon className="w-4 h-4 text-white" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
