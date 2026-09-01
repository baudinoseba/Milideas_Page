"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { formatPrecio } from "@/lib/pricing";
import {
  actualizarEstadoEncargoAction,
  actualizarNotasEncargoAction,
  eliminarEncargoAction,
  eliminarEncargosMultiplesAction,
} from "@/lib/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import {
  extractBankInfo,
  buildWhatsAppLink,
  generateMensajeWhatsApp,
  getResumenPiezas,
  type TipoMensajeEncargo,
  type WhatsAppBankInfo,
} from "@/lib/utils/encargos-whatsapp";
import { toast } from "@/stores/toast-store";
import type { Encargo, EstadoEncargo, ConfiguracionSitio, ConfiguracionEncargos } from "@/types";

interface EncargoMeta {
  senaAbonada?: boolean;
  saldoAbonado?: boolean;
  entregado?: boolean;
  archivado?: boolean;
  codigoSeguimiento?: string;
  notasTexto?: string;
}

function parseEncargoMeta(rawNotas: string | null): EncargoMeta {
  if (!rawNotas) return {};
  try {
    const parsed = JSON.parse(rawNotas);
    if (typeof parsed === "object" && parsed !== null) {
      return parsed;
    }
  } catch {
    return { notasTexto: rawNotas };
  }
  return { notasTexto: rawNotas };
}

function serializeEncargoMeta(meta: EncargoMeta): string {
  return JSON.stringify(meta);
}

function isEncargoEntregado(encargo: Encargo): boolean {
  if (encargo.estado === "entregado") return true;
  const meta = parseEncargoMeta(encargo.notas_admin);
  return Boolean(meta.entregado || meta.archivado);
}

interface EncargosManagerProps {
  initialEncargos: Encargo[];
  configSitio?: ConfiguracionSitio | null;
  configEncargos?: ConfiguracionEncargos | null;
}

const estadoBadges: Record<
  EstadoEncargo,
  { label: string; variant: "default" | "success" | "warning" | "muted" | "accent"; step: number }
> = {
  pendiente: { label: "1. Pendiente", variant: "warning", step: 1 },
  aceptado: { label: "2. Espera de Seña", variant: "accent", step: 2 },
  en_proceso: { label: "3. En Proceso", variant: "default", step: 3 },
  listo: { label: "4. Listo para Entrega", variant: "success", step: 4 },
  entregado: { label: "Entregado", variant: "success", step: 5 },
  rechazado: { label: "Rechazado", variant: "muted", step: 0 },
  cancelado: { label: "Cancelado", variant: "muted", step: 0 },
};

export function EncargosManager({ initialEncargos, configSitio, configEncargos }: EncargosManagerProps) {
  const [encargos, setEncargos] = useState<Encargo[]>(initialEncargos);
  const [filtroEstado, setFiltroEstado] = useState<string>("activos");
  const [subFiltroHistorico, setSubFiltroHistorico] = useState<"todos" | "entregados" | "rechazados">("todos");
  const [busqueda, setBusqueda] = useState<string>("");
  const [filtroEntrega, setFiltroEntrega] = useState<string>("todos");
  const [isPending, startTransition] = useTransition();

  // Multi-selection state for Bulk actions in Histórico
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);

  // Detail Pop-up Modal for Historical & Completed Orders
  const [detailModalEncargo, setDetailModalEncargo] = useState<Encargo | null>(null);

  const pctSenaConfig = useMemo(() => {
    return Math.round((configEncargos?.porcentaje_sena ?? 0.2) * 100);
  }, [configEncargos]);

  const demoraDefaultConfig = useMemo(() => {
    return configEncargos?.demora_default_dias ?? 30;
  }, [configEncargos]);

  // Modals state
  const [acceptModalEncargo, setAcceptModalEncargo] = useState<Encargo | null>(null);
  const [demoraDiasInput, setDemoraDiasInput] = useState<number>(demoraDefaultConfig);

  const [messageModal, setMessageModal] = useState<{
    encargo: Encargo;
    tipo: TipoMensajeEncargo;
    titulo: string;
    texto: string;
  } | null>(null);
  const [copiedFeedback, setCopiedFeedback] = useState(false);

  const [rejectModalEncargo, setRejectModalEncargo] = useState<Encargo | null>(null);
  const [deleteModalEncargo, setDeleteModalEncargo] = useState<Encargo | null>(null);

  // Archive / Conclude Confirmation Modal
  const [archiveModalEncargo, setArchiveModalEncargo] = useState<Encargo | null>(null);
  const [unpaidWarningEncargo, setUnpaidWarningEncargo] = useState<Encargo | null>(null);

  // Notes editing state per encargo
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesInput, setNotesInput] = useState<string>("");
  const [trackingInput, setTrackingInput] = useState<string>("");

  const bankInfo: WhatsAppBankInfo = useMemo(() => extractBankInfo(configSitio), [configSitio]);

  // Counters calculation for filter badges
  const counts = useMemo(() => {
    const res = {
      activos: 0,
      pendiente: 0,
      aceptado: 0,
      en_proceso: 0,
      listo: 0,
      entregado: 0,
      rechazado: 0,
      historicoTotal: 0,
    };
    for (const e of encargos) {
      const delivered = isEncargoEntregado(e);
      if (delivered) {
        res.entregado++;
        res.historicoTotal++;
      } else if (e.estado === "rechazado" || e.estado === "cancelado") {
        res.rechazado++;
        res.historicoTotal++;
      } else if (e.estado === "pendiente") {
        res.pendiente++;
        res.activos++;
      } else if (e.estado === "aceptado") {
        res.aceptado++;
        res.activos++;
      } else if (e.estado === "en_proceso") {
        res.en_proceso++;
        res.activos++;
      } else if (e.estado === "listo") {
        res.listo++;
        res.activos++;
      }
    }
    return res;
  }, [encargos]);

  // Filtered list
  const filtrados = useMemo(() => {
    return encargos.filter((e) => {
      const delivered = isEncargoEntregado(e);
      const isRechazadoOrCancelado = e.estado === "rechazado" || e.estado === "cancelado";
      const isHistorico = delivered || isRechazadoOrCancelado;

      // Filter by main tab
      if (filtroEstado === "activos") {
        if (isHistorico) return false;
      } else if (filtroEstado === "entregado") {
        if (!isHistorico) return false;
        if (subFiltroHistorico === "entregados" && !delivered) return false;
        if (subFiltroHistorico === "rechazados" && !isRechazadoOrCancelado) return false;
      } else if (filtroEstado !== "todos") {
        if (isHistorico || e.estado !== filtroEstado) return false;
      }

      // Filter by delivery method
      if (filtroEntrega !== "todos") {
        const isEnvio =
          e.metodo_entrega?.toLowerCase().includes("envio") ||
          e.metodo_entrega?.toLowerCase().includes("domicilio") ||
          e.metodo_entrega?.toLowerCase().includes("sucursal");
        if (filtroEntrega === "envio" && !isEnvio) return false;
        if (filtroEntrega === "taller" && isEnvio) return false;
      }

      // Filter by text search
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase().trim();
        const nombre = (e.nombre_contacto || "").toLowerCase();
        const tel = (e.whatsapp_contacto || "").toLowerCase();
        const id = (e.id || "").toLowerCase();
        const prod = (e.productos?.nombre || "").toLowerCase();
        const piezas = getResumenPiezas(e).toLowerCase();
        const detalle = (e.detalle_personalizacion || "").toLowerCase();

        return (
          nombre.includes(q) ||
          tel.includes(q) ||
          id.includes(q) ||
          prod.includes(q) ||
          piezas.includes(q) ||
          detalle.includes(q)
        );
      }

      return true;
    });
  }, [encargos, filtroEstado, subFiltroHistorico, filtroEntrega, busqueda]);

  // Handler for state change
  const handleCambiarEstado = (
    encargo: Encargo,
    nuevoEstado: EstadoEncargo,
    dias?: number,
    autoOpenWhatsAppTipo?: TipoMensajeEncargo,
  ) => {
    startTransition(async () => {
      const res = await actualizarEstadoEncargoAction(encargo.id, nuevoEstado, dias);
      if (res.success) {
        // If reopening from history, clean meta.entregado and meta.archivado
        let updatedNotas = encargo.notas_admin;
        if (nuevoEstado !== "entregado") {
          const meta = parseEncargoMeta(encargo.notas_admin);
          if (meta.entregado || meta.archivado) {
            delete meta.entregado;
            delete meta.archivado;
            updatedNotas = serializeEncargoMeta(meta);
            await actualizarNotasEncargoAction(encargo.id, updatedNotas);
          }
        }

        setEncargos((prev) =>
          prev.map((item) =>
            item.id === encargo.id
              ? {
                  ...item,
                  estado: nuevoEstado,
                  demora_estimada_dias: dias ?? item.demora_estimada_dias,
                  notas_admin: updatedNotas,
                }
              : item,
          ),
        );

        if (autoOpenWhatsAppTipo) {
          const meta = parseEncargoMeta(encargo.notas_admin);
          const msg = generateMensajeWhatsApp(autoOpenWhatsAppTipo, { ...encargo, estado: nuevoEstado }, bankInfo, {
            diasDemora: dias ?? encargo.demora_estimada_dias ?? demoraDefaultConfig,
            codigoSeguimiento: meta.codigoSeguimiento,
            porcentajeSena: pctSenaConfig,
          });
          const url = buildWhatsAppLink(encargo.whatsapp_contacto, msg.texto);
          window.open(url, "_blank");
        }

        setAcceptModalEncargo(null);
        setRejectModalEncargo(null);
        setArchiveModalEncargo(null);
        setDetailModalEncargo(null);
        toast.success(`Estado actualizado: ${estadoBadges[nuevoEstado]?.label || nuevoEstado}`);
      } else {
        toast.error(res.error || "Error al actualizar estado del encargo");
      }
    });
  };

  // Handler for opening archive modal with validation
  const handleRequestArchive = (encargo: Encargo) => {
    const meta = parseEncargoMeta(encargo.notas_admin);
    if (!meta.senaAbonada || !meta.saldoAbonado) {
      setUnpaidWarningEncargo(encargo);
      return;
    }
    setArchiveModalEncargo(encargo);
  };

  // Handler for deleting single encargo
  const handleEliminarEncargo = (id: string) => {
    startTransition(async () => {
      const res = await eliminarEncargoAction(id);
      if (res.success) {
        setEncargos((prev) => prev.filter((item) => item.id !== id));
        setSelectedIds((prev) => prev.filter((itemId) => itemId !== id));
        setDeleteModalEncargo(null);
        setDetailModalEncargo(null);
        toast.success("Encargo eliminado con éxito");
      } else {
        toast.error(res.error || "Error al eliminar el encargo");
      }
    });
  };

  // Handler for bulk delete
  const handleBulkDelete = () => {
    startTransition(async () => {
      const res = await eliminarEncargosMultiplesAction(selectedIds);
      if (res.success) {
        setEncargos((prev) => prev.filter((item) => !selectedIds.includes(item.id)));
        const count = selectedIds.length;
        setSelectedIds([]);
        setBulkDeleteModalOpen(false);
        toast.success(`${count} encargos eliminados`);
      } else {
        toast.error(res.error || "Error al eliminar los encargos");
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

  // Handler for toggling deposit or balance paid
  const handleTogglePayment = (encargo: Encargo, tipo: "sena" | "saldo") => {
    startTransition(async () => {
      const meta = parseEncargoMeta(encargo.notas_admin);
      if (tipo === "sena") {
        meta.senaAbonada = !meta.senaAbonada;
      } else {
        meta.saldoAbonado = !meta.saldoAbonado;
      }

      const serialized = serializeEncargoMeta(meta);
      const res = await actualizarNotasEncargoAction(encargo.id, serialized);
      if (res.success) {
        setEncargos((prev) =>
          prev.map((item) => (item.id === encargo.id ? { ...item, notas_admin: serialized } : item)),
        );
        const msg =
          tipo === "sena"
            ? meta.senaAbonada
              ? "Seña marcada como pagada ✓"
              : "Seña desmarcada (pendiente)"
            : meta.saldoAbonado
              ? "Saldo total marcado como cobrado ✓"
              : "Saldo desmarcado (pendiente)";
        toast.success(msg);
      } else {
        toast.error(res.error || "Error al actualizar estado de pago");
      }
    });
  };

  // Handler for saving tracking code and text notes
  const handleSaveNotes = (encargo: Encargo) => {
    startTransition(async () => {
      const meta = parseEncargoMeta(encargo.notas_admin);
      meta.notasTexto = notesInput.trim();
      meta.codigoSeguimiento = trackingInput.trim();

      const serialized = serializeEncargoMeta(meta);
      const res = await actualizarNotasEncargoAction(encargo.id, serialized);
      if (res.success) {
        setEncargos((prev) =>
          prev.map((item) => (item.id === encargo.id ? { ...item, notas_admin: serialized } : item)),
        );
        setEditingNotesId(null);
        toast.success("Detalles y notas guardados con éxito");
      } else {
        toast.error(res.error || "Error al guardar notas");
      }
    });
  };

  const openNotesEditor = (encargo: Encargo) => {
    const meta = parseEncargoMeta(encargo.notas_admin);
    setNotesInput(meta.notasTexto || "");
    setTrackingInput(meta.codigoSeguimiento || "");
    setEditingNotesId(encargo.id);
  };

  // Open Message Preview Modal
  const openMessagePreview = (encargo: Encargo, tipo: TipoMensajeEncargo) => {
    const meta = parseEncargoMeta(encargo.notas_admin);
    const generated = generateMensajeWhatsApp(tipo, encargo, bankInfo, {
      diasDemora: encargo.demora_estimada_dias || demoraDefaultConfig,
      codigoSeguimiento: meta.codigoSeguimiento,
      porcentajeSena: pctSenaConfig,
    });
    setMessageModal({
      encargo,
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
      {/* Header & Settings Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📝</span>
            <h1 className="text-2xl font-serif font-medium text-chocolate">Gestión de Encargos</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/encargos/configuracion">
            <Button variant="outline" className="rounded-xl text-xs font-semibold flex items-center gap-2 min-h-9 py-1 px-3">
              <span>⚙️</span>
              <span>Configurar Tarifas y Tiempos</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setFiltroEstado("pendiente")}
          className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
            filtroEstado === "pendiente"
              ? "bg-[#FEF3C7] border-amber-600 shadow-xs ring-2 ring-amber-500"
              : "bg-[#FFFBEB] border-amber-300 hover:border-amber-500"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black tracking-wide" style={{ color: "#1c1917" }}>
              1. Pendientes
            </span>
            <span className="text-sm">⏳</span>
          </div>
          <p className="text-2xl font-black font-serif mt-1" style={{ color: "#3D2B1F" }}>
            {counts.pendiente}
          </p>
          <p className="text-[11px] font-semibold" style={{ color: "#44403c" }}>
            Aceptar o rechazar
          </p>
        </button>

        <button
          onClick={() => setFiltroEstado("aceptado")}
          className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
            filtroEstado === "aceptado"
              ? "bg-[#E0F2FE] border-sky-600 shadow-xs ring-2 ring-sky-500"
              : "bg-[#F0F9FF] border-sky-300 hover:border-sky-500"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black tracking-wide" style={{ color: "#1c1917" }}>
              2. Espera de Seña
            </span>
            <span className="text-sm">💳</span>
          </div>
          <p className="text-2xl font-black font-serif mt-1" style={{ color: "#3D2B1F" }}>
            {counts.aceptado}
          </p>
          <p className="text-[11px] font-semibold" style={{ color: "#44403c" }}>
            Esperando {pctSenaConfig}% seña
          </p>
        </button>

        <button
          onClick={() => setFiltroEstado("en_proceso")}
          className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
            filtroEstado === "en_proceso"
              ? "bg-[#EDE9FE] border-violet-600 shadow-xs ring-2 ring-violet-500"
              : "bg-[#F5F3FF] border-violet-300 hover:border-violet-500"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black tracking-wide" style={{ color: "#1c1917" }}>
              3. En Taller
            </span>
            <span className="text-sm">🎨</span>
          </div>
          <p className="text-2xl font-black font-serif mt-1" style={{ color: "#3D2B1F" }}>
            {counts.en_proceso}
          </p>
          <p className="text-[11px] font-semibold" style={{ color: "#44403c" }}>
            Producción artesanal
          </p>
        </button>

        <button
          onClick={() => setFiltroEstado("listo")}
          className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
            filtroEstado === "listo"
              ? "bg-[#D1FAE5] border-emerald-600 shadow-xs ring-2 ring-emerald-500"
              : "bg-[#ECFDF5] border-emerald-300 hover:border-emerald-500"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black tracking-wide" style={{ color: "#1c1917" }}>
              4. Listos / Saldo
            </span>
            <span className="text-sm">✨</span>
          </div>
          <p className="text-2xl font-black font-serif mt-1" style={{ color: "#3D2B1F" }}>
            {counts.listo}
          </p>
          <p className="text-[11px] font-semibold" style={{ color: "#44403c" }}>
            Saldo final & Entrega
          </p>
        </button>
      </div>

      {/* Main Filter Tabs (Unified: Rechazados is inside Histórico) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: "activos", label: "Activos en Curso", count: counts.activos },
          { id: "pendiente", label: "1. Pendientes", count: counts.pendiente },
          { id: "aceptado", label: "2. Espera de Seña", count: counts.aceptado },
          { id: "en_proceso", label: "3. En Proceso", count: counts.en_proceso },
          { id: "listo", label: "4. Listos para Entrega", count: counts.listo },
          { id: "entregado", label: "📜 Histórico", count: counts.historicoTotal },
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

      {/* Search and Sub-filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-xs">🔍</span>
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por cliente, teléfono, producto, medidas..."
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
            <option value="taller">🏪 Retiro en Taller/Local</option>
            <option value="envio">🚚 Envío a Domicilio/Sucursal</option>
          </select>
        </div>
      </div>

      {/* COMPACT & LIGHT VIEW FOR HISTÓRICO (Entregados + Rechazados) */}
      {filtroEstado === "entregado" ? (
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
                ✓ Entregados ({counts.entregado})
              </button>
              <button
                onClick={() => {
                  setSubFiltroHistorico("rechazados");
                  setSelectedIds([]);
                }}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  subFiltroHistorico === "rechazados"
                    ? "bg-stone-700 text-white shadow-xs"
                    : "bg-white text-stone-700 hover:bg-stone-100 border border-stone-200"
                }`}
              >
                ❌ Rechazados / Cancelados ({counts.rechazado})
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
              <p className="text-sm font-semibold text-stone-800">No hay encargos en esta sección del histórico</p>
              <p className="text-xs text-stone-600 mt-1">
                {subFiltroHistorico === "rechazados"
                  ? "No hay encargos rechazados o cancelados archivados."
                  : subFiltroHistorico === "entregados"
                    ? "No hay pedidos concluidos y entregados aún."
                    : "Los encargos finalizados o rechazados se archivarán aquí para mantener despejado tu taller."}
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
                    {filtrados.map((enc) => {
                      const isDelivered = isEncargoEntregado(enc);
                      const isRechazado = enc.estado === "rechazado" || enc.estado === "cancelado";
                      const isSelected = selectedIds.includes(enc.id);

                      return (
                        <tr
                          key={enc.id}
                          onClick={() => setDetailModalEncargo(enc)}
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
                              onChange={() => handleToggleSelectOne(enc.id)}
                              className="h-4 w-4 rounded border-stone-300 text-chocolate focus:ring-chocolate cursor-pointer"
                            />
                          </td>
                          <td className="py-3 px-2 whitespace-nowrap">
                            {isDelivered ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                ✓ Entregado
                              </span>
                            ) : isRechazado ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-200 text-stone-800 border border-stone-300">
                                ❌ {enc.estado === "rechazado" ? "Rechazado" : "Cancelado"}
                              </span>
                            ) : (
                              <Badge variant="muted" className="text-[10px]">
                                {enc.estado}
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-3 text-stone-600 font-medium whitespace-nowrap">
                            {new Date(enc.created_at).toLocaleDateString("es-AR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="py-3 px-3">
                            <p className="font-bold text-stone-900 leading-tight">{enc.nombre_contacto}</p>
                            <span className="text-[11px] text-stone-500 font-mono">{enc.whatsapp_contacto}</span>
                          </td>
                          <td className="py-3 px-3 font-semibold text-chocolate max-w-[200px] truncate">
                            {getResumenPiezas(enc)}
                          </td>
                          <td className="py-3 px-3 font-black text-stone-900 font-serif whitespace-nowrap text-right">
                            {formatPrecio(enc.total_estimado || 0)}
                          </td>
                          <td
                            className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="outline"
                              onClick={() => setDetailModalEncargo(enc)}
                              className="text-[11px] rounded-xl min-h-7 py-0.5 px-2 font-semibold text-chocolate hover:bg-arena/30 border-border/80"
                              title="Ver detalle completo del encargo"
                            >
                              👁️ Detalle
                            </Button>
                            {isDelivered ? (
                              <Button
                                variant="outline"
                                onClick={() => handleCambiarEstado(enc, "listo")}
                                className="text-[11px] rounded-xl min-h-7 py-0.5 px-2 font-semibold text-stone-800 hover:bg-stone-100 border-stone-300"
                                title="Reabrir y mover de nuevo al taller activo (Paso 4)"
                              >
                                🔄 Reabrir
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                onClick={() => handleCambiarEstado(enc, "pendiente")}
                                className="text-[11px] rounded-xl min-h-7 py-0.5 px-2 font-semibold text-stone-800 hover:bg-stone-100 border-stone-300"
                                title="Reabrir solicitud a Pendiente (Paso 1)"
                              >
                                🔄 Reabrir
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              onClick={() => setDeleteModalEncargo(enc)}
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
        /* STANDARD PIPELINE CARDS */
        filtrados.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#E5E0D8] bg-[#FAF7F2] p-12 text-center text-muted">
            <span className="text-4xl block mb-3">📝</span>
            <p className="text-sm font-semibold text-stone-800">No se encontraron encargos</p>
            <p className="text-xs text-stone-600 mt-1">
              {busqueda
                ? "Prueba cambiando el término de búsqueda o los filtros aplicados."
                : "No hay pedidos en esta etapa actualmente."}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {filtrados.map((enc) => {
              const badge = estadoBadges[enc.estado] ?? { label: enc.estado, variant: "muted", step: 0 };
              const meta = parseEncargoMeta(enc.notas_admin);
              const total = enc.total_estimado || 0;
              const montoSena = Math.round(total * (pctSenaConfig / 100));
              const montoSaldo = total - montoSena;
              const isEnvio =
                enc.metodo_entrega?.toLowerCase().includes("envio") ||
                enc.metodo_entrega?.toLowerCase().includes("domicilio") ||
                enc.metodo_entrega?.toLowerCase().includes("sucursal");

              const isEditingThisNote = editingNotesId === enc.id;

              return (
                <div
                  key={enc.id}
                  className="rounded-3xl border p-5 sm:p-6 shadow-xs space-y-5 transition-all border-[#E5E0D8] bg-white hover:border-admin-accent/50"
                >
                  {/* Header: ID, Badge, Date & Financial Summary */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#F0EDE8] pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-admin-accent uppercase tracking-wider font-mono">
                          #{enc.id.slice(0, 8)}
                        </span>
                        <Badge variant={badge.variant} className="font-semibold">
                          {badge.label}
                        </Badge>
                        <span className="rounded-full bg-arena/50 px-2.5 py-0.5 text-[10px] font-medium text-barro border border-border/40">
                          {isEnvio ? "🚚 Envío" : "🏪 Retiro en Local"}
                        </span>
                        <span className="text-xs text-stone-600 font-medium">
                          · {new Date(enc.created_at).toLocaleDateString("es-AR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-chocolate">
                        {enc.productos?.nombre ?? "Pieza a Medida"} ({enc.tipo_catalogo.toUpperCase()})
                      </h3>
                    </div>

                    {/* Financial Quick Cards */}
                    <div className="flex items-center gap-3 bg-arena/20 p-2.5 rounded-2xl border border-border/50 self-start sm:self-auto">
                      <div className="text-right pr-3 border-r border-border/50">
                        <span className="text-[10px] text-stone-600 uppercase font-sans block font-semibold">Total</span>
                        <span className="text-base font-black text-chocolate font-serif">{formatPrecio(total)}</span>
                      </div>
                      <div className="text-right pr-3 border-r border-border/50">
                        <span className="text-[10px] text-stone-600 uppercase font-sans block font-semibold">Seña ({pctSenaConfig}%)</span>
                        <span
                          className="text-xs font-black"
                          style={{
                            color: meta.senaAbonada ? "#15803D" : "#92400E",
                          }}
                        >
                          {formatPrecio(montoSena)} {meta.senaAbonada ? "✓" : "⏳"}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-stone-600 uppercase font-sans block font-semibold">Saldo ({100 - pctSenaConfig}%)</span>
                        <span
                          className="text-xs font-black"
                          style={{
                            color: meta.saldoAbonado ? "#15803D" : "#3D2B1F",
                          }}
                        >
                          {formatPrecio(montoSaldo)} {meta.saldoAbonado ? "✓" : "⏳"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stepper with Warm Artisanal Palette & High Contrast */}
                  <div className="bg-[#FAF7F2] rounded-2xl p-3.5 sm:p-4 border border-[#E5E0D8]">
                    <div className="flex items-center justify-between text-xs font-semibold mb-3">
                      <span className="flex items-center gap-1.5 text-chocolate font-bold">
                        <span>📝</span>
                        <span className="font-serif text-xs">Progreso del Encargo</span>
                      </span>
                      <span className="text-[11px] text-stone-700 font-semibold">
                        {enc.estado === "pendiente"
                          ? "Paso 1 de 4: Solicitud inicial"
                          : enc.estado === "aceptado"
                            ? "Paso 2 de 4: Confirmando Seña"
                            : enc.estado === "en_proceso"
                              ? "Paso 3 de 4: En Elaboración en Taller"
                              : enc.estado === "listo"
                                ? "Paso 4 de 4: Saldo final y Entrega"
                                : "Encargo cerrado"}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 sm:gap-3 text-center text-xs">
                      {/* Step 1: Solicitud */}
                      {(() => {
                        const isCompleted = badge.step > 1;
                        const isActive = badge.step === 1;
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
                              Solicitud
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
                              {isCompleted ? "✓ Recibida" : "⏳ Por revisar"}
                            </span>
                          </div>
                        );
                      })()}

                      {/* Step 2: Seña */}
                      {(() => {
                        const isCompleted = badge.step > 2 || (badge.step === 2 && Boolean(meta.senaAbonada));
                        const isActive = badge.step === 2 && !meta.senaAbonada;
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
                              Seña ({pctSenaConfig}%)
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
                                ? "✓ Cobrada"
                                : isActive
                                  ? `⏳ Espera ${pctSenaConfig}%`
                                  : "Pendiente"}
                            </span>
                          </div>
                        );
                      })()}

                      {/* Step 3: Taller */}
                      {(() => {
                        const isCompleted = badge.step > 3;
                        const isActive = badge.step === 3;
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
                                {isCompleted ? "✓" : "3"}
                              </span>
                            </div>
                            <span
                              className={`text-xs block font-black ${
                                isCompleted || isActive ? "text-[#1c1917]" : "text-[#737373]"
                              }`}
                            >
                              Taller
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
                                ? "✓ Finalizado"
                                : isActive
                                  ? `~${enc.demora_estimada_dias || demoraDefaultConfig} días`
                                  : "Pendiente"}
                            </span>
                          </div>
                        );
                      })()}

                      {/* Step 4: Saldo & Entrega */}
                      {(() => {
                        const isCompleted = badge.step === 4 && Boolean(meta.saldoAbonado);
                        const isActive = badge.step === 4 && !meta.saldoAbonado;
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
                                {isCompleted ? "✓" : "4"}
                              </span>
                            </div>
                            <span
                              className={`text-xs block font-black ${
                                isCompleted || isActive ? "text-[#1c1917]" : "text-[#737373]"
                              }`}
                            >
                              Saldo & Entrega
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
                                ? "✓ Pago Total"
                                : isActive
                                  ? "⏳ Saldo Pendiente"
                                  : "Pendiente"}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Details Breakdown (Client, Delivery, Pieces, Financial Status) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    {/* Col 1: Cliente & Contacto */}
                    <div className="space-y-1.5 bg-surface p-3.5 rounded-2xl border border-border/50">
                      <p className="font-semibold text-chocolate flex items-center gap-1.5">
                        <span>👤</span>
                        <span>Cliente & Entrega</span>
                      </p>
                      <p className="font-semibold text-foreground text-sm">{enc.nombre_contacto}</p>
                      <p className="text-muted flex items-center gap-1">
                        <span>WhatsApp:</span>
                        <span className="text-foreground font-mono font-medium">{enc.whatsapp_contacto}</span>
                      </p>
                      {enc.email_contacto && (
                        <p className="text-muted truncate">
                          <span>Email:</span> <span className="text-foreground">{enc.email_contacto}</span>
                        </p>
                      )}
                      <p className="text-muted pt-1 border-t border-border/40">
                        <span>Método: </span>
                        <strong className="text-foreground capitalize">{enc.metodo_entrega}</strong>
                      </p>
                      {meta.codigoSeguimiento && (
                        <p className="text-emerald-700 dark:text-emerald-300 font-mono font-semibold">
                          📦 Tracking: {meta.codigoSeguimiento}
                        </p>
                      )}
                    </div>

                    {/* Col 2: Piezas & Especificaciones */}
                    <div className="space-y-1.5 bg-surface p-3.5 rounded-2xl border border-border/50">
                      <p className="font-semibold text-chocolate flex items-center gap-1.5">
                        <span>🎨</span>
                        <span>Piezas Solicitadas</span>
                      </p>
                      {enc.items_encargo && enc.items_encargo.length > 0 ? (
                        <div className="space-y-2 divide-y divide-border/40 max-h-36 overflow-y-auto pr-1">
                          {enc.items_encargo.map((itemRaw) => {
                            const it = itemRaw as Record<string, unknown>;
                            return (
                              <div key={String(it.id ?? Math.random())} className="pt-1.5 first:pt-0 space-y-0.5">
                                <p className="font-medium text-foreground">
                                  {String(it.nombre_producto ?? "")} ({String(it.tipo_catalogo ?? "").toUpperCase()}) x{" "}
                                  {Number(it.cantidad ?? 1)}
                                </p>
                                {Boolean(it.medida_seleccionada) && (
                                  <p className="text-muted">· Medida: {String(it.medida_seleccionada)}</p>
                                )}
                                {Boolean(it.con_marco) && (
                                  <p className="text-emerald-700 dark:text-emerald-300 font-semibold">
                                    ✓ Marco de madera
                                  </p>
                                )}
                                {Boolean(it.es_personalizado) && (
                                  <p className="text-terracota font-medium">
                                    · Personalizado (+15%)
                                    {it.detalle_personalizacion ? `: "${String(it.detalle_personalizacion)}"` : ""}
                                  </p>
                                )}
                                <p className="text-muted font-mono">
                                  {formatPrecio(Number(it.subtotal ?? it.precio_unitario ?? 0))}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">{enc.productos?.nombre || "Pieza especial"}</p>
                          {enc.medida_seleccionada && (
                            <p className="text-muted">· Medida: {enc.medida_seleccionada}</p>
                          )}
                          {enc.con_marco && (
                            <p className="text-emerald-700 dark:text-emerald-300 font-semibold">
                              ✓ Marco de madera artesanal
                            </p>
                          )}
                          {enc.es_personalizado && (
                            <div>
                              <p className="text-terracota font-semibold">✨ Personalizado (+15%)</p>
                              {enc.detalle_personalizacion && (
                                <p className="text-muted italic bg-arena/30 p-1.5 rounded mt-1 border border-border/40">
                                  &ldquo;{enc.detalle_personalizacion}&rdquo;
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Col 3: Control de Pagos & Notas */}
                    <div className="space-y-2 bg-surface p-3.5 rounded-2xl border border-border/50 flex flex-col justify-between">
                      <div className="space-y-2">
                        <p className="font-semibold text-chocolate flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <span>💰</span>
                            <span>Control de Pagos</span>
                          </span>
                          <button
                            onClick={() => openNotesEditor(enc)}
                            className="text-[10px] text-admin-accent hover:underline cursor-pointer font-semibold"
                          >
                            ✏️ Notas
                          </button>
                        </p>

                        {/* Seña and Saldo Toggles */}
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-arena/20 border border-border/40">
                          <div>
                            <span className="text-[11px] font-semibold text-foreground block">Seña ({pctSenaConfig}%)</span>
                            <span className="text-xs font-bold text-chocolate font-serif">{formatPrecio(montoSena)}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleTogglePayment(enc, "sena")}
                            disabled={isPending}
                            className={`text-xs px-3 py-1.5 rounded-xl font-bold border transition-all shadow-xs cursor-pointer ${
                              meta.senaAbonada
                                ? "bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700"
                                : "bg-amber-500 text-white border-amber-600 hover:bg-amber-600 active:scale-95"
                            }`}
                          >
                            {meta.senaAbonada ? "✓ Cobrada" : "⏳ Marcar Cobrada"}
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-arena/20 border border-border/40">
                          <div>
                            <span className="text-[11px] font-semibold text-foreground block">Saldo ({100 - pctSenaConfig}%)</span>
                            <span className="text-xs font-bold text-chocolate font-serif">{formatPrecio(montoSaldo)}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleTogglePayment(enc, "saldo")}
                            disabled={isPending}
                            className={`text-xs px-3 py-1.5 rounded-xl font-bold border transition-all shadow-xs cursor-pointer ${
                              meta.saldoAbonado
                                ? "bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700"
                                : "bg-chocolate text-crema-cruda border-[#2E2017] hover:bg-[#2E2017] active:scale-95"
                            }`}
                          >
                            {meta.saldoAbonado ? "✓ Cobrado" : "⏳ Marcar Cobrado"}
                          </button>
                        </div>
                      </div>

                      {meta.notasTexto && (
                        <p className="text-[11px] text-stone-700 dark:text-stone-300 italic bg-arena/20 p-2 rounded-lg border border-border/30 truncate">
                          📌 {meta.notasTexto}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Inline Notes Editor when active */}
                  {isEditingThisNote && (
                    <div className="bg-arena/30 p-4 rounded-2xl border border-admin-accent/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-chocolate">
                          📝 Editar Notas Internas y Código de Seguimiento
                        </span>
                        <button
                          onClick={() => setEditingNotesId(null)}
                          className="text-xs text-muted hover:text-foreground cursor-pointer"
                        >
                          ✕ Cancelar
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-medium text-muted block mb-1">
                            Código de seguimiento de envío (Vía Cargo / Correo)
                          </label>
                          <Input
                            value={trackingInput}
                            onChange={(e) => setTrackingInput(e.target.value)}
                            placeholder="Ej: 123456789AR"
                            className="text-xs rounded-xl bg-surface"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-medium text-muted block mb-1">
                            Notas internas del taller
                          </label>
                          <Input
                            value={notesInput}
                            onChange={(e) => setNotesInput(e.target.value)}
                            placeholder="Ej: Cliente pidió esmalte verde bosque"
                            className="text-xs rounded-xl bg-surface"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setEditingNotesId(null)}
                          className="text-xs rounded-xl min-h-8 py-1 px-3"
                        >
                          Descartar
                        </Button>
                        <Button
                          disabled={isPending}
                          onClick={() => handleSaveNotes(enc)}
                          className="bg-chocolate text-crema-cruda hover:bg-chocolate/90 text-xs rounded-xl min-h-8 py-1 px-3"
                        >
                          Guardar Notas
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Contextual WhatsApp & Stage Action Bar */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-border/50">
                    {/* WhatsApp Contextual Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Stage 1 WhatsApp Button */}
                      {enc.estado === "pendiente" && (
                        <button
                          type="button"
                          onClick={() => openMessagePreview(enc, "solicitud_aceptada")}
                          className="inline-flex items-center gap-1.5 bg-[#25D366] text-white hover:bg-[#1ebe5d] text-xs rounded-xl font-semibold px-3 py-1.5 shadow-xs transition-colors cursor-pointer"
                        >
                          <WhatsAppIcon className="h-4 w-4 fill-current" />
                          <span>Notificar Aceptación & Seña {pctSenaConfig}%</span>
                        </button>
                      )}

                      {/* Stage 2 WhatsApp Buttons */}
                      {enc.estado === "aceptado" && (
                        <>
                          {!meta.senaAbonada ? (
                            <button
                              type="button"
                              onClick={() => openMessagePreview(enc, "recordatorio_sena")}
                              className="inline-flex items-center gap-1.5 bg-[#25D366] text-white hover:bg-[#1ebe5d] text-xs rounded-xl font-semibold px-3 py-1.5 shadow-xs transition-colors cursor-pointer"
                            >
                              <WhatsAppIcon className="h-4 w-4 fill-current" />
                              <span>Recordar Seña {pctSenaConfig}% ({formatPrecio(montoSena)})</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openMessagePreview(enc, "sena_confirmada")}
                              className="inline-flex items-center gap-1.5 bg-[#25D366] text-white hover:bg-[#1ebe5d] text-xs rounded-xl font-semibold px-3 py-1.5 shadow-xs transition-colors cursor-pointer"
                            >
                              <WhatsAppIcon className="h-4 w-4 fill-current" />
                              <span>Confirmar Seña Recibida</span>
                            </button>
                          )}
                        </>
                      )}

                      {/* Stage 3 WhatsApp Button */}
                      {enc.estado === "en_proceso" && (
                        <button
                          type="button"
                          onClick={() => openMessagePreview(enc, "en_proceso")}
                          className="inline-flex items-center gap-1.5 bg-[#25D366] text-white hover:bg-[#1ebe5d] text-xs rounded-xl font-semibold px-3 py-1.5 shadow-xs transition-colors cursor-pointer"
                        >
                          <WhatsAppIcon className="h-4 w-4 fill-current" />
                          <span>Avisar En Elaboración (~{enc.demora_estimada_dias || demoraDefaultConfig}d)</span>
                        </button>
                      )}

                      {/* Stage 4 WhatsApp Buttons */}
                      {enc.estado === "listo" && (
                        <>
                          {!meta.saldoAbonado ? (
                            <button
                              type="button"
                              onClick={() => openMessagePreview(enc, "saldo_pendiente")}
                              className="inline-flex items-center gap-1.5 bg-[#25D366] text-white hover:bg-[#1ebe5d] text-xs rounded-xl font-semibold px-3 py-1.5 shadow-xs transition-colors cursor-pointer"
                            >
                              <WhatsAppIcon className="h-4 w-4 fill-current" />
                              <span>Solicitar Saldo {100 - pctSenaConfig}% ({formatPrecio(montoSaldo)})</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                openMessagePreview(enc, isEnvio ? "pago_final_envio" : "pago_final_retiro")
                              }
                              className="inline-flex items-center gap-1.5 bg-[#25D366] text-white hover:bg-[#1ebe5d] text-xs rounded-xl font-semibold px-3 py-1.5 shadow-xs transition-colors cursor-pointer"
                            >
                              <WhatsAppIcon className="h-4 w-4 fill-current" />
                              <span>{isEnvio ? "Notificar Envío & Seguimiento" : "Coordinar Retiro en Local"}</span>
                            </button>
                          )}
                        </>
                      )}

                      {/* Generic Direct WhatsApp link */}
                      <a
                        href={`https://wa.me/${enc.whatsapp_contacto.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        title="Abrir chat de WhatsApp libre con el cliente"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-arena/40 hover:bg-arena text-chocolate font-medium transition-colors text-xs"
                      >
                        <WhatsAppIcon className="h-4 w-4 fill-[#25D366]" />
                        <span>Chat con Cliente</span>
                      </a>
                    </div>

                    {/* Workflow Stage Transitions */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Stage 1 Actions */}
                      {enc.estado === "pendiente" && (
                        <>
                          <Button
                            onClick={() => {
                              setAcceptModalEncargo(enc);
                              setDemoraDiasInput(enc.demora_estimada_dias || demoraDefaultConfig);
                            }}
                            className="bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-xs font-semibold min-h-9 py-1 px-3.5 shadow-xs"
                          >
                            ✅ Aceptar Encargo
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setRejectModalEncargo(enc)}
                            className="text-xs rounded-xl text-red-600 hover:bg-red-500/10 border-red-200 min-h-9 py-1 px-3"
                          >
                            ❌ Rechazar
                          </Button>
                        </>
                      )}

                      {/* Stage 2 Actions */}
                      {enc.estado === "aceptado" && (
                        <Button
                          disabled={isPending}
                          onClick={() => handleCambiarEstado(enc, "en_proceso", undefined, "en_proceso")}
                          className="bg-admin-accent text-white hover:bg-admin-accent-hover rounded-xl text-xs font-semibold min-h-9 py-1 px-3.5 shadow-xs"
                        >
                          🎨 Poner En Proceso (Paso 3)
                        </Button>
                      )}

                      {/* Stage 3 Actions */}
                      {enc.estado === "en_proceso" && (
                        <Button
                          disabled={isPending}
                          onClick={() => handleCambiarEstado(enc, "listo", undefined, "saldo_pendiente")}
                          className="bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-xs font-semibold min-h-9 py-1 px-3.5 shadow-xs"
                        >
                          ✨ Marcar Listo para Entrega (Paso 4)
                        </Button>
                      )}

                      {/* Stage 4 Actions with Validation & Confirmation Modal */}
                      {enc.estado === "listo" && (
                        <div className="flex items-center gap-2">
                          <Button
                            disabled={isPending}
                            onClick={() => handleRequestArchive(enc)}
                            className="bg-emerald-700 text-white hover:bg-emerald-800 rounded-xl text-xs font-bold min-h-9 py-1 px-3.5 shadow-xs cursor-pointer"
                            title="Concluir y archivar en el histórico para despejar el taller"
                          >
                            📦 Concluir y Mover al Histórico
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setDeleteModalEncargo(enc)}
                            className="text-xs rounded-xl text-red-600 hover:bg-red-50 border-red-200 min-h-9 py-1 px-2.5"
                            title="Eliminar encargo"
                          >
                            🗑️
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Detail Pop-up Modal (When clicking any row in Histórico) */}
      {detailModalEncargo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-border bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-border/50 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">📋</span>
                  <h3 className="text-base font-serif font-bold text-chocolate">
                    Detalle del Encargo #{detailModalEncargo.id.slice(0, 8)}
                  </h3>
                  {isEncargoEntregado(detailModalEncargo) ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      ✓ Entregado (Histórico)
                    </span>
                  ) : detailModalEncargo.estado === "rechazado" || detailModalEncargo.estado === "cancelado" ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-200 text-stone-800 border border-stone-300">
                      ❌ {detailModalEncargo.estado === "rechazado" ? "Rechazado" : "Cancelado"}
                    </span>
                  ) : (
                    <Badge variant="muted">{detailModalEncargo.estado}</Badge>
                  )}
                </div>
                <p className="text-xs text-stone-600 mt-1">
                  Registrado el {new Date(detailModalEncargo.created_at).toLocaleDateString("es-AR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <button
                onClick={() => setDetailModalEncargo(null)}
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
                <p className="text-sm font-bold text-stone-950">{detailModalEncargo.nombre_contacto}</p>
                <p className="text-stone-600 flex items-center gap-1">
                  <span>WhatsApp:</span>
                  <a
                    href={`https://wa.me/${detailModalEncargo.whatsapp_contacto.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-admin-accent hover:underline font-mono font-bold inline-flex items-center gap-1"
                  >
                    <WhatsAppIcon className="h-3.5 w-3.5 fill-[#25D366]" />
                    <span>{detailModalEncargo.whatsapp_contacto}</span>
                  </a>
                </p>
                {detailModalEncargo.email_contacto && (
                  <p className="text-stone-600">
                    <span>Email:</span> <span className="text-stone-900 font-medium">{detailModalEncargo.email_contacto}</span>
                  </p>
                )}
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E5E0D8] space-y-1.5">
                <p className="font-bold text-stone-900 flex items-center gap-1.5">
                  <span>🚚</span>
                  <span>Método de Entrega</span>
                </p>
                <p className="text-sm font-bold text-stone-950 capitalize">{detailModalEncargo.metodo_entrega}</p>
                {parseEncargoMeta(detailModalEncargo.notas_admin).codigoSeguimiento && (
                  <p className="text-emerald-800 font-mono font-bold">
                    📦 Tracking: {parseEncargoMeta(detailModalEncargo.notas_admin).codigoSeguimiento}
                  </p>
                )}
              </div>
            </div>

            {/* Pieces Breakdown */}
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E5E0D8] space-y-2 text-xs">
              <p className="font-bold text-stone-900 flex items-center gap-1.5">
                <span>🎨</span>
                <span>Desglose Completo de Piezas Solicitadas</span>
              </p>

              {detailModalEncargo.items_encargo && detailModalEncargo.items_encargo.length > 0 ? (
                <div className="divide-y divide-stone-200">
                  {detailModalEncargo.items_encargo.map((itRaw, idx) => {
                    const it = itRaw as Record<string, unknown>;
                    return (
                      <div key={idx} className="py-2.5 first:pt-0 last:pb-0 space-y-1">
                        <div className="flex justify-between items-start">
                          <p className="font-bold text-stone-950 text-xs">
                            {String(it.nombre_producto || "Pieza a medida")} ({String(it.tipo_catalogo || "").toUpperCase()}) x {Number(it.cantidad || 1)}
                          </p>
                          <span className="font-black text-stone-900 font-serif">
                            {formatPrecio(Number(it.subtotal || it.precio_unitario || 0))}
                          </span>
                        </div>
                        {Boolean(it.medida_seleccionada) && (
                          <p className="text-stone-600">· Medida: <strong className="text-stone-800">{String(it.medida_seleccionada)}</strong></p>
                        )}
                        {Boolean(it.con_marco) && (
                          <p className="text-emerald-800 font-semibold">✓ Con marco de madera artesanal</p>
                        )}
                        {Boolean(it.es_personalizado) && (
                          <div className="bg-amber-50 p-2 rounded-xl border border-amber-200 mt-1">
                            <p className="text-amber-950 font-bold">✨ Personalización requerida (+15%):</p>
                            <p className="text-stone-700 italic mt-0.5">&ldquo;{String(it.detalle_personalizacion || "")}&rdquo;</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <p className="font-bold text-stone-950">{detailModalEncargo.productos?.nombre || "Pieza especial"}</p>
                    <span className="font-black text-stone-900 font-serif">{formatPrecio(detailModalEncargo.total_estimado || 0)}</span>
                  </div>
                  {detailModalEncargo.medida_seleccionada && (
                    <p className="text-stone-600">· Medida: {detailModalEncargo.medida_seleccionada}</p>
                  )}
                  {detailModalEncargo.con_marco && (
                    <p className="text-emerald-800 font-semibold">✓ Con marco de madera artesanal</p>
                  )}
                  {detailModalEncargo.es_personalizado && (
                    <div className="bg-amber-50 p-2 rounded-xl border border-amber-200 mt-1">
                      <p className="text-amber-950 font-bold">✨ Personalización requerida (+15%):</p>
                      <p className="text-stone-700 italic mt-0.5">&ldquo;{detailModalEncargo.detalle_personalizacion}&rdquo;</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Financial Summary */}
            <div className="p-3.5 rounded-2xl bg-arena/20 border border-border/60 flex items-center justify-between text-xs">
              <div>
                <span className="text-stone-600 uppercase font-semibold text-[10px] block">Total de la Operación</span>
                <span className="text-lg font-black text-chocolate font-serif">
                  {formatPrecio(detailModalEncargo.total_estimado || 0)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-stone-600 uppercase font-semibold text-[10px] block">Estado de Pagos</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                    parseEncargoMeta(detailModalEncargo.notas_admin).senaAbonada
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : "bg-stone-200 text-stone-700"
                  }`}>
                    Seña: {parseEncargoMeta(detailModalEncargo.notas_admin).senaAbonada ? "✓ Cobrada" : "No cobrada"}
                  </span>
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                    parseEncargoMeta(detailModalEncargo.notas_admin).saldoAbonado
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : "bg-stone-200 text-stone-700"
                  }`}>
                    Saldo: {parseEncargoMeta(detailModalEncargo.notas_admin).saldoAbonado ? "✓ Cobrado" : "No cobrado"}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-border/50">
              <div className="flex items-center gap-2">
                {isEncargoEntregado(detailModalEncargo) ? (
                  <Button
                    onClick={() => handleCambiarEstado(detailModalEncargo, "listo")}
                    className="bg-chocolate text-white hover:bg-chocolate/90 text-xs rounded-xl min-h-8 py-1 px-3 shadow-xs"
                  >
                    🔄 Reabrir a Activos (Paso 4)
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleCambiarEstado(detailModalEncargo, "pendiente")}
                    className="bg-chocolate text-white hover:bg-chocolate/90 text-xs rounded-xl min-h-8 py-1 px-3 shadow-xs"
                  >
                    🔄 Reabrir a Pendiente (Paso 1)
                  </Button>
                )}

                {(detailModalEncargo.estado === "rechazado" || detailModalEncargo.estado === "cancelado") && (
                  <Button
                    variant="outline"
                    onClick={() => openMessagePreview(detailModalEncargo, "rechazado")}
                    className="text-xs rounded-xl min-h-8 py-1 px-3 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                  >
                    <WhatsAppIcon className="h-3.5 w-3.5 fill-[#25D366] mr-1" />
                    <span>WhatsApp de Rechazo</span>
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDeleteModalEncargo(detailModalEncargo)}
                  className="text-xs rounded-xl min-h-8 py-1 px-3 text-red-600 hover:bg-red-50 border-red-200"
                >
                  🗑️ Eliminar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setDetailModalEncargo(null)}
                  className="text-xs rounded-xl min-h-8 py-1 px-3"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Accept Encargo Dialog */}
      {acceptModalEncargo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-surface p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-serif font-bold text-chocolate">Aceptar Encargo Especial</h3>
                <p className="text-xs text-muted mt-0.5">
                  Confirmar solicitud de <strong>{acceptModalEncargo.nombre_contacto}</strong> y notificar seña del
                  {" "}{pctSenaConfig}%.
                </p>
              </div>
              <button
                onClick={() => setAcceptModalEncargo(null)}
                className="text-muted hover:text-foreground text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Breakdown summary */}
            <div className="p-3.5 rounded-2xl bg-arena/20 border border-border/50 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted">Pieza/s:</span>
                <span className="font-semibold text-foreground">{getResumenPiezas(acceptModalEncargo)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Total Estimado:</span>
                <span className="font-bold text-chocolate font-serif">
                  {formatPrecio(acceptModalEncargo.total_estimado)}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-border/40 font-semibold">
                <span className="text-amber-800 dark:text-amber-300">Seña del {pctSenaConfig}% a solicitar:</span>
                <span className="text-amber-800 dark:text-amber-300 font-mono font-bold">
                  {formatPrecio(Math.round(acceptModalEncargo.total_estimado * (pctSenaConfig / 100)))}
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="demora" className="text-xs font-semibold text-foreground block mb-1">
                Días hábiles de demora estimados (producción artesanal)
              </label>
              <Input
                id="demora"
                type="number"
                value={demoraDiasInput}
                onChange={(e) => setDemoraDiasInput(Math.max(1, Number(e.target.value)))}
                min={1}
                className="rounded-xl text-xs"
              />
              <p className="text-[11px] text-muted mt-1">
                El cliente recibirá este plazo estimado en el mensaje de WhatsApp.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
              <Button variant="outline" onClick={() => setAcceptModalEncargo(null)} className="rounded-xl text-xs min-h-9 py-1 px-3">
                Cancelar
              </Button>
              <Button
                disabled={isPending}
                onClick={() =>
                  handleCambiarEstado(
                    acceptModalEncargo,
                    "aceptado",
                    demoraDiasInput,
                    "solicitud_aceptada",
                  )
                }
                className="bg-[#25D366] text-white hover:bg-[#1ebe5d] rounded-xl text-xs font-semibold gap-1.5 shadow-xs min-h-9 py-1 px-3.5"
              >
                <WhatsAppIcon className="h-4 w-4 fill-current" />
                <span>{isPending ? "Aceptando..." : `Aceptar y Notificar Seña (${pctSenaConfig}%)`}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Conclude and Move to History */}
      {archiveModalEncargo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-serif font-bold text-chocolate flex items-center gap-2">
              <span>📦</span>
              <span>Concluir y Mover al Histórico</span>
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              ¿Confirmás que el encargo de <strong>{archiveModalEncargo.nombre_contacto}</strong> ya fue entregado y abonado en su totalidad?
            </p>
            <div className="p-3 rounded-2xl bg-arena/20 border border-border/50 space-y-1 text-xs">
              <p className="text-stone-700 font-semibold">Pieza(s): {getResumenPiezas(archiveModalEncargo)}</p>
              <p className="text-emerald-700 font-bold">Total Abonado: {formatPrecio(archiveModalEncargo.total_estimado || 0)} (100%)</p>
            </div>
            <p className="text-[11px] text-stone-500 italic">
              Este pedido saldrá de la vista del taller activo y quedará archivado en la pestaña Histórico.
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
              <Button
                variant="outline"
                onClick={() => setArchiveModalEncargo(null)}
                className="rounded-xl text-xs min-h-9 py-1 px-3"
              >
                Cancelar
              </Button>
              <Button
                disabled={isPending}
                onClick={() => handleCambiarEstado(archiveModalEncargo, "entregado")}
                className="bg-emerald-700 text-white hover:bg-emerald-800 rounded-xl text-xs font-bold min-h-9 py-1 px-3.5 shadow-xs"
              >
                {isPending ? "Archivando..." : "Confirmar y Mover al Histórico"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Warning Modal: Unpaid Balance before Archiving */}
      {unpaidWarningEncargo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-amber-400 bg-surface p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-serif font-bold text-amber-900 flex items-center gap-2">
              <span>⚠️</span>
              <span>Pagos Pendientes</span>
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              Para archivar el encargo de <strong>{unpaidWarningEncargo.nombre_contacto}</strong> en el histórico, debes registrar previamente el cobro total (seña y saldo).
            </p>
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs space-y-1">
              <p className="text-amber-900 font-medium">
                Estado actual:{" "}
                {parseEncargoMeta(unpaidWarningEncargo.notas_admin).senaAbonada ? "✓ Seña cobrada" : "⏳ Seña pendiente"}
                {" · "}
                {parseEncargoMeta(unpaidWarningEncargo.notas_admin).saldoAbonado ? "✓ Saldo cobrado" : "⏳ Saldo pendiente"}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
              <Button
                variant="outline"
                onClick={() => setUnpaidWarningEncargo(null)}
                className="rounded-xl text-xs min-h-9 py-1 px-3"
              >
                Entendido
              </Button>
              <Button
                onClick={() => {
                  const meta = parseEncargoMeta(unpaidWarningEncargo.notas_admin);
                  meta.senaAbonada = true;
                  meta.saldoAbonado = true;
                  const serialized = serializeEncargoMeta(meta);
                  startTransition(async () => {
                    await actualizarNotasEncargoAction(unpaidWarningEncargo.id, serialized);
                    setEncargos((prev) =>
                      prev.map((item) =>
                        item.id === unpaidWarningEncargo.id ? { ...item, notas_admin: serialized } : item,
                      ),
                    );
                    setUnpaidWarningEncargo(null);
                    setArchiveModalEncargo({ ...unpaidWarningEncargo, notas_admin: serialized });
                  });
                }}
                className="bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-xs font-semibold min-h-9 py-1 px-3.5 shadow-xs"
              >
                Marcar Todo Cobrado y Continuar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Encargo Dialog */}
      {rejectModalEncargo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-serif font-bold text-chocolate">Rechazar Encargo</h3>
            <p className="text-xs text-muted">
              ¿Estás seguro de que deseas rechazar el encargo de{" "}
              <strong>{rejectModalEncargo.nombre_contacto}</strong>? Podrás enviarle un mensaje cortés explicando la
              falta de cupo en el taller. El pedido se moverá automáticamente al Histórico.
            </p>

            <div className="flex justify-end gap-2 pt-3">
              <Button variant="outline" onClick={() => setRejectModalEncargo(null)} className="rounded-xl text-xs min-h-9 py-1 px-3">
                Cancelar
              </Button>
              <Button
                variant="outline"
                disabled={isPending}
                onClick={() => handleCambiarEstado(rejectModalEncargo, "rechazado")}
                className="text-xs rounded-xl text-red-600 hover:bg-red-500/10 min-h-9 py-1 px-3"
              >
                Rechazar sin WhatsApp
              </Button>
              <Button
                disabled={isPending}
                onClick={() => handleCambiarEstado(rejectModalEncargo, "rechazado", undefined, "rechazado")}
                className="bg-red-600 text-white hover:bg-red-700 rounded-xl text-xs font-semibold gap-1 min-h-9 py-1 px-3"
              >
                <WhatsAppIcon className="h-4 w-4 fill-current" />
                <span>Rechazar y Notificar</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Single Encargo Dialog */}
      {deleteModalEncargo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-serif font-bold text-red-600 flex items-center gap-2">
              <span>🗑️</span>
              <span>Eliminar Encargo Permanentemente</span>
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              ¿Estás seguro de que deseas eliminar el encargo de <strong>{deleteModalEncargo.nombre_contacto}</strong>? Esta acción no se puede deshacer y borrará el registro de la base de datos.
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
              <Button
                variant="outline"
                onClick={() => setDeleteModalEncargo(null)}
                className="rounded-xl text-xs min-h-9 py-1 px-3"
              >
                Cancelar
              </Button>
              <Button
                disabled={isPending}
                onClick={() => handleEliminarEncargo(deleteModalEncargo.id)}
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
              <span>Eliminación Múltiple</span>
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              ¿Estás seguro de que deseas eliminar permanentemente los <strong>{selectedIds.length} encargos seleccionados</strong> del histórico? Esta acción no se puede deshacer.
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
                {isPending ? "Eliminando..." : `Eliminar ${selectedIds.length} Encargos`}
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
                  Para: <strong>{messageModal.encargo.nombre_contacto}</strong> ({messageModal.encargo.whatsapp_contacto})
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
                      messageModal.encargo.whatsapp_contacto,
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
