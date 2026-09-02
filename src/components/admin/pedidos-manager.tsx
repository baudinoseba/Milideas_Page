"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { formatPrecio } from "@/lib/pricing";
import {
  confirmarPagoAction,
  cancelarPedidoAction,
  marcarEnviadoAction,
  reabrirPedidoAction,
  eliminarPedidoAction,
  eliminarPedidosMultiplesAction,
} from "@/lib/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import {
  extractBankInfo,
  buildWhatsAppLink,
  generateMensajePedidoWhatsApp,
  getResumenItemsPedido,
  type TipoMensajePedido,
  type WhatsAppBankInfo,
} from "@/lib/utils/pedidos-whatsapp";
import { toast } from "@/stores/toast-store";
import type { ConfiguracionSitio } from "@/types";

interface PedidosManagerProps {
  initialPedidos: any[];
  configSitio?: ConfiguracionSitio | null;
}

export function PedidosManager({ initialPedidos, configSitio }: PedidosManagerProps) {
  const [pedidos, setPedidos] = useState<any[]>(initialPedidos);
  const [filtroEstado, setFiltroEstado] = useState<string>("activos");
  const [subFiltroHistorico, setSubFiltroHistorico] = useState<"todos" | "entregados" | "cancelados">("todos");
  const [busqueda, setBusqueda] = useState<string>("");
  const [filtroEntrega, setFiltroEntrega] = useState<string>("todos");
  const [isPending, startTransition] = useTransition();

  // Multi-selection state for Bulk actions in Histórico
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);

  // Detail Pop-up Modal
  const [detailModalPedido, setDetailModalPedido] = useState<any | null>(null);

  // Modals state
  const [confirmPayModal, setConfirmPayModal] = useState<any | null>(null);
  const [cancelModal, setCancelModal] = useState<any | null>(null);
  const [dispatchModal, setDispatchModal] = useState<any | null>(null);
  const [trackingInput, setTrackingInput] = useState<string>("");
  const [deleteModalPedido, setDeleteModalPedido] = useState<any | null>(null);

  const [messageModal, setMessageModal] = useState<{
    pedido: any;
    tipo: TipoMensajePedido;
    titulo: string;
    texto: string;
  } | null>(null);
  const [copiedFeedback, setCopiedFeedback] = useState(false);

  const bankInfo: WhatsAppBankInfo = useMemo(() => extractBankInfo(configSitio), [configSitio]);
  const [ahora] = useState(() => Date.now());
  const VEINTICUATRO_HORAS_MS = 24 * 60 * 60 * 1000;

  // Counts for KPIs and Filter Tabs
  const counts = useMemo(() => {
    const res = {
      activos: 0,
      pendientes: 0,
      listosEnvio: 0,
      listosRetiro: 0,
      entregados: 0,
      cancelados: 0,
      historicoTotal: 0,
    };

    for (const p of pedidos) {
      const isRetiro =
        String(p.tipo_envio || "").toLowerCase().includes("retiro") ||
        Number(p.costo_envio || 0) === 0;

      if (p.estado === "enviado" || p.estado === "entregado") {
        res.entregados++;
        res.historicoTotal++;
      } else if (p.estado === "cancelado") {
        res.cancelados++;
        res.historicoTotal++;
      } else if (p.estado === "pendiente_pago" || p.estado === "reservado") {
        res.pendientes++;
        res.activos++;
      } else if (p.estado === "confirmado") {
        res.activos++;
        if (isRetiro) {
          res.listosRetiro++;
        } else {
          res.listosEnvio++;
        }
      }
    }
    return res;
  }, [pedidos]);

  // Filtered orders list
  const filtrados = useMemo(() => {
    return pedidos.filter((p) => {
      const isHistorico = p.estado === "enviado" || p.estado === "entregado" || p.estado === "cancelado";
      const isRetiro =
        String(p.tipo_envio || "").toLowerCase().includes("retiro") ||
        Number(p.costo_envio || 0) === 0;

      // Filter by main tab
      if (filtroEstado === "activos") {
        if (isHistorico) return false;
      } else if (filtroEstado === "pendientes") {
        if (p.estado !== "pendiente_pago" && p.estado !== "reservado") return false;
      } else if (filtroEstado === "listos_envio") {
        if (p.estado !== "confirmado" || isRetiro) return false;
      } else if (filtroEstado === "listos_retiro") {
        if (p.estado !== "confirmado" || !isRetiro) return false;
      } else if (filtroEstado === "historico") {
        if (!isHistorico) return false;
        if (subFiltroHistorico === "entregados" && (p.estado === "cancelado")) return false;
        if (subFiltroHistorico === "cancelados" && (p.estado !== "cancelado")) return false;
      }

      // Filter by delivery method
      if (filtroEntrega !== "todos") {
        if (filtroEntrega === "envio" && isRetiro) return false;
        if (filtroEntrega === "taller" && !isRetiro) return false;
      }

      // Search by keyword
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase().trim();
        const nombre = (p.nombre_contacto || "").toLowerCase();
        const tel = (p.whatsapp_contacto || "").toLowerCase();
        const id = (p.id || "").toLowerCase();
        const email = (p.email_contacto || "").toLowerCase();
        const items = getResumenItemsPedido(p).toLowerCase();

        return (
          nombre.includes(q) ||
          tel.includes(q) ||
          id.includes(q) ||
          email.includes(q) ||
          items.includes(q)
        );
      }

      return true;
    });
  }, [pedidos, filtroEstado, subFiltroHistorico, filtroEntrega, busqueda]);

  // Handlers for Order Operations
  const handleConfirmarPago = (pedido: any) => {
    startTransition(async () => {
      const res = await confirmarPagoAction(pedido.id);
      if (!("error" in res)) {
        setPedidos((prev) =>
          prev.map((item) => (item.id === pedido.id ? { ...item, estado: "confirmado" } : item)),
        );
        setConfirmPayModal(null);
        toast.success("Pago confirmado con éxito ✓");
        // Open WhatsApp message confirmation
        const isRetiro =
          String(pedido.tipo_envio || "").toLowerCase().includes("retiro") ||
          Number(pedido.costo_envio || 0) === 0;
        openMessagePreview(
          { ...pedido, estado: "confirmado" },
          isRetiro ? "pago_confirmado_retiro" : "pago_confirmado_envio",
        );
      } else {
        toast.error((res as any).error || "Error al confirmar el pago");
      }
    });
  };

  const handleCancelarPedido = (pedido: any) => {
    startTransition(async () => {
      const res = await cancelarPedidoAction(pedido.id);
      if (!("error" in res)) {
        setPedidos((prev) =>
          prev.map((item) => (item.id === pedido.id ? { ...item, estado: "cancelado" } : item)),
        );
        setCancelModal(null);
        setDetailModalPedido(null);
        toast.success("Pedido cancelado y stock reincorporado");
        // Open WhatsApp cancellation notice
        openMessagePreview({ ...pedido, estado: "cancelado" }, "pedido_cancelado_stock");
      } else {
        toast.error((res as any).error || "Error al cancelar el pedido");
      }
    });
  };

  const handleDespacharPedido = (pedido: any) => {
    startTransition(async () => {
      const res = await marcarEnviadoAction(pedido.id, trackingInput.trim() || undefined);
      if (res.success) {
        setPedidos((prev) =>
          prev.map((item) =>
            item.id === pedido.id
              ? { ...item, estado: "enviado", comprobante_url: trackingInput.trim() || item.comprobante_url }
              : item,
          ),
        );
        setDispatchModal(null);
        setDetailModalPedido(null);
        toast.success("Pedido marcado como despachado / enviado");
        // Open WhatsApp dispatch notice
        openMessagePreview(
          { ...pedido, estado: "enviado", comprobante_url: trackingInput.trim() },
          "pedido_despachado_tracking",
        );
      } else {
        toast.error(res.error || "Error al marcar como despachado");
      }
    });
  };

  const handleEntregarEnTaller = (pedido: any) => {
    startTransition(async () => {
      const res = await marcarEnviadoAction(pedido.id);
      if (res.success) {
        setPedidos((prev) =>
          prev.map((item) => (item.id === pedido.id ? { ...item, estado: "enviado" } : item)),
        );
        setDetailModalPedido(null);
        toast.success("Pedido marcado como entregado en taller ✓");
      } else {
        toast.error(res.error || "Error al marcar entrega");
      }
    });
  };

  const handleReabrir = (pedido: any, nuevoEstado: string) => {
    startTransition(async () => {
      const res = await reabrirPedidoAction(pedido.id, nuevoEstado);
      if (res.success) {
        setPedidos((prev) =>
          prev.map((item) => (item.id === pedido.id ? { ...item, estado: nuevoEstado } : item)),
        );
        setDetailModalPedido(null);
        toast.success(`Pedido reabierto en estado: ${nuevoEstado}`);
      } else {
        toast.error(res.error || "Error al reabrir pedido");
      }
    });
  };

  const handleEliminarIndividual = (id: string) => {
    startTransition(async () => {
      const res = await eliminarPedidoAction(id);
      if (res.success) {
        setPedidos((prev) => prev.filter((item) => item.id !== id));
        setSelectedIds((prev) => prev.filter((itemId) => itemId !== id));
        setDeleteModalPedido(null);
        setDetailModalPedido(null);
        toast.success("Pedido eliminado con éxito");
      } else {
        toast.error(res.error || "Error al eliminar el pedido");
      }
    });
  };

  const handleBulkDelete = () => {
    startTransition(async () => {
      const res = await eliminarPedidosMultiplesAction(selectedIds);
      if (res.success) {
        setPedidos((prev) => prev.filter((item) => !selectedIds.includes(item.id)));
        const count = selectedIds.length;
        setSelectedIds([]);
        setBulkDeleteModalOpen(false);
        toast.success(`${count} pedidos eliminados`);
      } else {
        toast.error(res.error || "Error al eliminar los pedidos");
      }
    });
  };

  // Selection toggle handlers
  const handleToggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id],
    );
  };

  const handleSelectAllFiltered = () => {
    if (selectedIds.length === filtrados.length && filtrados.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtrados.map((e) => e.id));
    }
  };

  const openMessagePreview = (pedido: any, tipo: TipoMensajePedido) => {
    const generated = generateMensajePedidoWhatsApp(tipo, pedido, bankInfo, {
      codigoSeguimiento: trackingInput.trim() || pedido.comprobante_url,
    });
    setMessageModal({
      pedido,
      tipo,
      titulo: generated.titulo,
      texto: generated.texto,
    });
    setCopiedFeedback(false);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedFeedback(true);
      setTimeout(() => setCopiedFeedback(false), 2500);
    } catch {
      // fallback
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Box Icon and Clean Title */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📦</span>
            <h1 className="text-2xl font-serif font-bold text-chocolate">Gestión de Ventas de la Tienda</h1>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards - Solid Black/Dark Text */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setFiltroEstado("pendientes")}
          className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
            filtroEstado === "pendientes"
              ? "bg-[#FEF3C7] border-amber-600 shadow-xs ring-2 ring-amber-500"
              : "bg-[#FFFBEB] border-amber-300 hover:border-amber-500"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black tracking-wide" style={{ color: "#1c1917" }}>
              1. Pagos por Revisar
            </span>
            <span className="text-sm">⏳</span>
          </div>
          <p className="text-2xl font-black font-serif mt-1" style={{ color: "#3D2B1F" }}>
            {counts.pendientes}
          </p>
          <p className="text-[11px] font-semibold" style={{ color: "#44403c" }}>
            Transferencias pendientes
          </p>
        </button>

        <button
          onClick={() => setFiltroEstado("listos_envio")}
          className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
            filtroEstado === "listos_envio"
              ? "bg-[#E0F2FE] border-sky-600 shadow-xs ring-2 ring-sky-500"
              : "bg-[#F0F9FF] border-sky-300 hover:border-sky-500"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black tracking-wide" style={{ color: "#1c1917" }}>
              2. Listos para Envío
            </span>
            <span className="text-sm">🚚</span>
          </div>
          <p className="text-2xl font-black font-serif mt-1" style={{ color: "#3D2B1F" }}>
            {counts.listosEnvio}
          </p>
          <p className="text-[11px] font-semibold" style={{ color: "#44403c" }}>
            Por despachar / empaque
          </p>
        </button>

        <button
          onClick={() => setFiltroEstado("listos_retiro")}
          className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
            filtroEstado === "listos_retiro"
              ? "bg-[#EDE9FE] border-violet-600 shadow-xs ring-2 ring-violet-500"
              : "bg-[#F5F3FF] border-violet-300 hover:border-violet-500"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black tracking-wide" style={{ color: "#1c1917" }}>
              3. Listos para Retiro
            </span>
            <span className="text-sm">🏪</span>
          </div>
          <p className="text-2xl font-black font-serif mt-1" style={{ color: "#3D2B1F" }}>
            {counts.listosRetiro}
          </p>
          <p className="text-[11px] font-semibold" style={{ color: "#44403c" }}>
            Esperando retiro en taller
          </p>
        </button>

        <button
          onClick={() => setFiltroEstado("historico")}
          className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
            filtroEstado === "historico"
              ? "bg-[#D1FAE5] border-emerald-600 shadow-xs ring-2 ring-emerald-500"
              : "bg-[#ECFDF5] border-emerald-300 hover:border-emerald-500"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black tracking-wide" style={{ color: "#1c1917" }}>
              4. Histórico
            </span>
            <span className="text-sm">📜</span>
          </div>
          <p className="text-2xl font-black font-serif mt-1" style={{ color: "#3D2B1F" }}>
            {counts.historicoTotal}
          </p>
          <p className="text-[11px] font-semibold" style={{ color: "#44403c" }}>
            Entregados y cancelados
          </p>
        </button>
      </div>

      {/* Main Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: "activos", label: "Activos en Curso", count: counts.activos },
          { id: "pendientes", label: "1. Pagos por Revisar", count: counts.pendientes },
          { id: "listos_envio", label: "2. Listos para Envío 🚚", count: counts.listosEnvio },
          { id: "listos_retiro", label: "3. Listos para Retiro 🏪", count: counts.listosRetiro },
          { id: "historico", label: "📜 Histórico", count: counts.historicoTotal },
        ].map((tab) => {
          const isActive = filtroEstado === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setFiltroEstado(tab.id);
                setSelectedIds([]);
              }}
              className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all shrink-0 cursor-pointer ${
                isActive
                  ? "bg-chocolate text-crema-cruda font-semibold shadow-xs"
                  : "bg-surface text-muted hover:bg-arena hover:text-foreground border border-border/60"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  isActive ? "bg-crema-cruda text-chocolate" : "bg-arena/80 text-foreground"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search and Delivery Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-xs">🔍</span>
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por cliente, teléfono, producto, código de pedido..."
            className="pl-8 text-xs rounded-xl bg-surface border-border/70 w-full"
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground text-xs cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={filtroEntrega}
            onChange={(e) => setFiltroEntrega(e.target.value)}
            className="rounded-xl border border-border/70 bg-surface px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-admin-accent w-full sm:w-auto"
          >
            <option value="todos">📦 Todos los envíos/retiros</option>
            <option value="taller">🏪 Retiro en Taller</option>
            <option value="envio">🚚 Envío a Domicilio/Sucursal</option>
          </select>
        </div>
      </div>

      {/* COMPACT & LIGHT VIEW FOR HISTÓRICO (Entregados + Cancelados) */}
      {filtroEstado === "historico" ? (
        <div className="space-y-3">
          {/* Sub-navigation bar inside Histórico */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E5E0D8]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-chocolate font-serif mr-1">📜 Histórico:</span>
              <button
                onClick={() => {
                  setSubFiltroHistorico("todos");
                  setSelectedIds([]);
                }}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  subFiltroHistorico === "todos"
                    ? "bg-chocolate text-crema-cruda shadow-xs"
                    : "bg-white text-stone-700 hover:bg-stone-100 border border-stone-200"
                }`}
              >
                Todos ({counts.historicoTotal})
              </button>
              <button
                onClick={() => {
                  setSubFiltroHistorico("entregados");
                  setSelectedIds([]);
                }}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  subFiltroHistorico === "entregados"
                    ? "bg-emerald-700 text-white shadow-xs"
                    : "bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-200"
                }`}
              >
                ✓ Entregados / Despachados ({counts.entregados})
              </button>
              <button
                onClick={() => {
                  setSubFiltroHistorico("cancelados");
                  setSelectedIds([]);
                }}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  subFiltroHistorico === "cancelados"
                    ? "bg-stone-700 text-white shadow-xs"
                    : "bg-white text-stone-700 hover:bg-stone-100 border border-stone-200"
                }`}
              >
                ❌ Cancelados ({counts.cancelados})
              </button>
            </div>

            {/* Bulk Selection Actions */}
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2 animate-in fade-in duration-150">
                <span className="text-xs font-bold text-stone-900 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-xl">
                  {selectedIds.length} seleccionados
                </span>
                <Button
                  onClick={() => setBulkDeleteModalOpen(true)}
                  className="bg-red-600 text-white hover:bg-red-700 text-xs rounded-xl min-h-8 py-1 px-3 shadow-xs gap-1 cursor-pointer"
                >
                  <span>🗑️ Eliminar ({selectedIds.length})</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedIds([])}
                  className="text-xs rounded-xl min-h-8 py-1 px-2.5 text-stone-600"
                >
                  ✕ Desmarcar
                </Button>
              </div>
            )}
          </div>

          {/* Table Container - Fits 100% Width without Horizontal Overflow */}
          {filtrados.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#E5E0D8] bg-[#FAF7F2] p-12 text-center text-muted">
              <span className="text-4xl block mb-3">📜</span>
              <p className="text-sm font-semibold text-stone-800">No hay pedidos en esta sección del histórico</p>
              <p className="text-xs text-stone-600 mt-1">
                {subFiltroHistorico === "cancelados"
                  ? "No hay pedidos cancelados archivados."
                  : subFiltroHistorico === "entregados"
                    ? "No hay pedidos concluidos y entregados aún."
                    : "Los pedidos finalizados o cancelados se archivarán aquí para mantener despejado tu taller."}
              </p>
            </div>
          ) : (
            <div className="rounded-3xl border border-[#E5E0D8] bg-white overflow-hidden shadow-xs">
              <div className="w-full">
                <table className="w-full text-left text-xs border-collapse table-auto">
                  <thead>
                    <tr className="border-b border-[#E5E0D8] bg-[#FAF7F2] text-[11px] font-bold text-stone-700">
                      <th className="py-3 px-3 w-8 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.length === filtrados.length && filtrados.length > 0}
                          onChange={handleSelectAllFiltered}
                          className="h-4 w-4 rounded border-stone-300 text-chocolate focus:ring-chocolate cursor-pointer"
                          title="Seleccionar todos"
                        />
                      </th>
                      <th className="py-3 px-2 whitespace-nowrap">Estado</th>
                      <th className="py-3 px-3 whitespace-nowrap">Fecha</th>
                      <th className="py-3 px-3">Cliente</th>
                      <th className="py-3 px-3">Pieza(s)</th>
                      <th className="py-3 px-3 whitespace-nowrap text-right">Total</th>
                      <th className="py-3 px-3 whitespace-nowrap text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0EDE8]">
                    {filtrados.map((p) => {
                      const isDelivered = p.estado === "enviado" || p.estado === "entregado";
                      const isCancelado = p.estado === "cancelado";
                      const isSelected = selectedIds.includes(p.id);

                      return (
                        <tr
                          key={p.id}
                          onClick={() => setDetailModalPedido(p)}
                          className={`transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-amber-50/90"
                              : "hover:bg-[#FAF7F2]"
                          }`}
                        >
                          <td
                            className="py-3 px-3 text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectOne(p.id)}
                              className="h-4 w-4 rounded border-stone-300 text-chocolate focus:ring-chocolate cursor-pointer"
                            />
                          </td>
                          <td className="py-3 px-2 whitespace-nowrap">
                            {isDelivered ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                ✓ Entregado
                              </span>
                            ) : isCancelado ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-200 text-stone-800 border border-stone-300">
                                ❌ Cancelado
                              </span>
                            ) : (
                              <Badge variant="muted" className="text-[10px]">
                                {p.estado}
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-3 text-stone-600 font-medium whitespace-nowrap">
                            {new Date(p.created_at).toLocaleDateString("es-AR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="py-3 px-3">
                            <p className="font-bold text-stone-900 leading-tight">{p.nombre_contacto || "Cliente"}</p>
                            <span className="text-[11px] text-stone-500 font-mono">{p.whatsapp_contacto}</span>
                          </td>
                          <td className="py-3 px-3 font-semibold text-chocolate max-w-[200px] truncate">
                            {getResumenItemsPedido(p)}
                          </td>
                          <td className="py-3 px-3 font-black text-stone-900 font-serif whitespace-nowrap text-right">
                            {formatPrecio(p.total || 0)}
                          </td>
                          <td
                            className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="outline"
                              onClick={() => setDetailModalPedido(p)}
                              className="text-[11px] rounded-xl min-h-7 py-0.5 px-2 font-semibold text-chocolate hover:bg-arena/30 border-border/80"
                              title="Ver detalle completo del pedido"
                            >
                              👁️ Detalle
                            </Button>
                            {isDelivered ? (
                              <Button
                                variant="outline"
                                onClick={() => handleReabrir(p, "confirmado")}
                                className="text-[11px] rounded-xl min-h-7 py-0.5 px-2 font-semibold text-stone-800 hover:bg-stone-100 border-stone-300"
                                title="Reabrir a taller activo (Listo)"
                              >
                                🔄 Reabrir
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                onClick={() => handleReabrir(p, "pendiente_pago")}
                                className="text-[11px] rounded-xl min-h-7 py-0.5 px-2 font-semibold text-stone-800 hover:bg-stone-100 border-stone-300"
                                title="Reabrir a Pendiente de Pago"
                              >
                                🔄 Reabrir
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              onClick={() => setDeleteModalPedido(p)}
                              className="text-[11px] rounded-xl min-h-7 py-0.5 px-2 text-red-600 hover:bg-red-50 border-red-200"
                              title="Eliminar permanentemente este registro"
                            >
                              🗑️
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* STANDARD PIPELINE CARDS (Stock Orders Active Workflow) */
        filtrados.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#E5E0D8] bg-[#FAF7F2] p-12 text-center text-muted">
            <span className="text-4xl block mb-3">📦</span>
            <p className="text-sm font-semibold text-stone-800">No se encontraron pedidos de stock</p>
            <p className="text-xs text-stone-600 mt-1">
              {busqueda
                ? "Prueba cambiando el término de búsqueda o los filtros aplicados."
                : "No hay compras de stock en esta etapa actualmente."}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {filtrados.map((pedido) => {
              const total = pedido.total || 0;
              const isRetiro =
                String(pedido.tipo_envio || "").toLowerCase().includes("retiro") ||
                Number(pedido.costo_envio || 0) === 0;

              const diffMs = ahora - new Date(pedido.created_at).getTime();
              const esDemorado24hs =
                (pedido.estado === "pendiente_pago" || pedido.estado === "reservado") &&
                diffMs > VEINTICUATRO_HORAS_MS;
              const horasTranscurridas = Math.floor(diffMs / (60 * 60 * 1000));

              const isPaid = pedido.estado === "confirmado" || pedido.estado === "enviado";

              return (
                <div
                  key={pedido.id}
                  className="rounded-3xl border p-5 sm:p-6 shadow-xs space-y-5 transition-all border-[#E5E0D8] bg-white hover:border-admin-accent/50"
                >
                  {/* Header: ID, Date, Delivery Method & Total Summary */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#F0EDE8] pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-admin-accent uppercase tracking-wider font-mono">
                          #{pedido.id.slice(0, 8)}
                        </span>
                        {pedido.estado === "pendiente_pago" || pedido.estado === "reservado" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            ⏳ Esperando Pago
                          </span>
                        ) : pedido.estado === "confirmado" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                            ✓ Pago Confirmado
                          </span>
                        ) : null}

                        <span className="rounded-full bg-arena/50 px-2.5 py-0.5 text-[10px] font-medium text-barro border border-border/40">
                          {isRetiro ? "🏪 Retiro en Taller" : "🚚 Envío a Domicilio"}
                        </span>
                        <span className="text-xs text-stone-600 font-medium">
                          · {new Date(pedido.created_at).toLocaleDateString("es-AR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-chocolate">
                        {getResumenItemsPedido(pedido)}
                      </h3>
                    </div>

                    {/* Financial Quick Card */}
                    <div className="flex items-center gap-3 bg-arena/20 p-2.5 rounded-2xl border border-border/50 self-start sm:self-auto">
                      <div className="text-right pr-3 border-r border-border/50">
                        <span className="text-[10px] text-stone-600 uppercase font-sans block font-semibold">Total a Cobrar</span>
                        <span className="text-base font-black text-chocolate font-serif">{formatPrecio(total)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-stone-600 uppercase font-sans block font-semibold">Estado Pago</span>
                        <span
                          className="text-xs font-black"
                          style={{
                            color: isPaid ? "#15803D" : "#92400E",
                          }}
                        >
                          {isPaid ? "✓ 100% Cobrado" : "⏳ Pendiente"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 24h Expiry Alert for Pending Payments */}
                  {esDemorado24hs && (
                    <div className="bg-red-50/90 border-2 border-red-300 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs animate-in fade-in">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">⏱️</span>
                        <div>
                          <p className="font-bold text-red-950 text-xs">
                            Plazo de 24hs excedido ({horasTranscurridas}hs transcurridas)
                          </p>
                          <p className="text-[11px] text-red-800 mt-0.5">
                            El comprador aún no envió el comprobante de transferencia bancaria.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => openMessagePreview(pedido, "recordatorio_pago_24h")}
                          className="inline-flex items-center gap-1.5 bg-[#25D366] text-white hover:bg-[#1ebe5d] text-xs rounded-xl font-semibold px-3 py-1.5 shadow-xs transition-colors cursor-pointer"
                        >
                          <WhatsAppIcon className="h-4 w-4 fill-current" />
                          <span>Recordar Pago (WhatsApp)</span>
                        </button>
                        <Button
                          variant="outline"
                          onClick={() => setCancelModal(pedido)}
                          className="text-xs rounded-xl min-h-8 py-1 px-3 text-red-700 bg-white hover:bg-red-100 border-red-300 font-bold"
                        >
                          ❌ Cancelar y Devolver al Stock
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Stepper with Warm Artisanal Palette */}
                  <div className="bg-[#FAF7F2] rounded-2xl p-3.5 sm:p-4 border border-[#E5E0D8]">
                    <div className="flex items-center justify-between text-xs font-semibold mb-3">
                      <span className="flex items-center gap-1.5 text-chocolate font-bold">
                        <span>📦</span>
                        <span className="font-serif text-xs">Estado de la Compra de Stock</span>
                      </span>
                      <span className="text-[11px] text-stone-700 font-semibold">
                        {pedido.estado === "pendiente_pago" || pedido.estado === "reservado"
                          ? "Paso 1 de 3: Validación de Pago"
                          : pedido.estado === "confirmado"
                            ? isRetiro
                              ? "Paso 2 de 3: Listo para Retirar en Taller"
                              : "Paso 2 de 3: Listo para Despachar"
                            : "Paso 3 de 3: Entregado / Despachado"}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center text-xs">
                      {/* Step 1: Pago */}
                      {(() => {
                        const isCompleted = isPaid;
                        const isActive = !isPaid;
                        return (
                          <div
                            className={`p-2.5 sm:p-3 rounded-2xl border-2 transition-all shadow-xs ${
                              isCompleted
                                ? "bg-[#FAFDF7] border-[#16A34A]"
                                : isActive
                                  ? "bg-[#FFF9F0] border-[#8B5A2B] ring-2 ring-[#8B5A2B]/15"
                                  : "bg-[#FAFAFA] border-[#E5E7EB]"
                            }`}
                          >
                            <div className="flex items-center justify-center mb-1">
                              <span
                                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-black shadow-xs ${
                                  isCompleted
                                    ? "bg-[#16A34A] text-white"
                                    : isActive
                                      ? "bg-[#8B5A2B] text-white"
                                      : "bg-[#E5E7EB] text-[#4B5563]"
                                }`}
                              >
                                {isCompleted ? "✓" : "1"}
                              </span>
                            </div>
                            <span
                              className={`text-xs block font-black ${
                                isCompleted || isActive ? "text-[#1c1917]" : "text-[#737373]"
                              }`}
                            >
                              Pago
                            </span>
                            <span
                              className={`block text-[11px] font-bold mt-0.5 ${
                                isCompleted
                                  ? "text-[#15803D]"
                                  : isActive
                                    ? "text-[#1c1917]"
                                    : "text-[#A3A3A3] text-[10px] font-medium"
                              }`}
                            >
                              {isCompleted ? "✓ Confirmado" : "⏳ Por revisar"}
                            </span>
                          </div>
                        );
                      })()}

                      {/* Step 2: Preparación */}
                      {(() => {
                        const isCompleted = pedido.estado === "enviado" || pedido.estado === "entregado";
                        const isActive = pedido.estado === "confirmado";
                        return (
                          <div
                            className={`p-2.5 sm:p-3 rounded-2xl border-2 transition-all shadow-xs ${
                              isCompleted
                                ? "bg-[#FAFDF7] border-[#16A34A]"
                                : isActive
                                  ? "bg-[#FFF9F0] border-[#8B5A2B] ring-2 ring-[#8B5A2B]/15"
                                  : "bg-[#FAFAFA] border-[#E5E7EB]"
                            }`}
                          >
                            <div className="flex items-center justify-center mb-1">
                              <span
                                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-black shadow-xs ${
                                  isCompleted
                                    ? "bg-[#16A34A] text-white"
                                    : isActive
                                      ? "bg-[#8B5A2B] text-white"
                                      : "bg-[#E5E7EB] text-[#4B5563]"
                                }`}
                              >
                                {isCompleted ? "✓" : "2"}
                              </span>
                            </div>
                            <span
                              className={`text-xs block font-black ${
                                isCompleted || isActive ? "text-[#1c1917]" : "text-[#737373]"
                              }`}
                            >
                              Preparación
                            </span>
                            <span
                              className={`block text-[11px] font-bold mt-0.5 ${
                                isCompleted
                                  ? "text-[#15803D]"
                                  : isActive
                                    ? "text-[#1c1917]"
                                    : "text-[#A3A3A3] text-[10px] font-medium"
                              }`}
                            >
                              {isCompleted
                                ? "✓ Empacado"
                                : isActive
                                  ? isRetiro ? "Listo para retirar" : "Listo para despacho"
                                  : "Pendiente"}
                            </span>
                          </div>
                        );
                      })()}

                      {/* Step 3: Entrega / Despacho */}
                      {(() => {
                        const isCompleted = pedido.estado === "enviado" || pedido.estado === "entregado";
                        return (
                          <div
                            className={`p-2.5 sm:p-3 rounded-2xl border-2 transition-all shadow-xs ${
                              isCompleted
                                ? "bg-[#FAFDF7] border-[#16A34A]"
                                : "bg-[#FAFAFA] border-[#E5E7EB]"
                            }`}
                          >
                            <div className="flex items-center justify-center mb-1">
                              <span
                                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-black shadow-xs ${
                                  isCompleted
                                    ? "bg-[#16A34A] text-white"
                                    : "bg-[#E5E7EB] text-[#4B5563]"
                                }`}
                              >
                                {isCompleted ? "✓" : "3"}
                              </span>
                            </div>
                            <span
                              className={`text-xs block font-black ${
                                isCompleted ? "text-[#1c1917]" : "text-[#737373]"
                              }`}
                            >
                              {isRetiro ? "Retiro en Taller" : "Envío por Encomienda"}
                            </span>
                            <span
                              className={`block text-[11px] font-bold mt-0.5 ${
                                isCompleted
                                  ? "text-[#15803D]"
                                  : "text-[#A3A3A3] text-[10px] font-medium"
                              }`}
                            >
                              {isCompleted ? (isRetiro ? "✓ Entregado" : "✓ Despachado") : "Pendiente"}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Details Breakdown (Client, Delivery, Pieces) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {/* Col 1: Cliente & Contacto */}
                    <div className="space-y-1.5 bg-surface p-3.5 rounded-2xl border border-border/50">
                      <p className="font-semibold text-chocolate flex items-center gap-1.5">
                        <span>👤</span>
                        <span>Cliente & Entrega</span>
                      </p>
                      <p className="font-semibold text-foreground text-sm">{pedido.nombre_contacto || "Cliente"}</p>
                      <p className="text-muted flex items-center gap-1">
                        <span>WhatsApp:</span>
                        <span className="text-foreground font-mono font-medium">{pedido.whatsapp_contacto}</span>
                      </p>
                      {pedido.email_contacto && (
                        <p className="text-muted truncate">
                          <span>Email:</span> <span className="text-foreground">{pedido.email_contacto}</span>
                        </p>
                      )}
                      <p className="text-muted pt-1 border-t border-border/40">
                        <span>Método: </span>
                        <strong className="text-foreground capitalize">{isRetiro ? "Retiro en Taller" : "Envío a Domicilio"}</strong>
                      </p>
                      {pedido.comprobante_url && (
                        <p className="text-emerald-700 dark:text-emerald-300 font-mono font-semibold">
                          📦 Tracking: {pedido.comprobante_url}
                        </p>
                      )}
                    </div>

                    {/* Col 2: Piezas Solicitadas */}
                    <div className="space-y-1.5 bg-surface p-3.5 rounded-2xl border border-border/50">
                      <p className="font-semibold text-chocolate flex items-center gap-1.5">
                        <span>🎨</span>
                        <span>Piezas Compradas</span>
                      </p>
                      {pedido.items_pedido && pedido.items_pedido.length > 0 ? (
                        <div className="space-y-2 divide-y divide-border/40 max-h-36 overflow-y-auto pr-1">
                          {pedido.items_pedido.map((it: any) => (
                            <div key={it.id} className="pt-1.5 first:pt-0 space-y-0.5">
                              <div className="flex justify-between items-start">
                                <p className="font-medium text-foreground">
                                  {it.productos?.nombre || "Pieza de stock"} x {it.cantidad || 1}
                                </p>
                                <span className="font-mono text-chocolate font-bold">
                                  {formatPrecio((it.precio_unitario_final || 0) * (it.cantidad || 1))}
                                </span>
                              </div>
                              {it.es_personalizado && (
                                <p className="text-terracota font-medium">
                                  · Personalizado (+15%)
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted italic">Sin detalle de items disponible.</p>
                      )}
                    </div>
                  </div>

                  {/* Contextual Action Bar */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-border/50">
                    {/* WhatsApp Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      {pedido.estado === "pendiente_pago" || pedido.estado === "reservado" ? (
                        <button
                          type="button"
                          onClick={() => openMessagePreview(pedido, "recordatorio_pago_24h")}
                          className="inline-flex items-center gap-1.5 bg-[#25D366] text-white hover:bg-[#1ebe5d] text-xs rounded-xl font-semibold px-3 py-1.5 shadow-xs transition-colors cursor-pointer"
                        >
                          <WhatsAppIcon className="h-4 w-4 fill-current" />
                          <span>Recordar Pago (WhatsApp)</span>
                        </button>
                      ) : pedido.estado === "confirmado" ? (
                        isRetiro ? (
                          <button
                            type="button"
                            onClick={() => openMessagePreview(pedido, "pedido_listo_retiro")}
                            className="inline-flex items-center gap-1.5 bg-[#25D366] text-white hover:bg-[#1ebe5d] text-xs rounded-xl font-semibold px-3 py-1.5 shadow-xs transition-colors cursor-pointer"
                          >
                            <WhatsAppIcon className="h-4 w-4 fill-current" />
                            <span>Avisar Listo para Retirar</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setDispatchModal(pedido);
                              setTrackingInput(pedido.comprobante_url || "");
                            }}
                            className="inline-flex items-center gap-1.5 bg-[#25D366] text-white hover:bg-[#1ebe5d] text-xs rounded-xl font-semibold px-3 py-1.5 shadow-xs transition-colors cursor-pointer"
                          >
                            <WhatsAppIcon className="h-4 w-4 fill-current" />
                            <span>Notificar Envío & Tracking</span>
                          </button>
                        )
                      ) : null}

                      {/* Direct WhatsApp chat */}
                      <a
                        href={`https://wa.me/${String(pedido.whatsapp_contacto || "").replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-arena/40 hover:bg-arena text-chocolate font-medium transition-colors text-xs"
                      >
                        <WhatsAppIcon className="h-4 w-4 fill-[#25D366]" />
                        <span>Chat con Cliente</span>
                      </a>
                    </div>

                    {/* State Transitions */}
                    <div className="flex flex-wrap items-center gap-2">
                      {pedido.estado === "pendiente_pago" || pedido.estado === "reservado" ? (
                        <>
                          <Button
                            onClick={() => setConfirmPayModal(pedido)}
                            className="bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-xs font-semibold min-h-9 py-1 px-3.5 shadow-xs"
                          >
                            ✅ Confirmar Pago
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setCancelModal(pedido)}
                            className="text-xs rounded-xl text-red-600 hover:bg-red-500/10 border-red-200 min-h-9 py-1 px-3"
                          >
                            ❌ Cancelar y Devolver Stock
                          </Button>
                        </>
                      ) : pedido.estado === "confirmado" ? (
                        isRetiro ? (
                          <Button
                            disabled={isPending}
                            onClick={() => handleEntregarEnTaller(pedido)}
                            className="bg-emerald-700 text-white hover:bg-emerald-800 rounded-xl text-xs font-bold min-h-9 py-1 px-3.5 shadow-xs"
                          >
                            📦 Concluir y Mover al Histórico
                          </Button>
                        ) : (
                          <Button
                            onClick={() => {
                              setDispatchModal(pedido);
                              setTrackingInput(pedido.comprobante_url || "");
                            }}
                            className="bg-emerald-700 text-white hover:bg-emerald-800 rounded-xl text-xs font-bold min-h-9 py-1 px-3.5 shadow-xs"
                          >
                            📦 Despachar y Mover al Histórico
                          </Button>
                        )
                      ) : null}

                      <Button
                        variant="outline"
                        onClick={() => setDeleteModalPedido(pedido)}
                        className="text-xs rounded-xl text-red-600 hover:bg-red-50 border-red-200 min-h-9 py-1 px-2.5"
                        title="Eliminar pedido"
                      >
                        🗑️
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Confirm Payment Pop-up Dialog */}
      {confirmPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-serif font-bold text-chocolate flex items-center gap-2">
              <span>✅</span>
              <span>Confirmar Pago de Pedido</span>
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              ¿Confirmás que recibiste la transferencia de <strong>{formatPrecio(confirmPayModal.total || 0)}</strong> de <strong>{confirmPayModal.nombre_contacto}</strong>?
            </p>
            <p className="text-[11px] text-stone-500 italic">
              El pedido pasará a estar confirmado y listo para su preparación en taller o despacho.
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
              <Button
                variant="outline"
                onClick={() => setConfirmPayModal(null)}
                className="rounded-xl text-xs min-h-9 py-1 px-3"
              >
                Cancelar
              </Button>
              <Button
                disabled={isPending}
                onClick={() => handleConfirmarPago(confirmPayModal)}
                className="bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-xs font-semibold min-h-9 py-1 px-3.5 shadow-xs"
              >
                {isPending ? "Confirmando..." : "Confirmar Pago"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel and Restore Stock Dialog */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-red-300 bg-surface p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-serif font-bold text-red-600 flex items-center gap-2">
              <span>❌</span>
              <span>Cancelar Pedido y Devolver al Stock</span>
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              ¿Estás seguro de cancelar la compra de <strong>{cancelModal.nombre_contacto}</strong>?
            </p>
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
              <p className="font-bold">✓ Las piezas se sumarán automáticamente de nuevo al stock disponible de la tienda.</p>
              <p className="text-[11px] text-stone-600">El pedido quedará archivado en el Histórico como Cancelado.</p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
              <Button
                variant="outline"
                onClick={() => setCancelModal(null)}
                className="rounded-xl text-xs min-h-9 py-1 px-3"
              >
                Volver
              </Button>
              <Button
                disabled={isPending}
                onClick={() => handleCancelarPedido(cancelModal)}
                className="bg-red-600 text-white hover:bg-red-700 rounded-xl text-xs font-semibold min-h-9 py-1 px-3.5 shadow-xs"
              >
                {isPending ? "Cancelando..." : "Confirmar Cancelación & Devolver Stock"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dispatch with Tracking Code Modal */}
      {dispatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-serif font-bold text-chocolate flex items-center gap-2">
              <span>🚚</span>
              <span>Despachar Pedido y Notificar</span>
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              Ingresá el código de seguimiento de la encomienda (Vía Cargo / Correo Argentino / Andreani) para el pedido de <strong>{dispatchModal.nombre_contacto}</strong>.
            </p>

            <div>
              <label htmlFor="tracking" className="text-xs font-semibold text-stone-900 block mb-1">
                Código de seguimiento (Tracking)
              </label>
              <Input
                id="tracking"
                value={trackingInput}
                onChange={(e) => setTrackingInput(e.target.value)}
                placeholder="Ej: 123456789AR / VC-987654"
                className="rounded-xl text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
              <Button
                variant="outline"
                onClick={() => setDispatchModal(null)}
                className="rounded-xl text-xs min-h-9 py-1 px-3"
              >
                Cancelar
              </Button>
              <Button
                disabled={isPending}
                onClick={() => handleDespacharPedido(dispatchModal)}
                className="bg-emerald-700 text-white hover:bg-emerald-800 rounded-xl text-xs font-bold min-h-9 py-1 px-3.5 shadow-xs"
              >
                {isPending ? "Despachando..." : "Despachar y Mover al Histórico"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Pop-up Modal */}
      {detailModalPedido && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-border bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-border/50 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">📦</span>
                  <h3 className="text-base font-serif font-bold text-chocolate">
                    Detalle del Pedido #{detailModalPedido.id.slice(0, 8)}
                  </h3>
                  {detailModalPedido.estado === "enviado" || detailModalPedido.estado === "entregado" ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      ✓ Entregado / Despachado
                    </span>
                  ) : detailModalPedido.estado === "cancelado" ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-200 text-stone-800 border border-stone-300">
                      ❌ Cancelado
                    </span>
                  ) : (
                    <Badge variant="muted">{detailModalPedido.estado}</Badge>
                  )}
                </div>
                <p className="text-xs text-stone-600 mt-1">
                  Registrado el {new Date(detailModalPedido.created_at).toLocaleDateString("es-AR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <button
                onClick={() => setDetailModalPedido(null)}
                className="text-stone-500 hover:text-stone-900 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Grid 2 Columns: Client & Delivery Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E5E0D8] space-y-1.5">
                <p className="font-bold text-stone-900 flex items-center gap-1.5">
                  <span>👤</span>
                  <span>Datos del Cliente</span>
                </p>
                <p className="text-sm font-bold text-stone-950">{detailModalPedido.nombre_contacto || "Cliente"}</p>
                <p className="text-stone-600 flex items-center gap-1">
                  <span>WhatsApp:</span>
                  <a
                    href={`https://wa.me/${String(detailModalPedido.whatsapp_contacto || "").replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-admin-accent hover:underline font-mono font-bold inline-flex items-center gap-1"
                  >
                    <WhatsAppIcon className="h-3.5 w-3.5 fill-[#25D366]" />
                    <span>{detailModalPedido.whatsapp_contacto}</span>
                  </a>
                </p>
                {detailModalPedido.email_contacto && (
                  <p className="text-stone-600">
                    <span>Email:</span> <span className="text-stone-900 font-medium">{detailModalPedido.email_contacto}</span>
                  </p>
                )}
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E5E0D8] space-y-1.5">
                <p className="font-bold text-stone-900 flex items-center gap-1.5">
                  <span>🚚</span>
                  <span>Método de Entrega</span>
                </p>
                <p className="text-sm font-bold text-stone-950 capitalize">{detailModalPedido.tipo_envio || "Retiro en Taller"}</p>
                {detailModalPedido.comprobante_url && (
                  <p className="text-emerald-800 font-mono font-bold">
                    📦 Tracking: {detailModalPedido.comprobante_url}
                  </p>
                )}
              </div>
            </div>

            {/* Pieces Breakdown */}
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E5E0D8] space-y-2 text-xs">
              <p className="font-bold text-stone-900 flex items-center gap-1.5">
                <span>🎨</span>
                <span>Piezas Compradas de Stock</span>
              </p>

              {detailModalPedido.items_pedido && detailModalPedido.items_pedido.length > 0 ? (
                <div className="divide-y divide-stone-200">
                  {detailModalPedido.items_pedido.map((it: any, idx: number) => (
                    <div key={idx} className="py-2.5 first:pt-0 last:pb-0 space-y-1">
                      <div className="flex justify-between items-start">
                        <p className="font-bold text-stone-950 text-xs">
                          {it.productos?.nombre || "Pieza de stock"} x {it.cantidad || 1}
                        </p>
                        <span className="font-black text-stone-900 font-serif">
                          {formatPrecio((it.precio_unitario_final || 0) * (it.cantidad || 1))}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-stone-500 italic">Sin detalle de items.</p>
              )}
            </div>

            {/* Financial Summary */}
            <div className="p-3.5 rounded-2xl bg-arena/20 border border-border/60 flex items-center justify-between text-xs">
              <div>
                <span className="text-stone-600 uppercase font-semibold text-[10px] block">Total de la Operación</span>
                <span className="text-lg font-black text-chocolate font-serif">
                  {formatPrecio(detailModalPedido.total || 0)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-stone-600 uppercase font-semibold text-[10px] block">Estado de Pago</span>
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                  detailModalPedido.estado === "confirmado" || detailModalPedido.estado === "enviado" || detailModalPedido.estado === "entregado"
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : "bg-amber-100 text-amber-900 border border-amber-300"
                }`}>
                  {detailModalPedido.estado === "confirmado" || detailModalPedido.estado === "enviado" || detailModalPedido.estado === "entregado"
                    ? "✓ 100% Cobrado"
                    : "⏳ Pendiente"}
                </span>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-border/50">
              <div className="flex items-center gap-2">
                {detailModalPedido.estado === "enviado" || detailModalPedido.estado === "entregado" ? (
                  <Button
                    onClick={() => handleReabrir(detailModalPedido, "confirmado")}
                    className="bg-chocolate text-white hover:bg-chocolate/90 text-xs rounded-xl min-h-8 py-1 px-3 shadow-xs"
                  >
                    🔄 Reabrir a Activos (Listo)
                  </Button>
                ) : detailModalPedido.estado === "cancelado" ? (
                  <Button
                    onClick={() => handleReabrir(detailModalPedido, "pendiente_pago")}
                    className="bg-chocolate text-white hover:bg-chocolate/90 text-xs rounded-xl min-h-8 py-1 px-3 shadow-xs"
                  >
                    🔄 Reabrir a Pendiente de Pago
                  </Button>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDeleteModalPedido(detailModalPedido)}
                  className="text-xs rounded-xl min-h-8 py-1 px-3 text-red-600 hover:bg-red-50 border-red-200"
                >
                  🗑️ Eliminar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setDetailModalPedido(null)}
                  className="text-xs rounded-xl min-h-8 py-1 px-3"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Single Pedido Dialog */}
      {deleteModalPedido && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-serif font-bold text-red-600 flex items-center gap-2">
              <span>🗑️</span>
              <span>Eliminar Pedido Permanentemente</span>
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              ¿Estás seguro de eliminar el registro del pedido de <strong>{deleteModalPedido.nombre_contacto}</strong>? Esta acción no se puede deshacer.
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
              <Button
                variant="outline"
                onClick={() => setDeleteModalPedido(null)}
                className="rounded-xl text-xs min-h-9 py-1 px-3"
              >
                Cancelar
              </Button>
              <Button
                disabled={isPending}
                onClick={() => handleEliminarIndividual(deleteModalPedido.id)}
                className="bg-red-600 text-white hover:bg-red-700 rounded-xl text-xs font-semibold min-h-9 py-1 px-3.5 shadow-xs"
              >
                {isPending ? "Eliminando..." : "Eliminar Definitivamente"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      {bulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-red-300 bg-surface p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-serif font-bold text-red-600 flex items-center gap-2">
              <span>🗑️</span>
              <span>Eliminación Múltiple de Pedidos</span>
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              ¿Estás seguro de que deseas eliminar permanentemente los <strong>{selectedIds.length} pedidos seleccionados</strong> del histórico? Esta acción no se puede deshacer.
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
              <Button
                variant="outline"
                onClick={() => setBulkDeleteModalOpen(false)}
                className="rounded-xl text-xs min-h-9 py-1 px-3"
              >
                Cancelar
              </Button>
              <Button
                disabled={isPending}
                onClick={handleBulkDelete}
                className="bg-red-600 text-white hover:bg-red-700 rounded-xl text-xs font-semibold min-h-9 py-1 px-3.5 shadow-xs"
              >
                {isPending ? "Eliminando..." : `Eliminar ${selectedIds.length} Pedidos`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Message Preview & Copy Modal */}
      {messageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl border border-border bg-surface p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <WhatsAppIcon className="h-5 w-5 fill-[#25D366]" />
                  <h3 className="text-base font-serif font-bold text-chocolate">{messageModal.titulo}</h3>
                </div>
                <p className="text-xs text-muted mt-0.5">
                  Para: <strong>{messageModal.pedido.nombre_contacto}</strong> ({messageModal.pedido.whatsapp_contacto})
                </p>
              </div>
              <button
                onClick={() => setMessageModal(null)}
                className="text-muted hover:text-foreground text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Message Area */}
            <div>
              <label className="text-[11px] font-semibold text-muted block mb-1">
                Texto del mensaje predeterminado:
              </label>
              <textarea
                value={messageModal.texto}
                onChange={(e) =>
                  setMessageModal((prev) => (prev ? { ...prev, texto: e.target.value } : null))
                }
                rows={10}
                className="w-full rounded-2xl border border-border/80 bg-arena/20 p-3.5 text-xs text-foreground font-sans leading-relaxed focus:outline-none focus:ring-1 focus:ring-admin-accent resize-y"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-border/40">
              <Button
                variant="outline"
                onClick={() => copyToClipboard(messageModal.texto)}
                className="rounded-xl text-xs font-semibold gap-1.5 min-h-9 py-1 px-3"
              >
                <span>{copiedFeedback ? "✅ Copiado!" : "📋 Copiar Texto"}</span>
              </Button>

              <div className="flex items-center gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setMessageModal(null)}
                  className="rounded-xl text-xs min-h-9 py-1 px-3"
                >
                  Cerrar
                </Button>
                <Button
                  onClick={() => {
                    const url = buildWhatsAppLink(
                      messageModal.pedido.whatsapp_contacto,
                      messageModal.texto,
                    );
                    window.open(url, "_blank");
                    setMessageModal(null);
                  }}
                  className="bg-[#25D366] text-white hover:bg-[#1ebe5d] rounded-xl text-xs font-semibold gap-1.5 shadow-xs min-h-9 py-1 px-3.5"
                >
                  <WhatsAppIcon className="h-4 w-4 fill-current" />
                  <span>Abrir en WhatsApp</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
