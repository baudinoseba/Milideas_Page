"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "@/stores/toast-store";
import { actualizarDisponibilidadTiendaAction } from "@/lib/actions";
import type { ConfiguracionSitio, EstadisticasDisponibilidad } from "@/types";

interface AdminDisponibilidadControlProps {
  config: ConfiguracionSitio;
  estadisticas?: EstadisticasDisponibilidad;
  compact?: boolean;
}

export function AdminDisponibilidadControl({
  config,
  estadisticas,
  compact = false,
}: AdminDisponibilidadControlProps) {
  const [isPending, startTransition] = useTransition();

  const [stockCeramica, setStockCeramica] = useState<boolean>(
    config.stock_ceramica_abierto ?? true
  );
  const [encargosCeramica, setEncargosCeramica] = useState<boolean>(
    config.encargos_ceramica_abiertos ?? true
  );
  const [stockIlustracion, setStockIlustracion] = useState<boolean>(
    config.stock_ilustracion_abierto ?? true
  );
  const [encargosIlustracion, setEncargosIlustracion] = useState<boolean>(
    config.encargos_ilustracion_abiertos ?? true
  );

  const [cupoTotal, setCupoTotal] = useState<number>(
    config.cupo_mensual_total ?? config.cupo_mensual_ceramica ?? 50
  );
  const [autoPausarStock, setAutoPausarStock] = useState<boolean>(
    config.auto_pausar_stock_agotado ?? true
  );

  // Estados derivados
  const todoPausado =
    !stockCeramica && !encargosCeramica && !stockIlustracion && !encargosIlustracion;
  const todoAbierto =
    stockCeramica && encargosCeramica && stockIlustracion && encargosIlustracion;

  const piezasCeramicaMes = estadisticas?.piezasEncargadasMesCeramica ?? 0;
  const piezasIlustracionMes = estadisticas?.piezasEncargadasMesIlustracion ?? 0;
  const piezasTotalMes = estadisticas?.piezasEncargadasMesTotal ?? (piezasCeramicaMes + piezasIlustracionMes);
  const stockTotalCeramica = estadisticas?.stockFisicoCeramica ?? 0;
  const stockTotalIlustracion = estadisticas?.stockFisicoIlustracion ?? 0;

  const pctTotal = Math.min(100, Math.round((piezasTotalMes / (cupoTotal || 1)) * 100));

  const diasRestantes =
    estadisticas?.diasRestantesPausa ??
    (config.encargos_pausado_hasta
      ? Math.max(1, Math.ceil((new Date(config.encargos_pausado_hasta).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : 30);

  const fechaReapertura = config.encargos_pausado_hasta
    ? new Date(config.encargos_pausado_hasta).toLocaleDateString("es-AR", {
        day: "numeric",
        month: "long",
      })
    : null;

  const cupoAutoPausado =
    Boolean(config.encargos_pausado_hasta && new Date() < new Date(config.encargos_pausado_hasta)) ||
    piezasTotalMes >= cupoTotal;

  const handleGuardar = (overrides?: {
    stockCeramica?: boolean;
    encargosCeramica?: boolean;
    stockIlustracion?: boolean;
    encargosIlustracion?: boolean;
  }) => {
    const nextStockCeramica =
      overrides?.stockCeramica !== undefined ? overrides.stockCeramica : stockCeramica;
    const nextEncargosCeramica =
      overrides?.encargosCeramica !== undefined ? overrides.encargosCeramica : encargosCeramica;
    const nextStockIlustracion =
      overrides?.stockIlustracion !== undefined ? overrides.stockIlustracion : stockIlustracion;
    const nextEncargosIlustracion =
      overrides?.encargosIlustracion !== undefined ? overrides.encargosIlustracion : encargosIlustracion;

    startTransition(async () => {
      const res = await actualizarDisponibilidadTiendaAction({
        stockCeramicaAbierto: nextStockCeramica,
        encargosCeramicaAbiertos: nextEncargosCeramica,
        stockIlustracionAbierto: nextStockIlustracion,
        encargosIlustracionAbiertos: nextEncargosIlustracion,
        cupoMensualTotal: cupoTotal,
        autoPausarStockAgotado: autoPausarStock,
      });

      if (res.success) {
        if (overrides?.stockCeramica !== undefined) setStockCeramica(overrides.stockCeramica);
        if (overrides?.encargosCeramica !== undefined) setEncargosCeramica(overrides.encargosCeramica);
        if (overrides?.stockIlustracion !== undefined) setStockIlustracion(overrides.stockIlustracion);
        if (overrides?.encargosIlustracion !== undefined) setEncargosIlustracion(overrides.encargosIlustracion);
        toast.success("Disponibilidad y cupo combinado del taller guardados con éxito ✨");
      } else {
        toast.error(res.error || "No se pudo actualizar la disponibilidad.");
      }
    });
  };

  const activarModoTallerTotal = () => {
    setStockCeramica(false);
    setEncargosCeramica(false);
    setStockIlustracion(false);
    setEncargosIlustracion(false);
    handleGuardar({
      stockCeramica: false,
      encargosCeramica: false,
      stockIlustracion: false,
      encargosIlustracion: false,
    });
  };

  const activarAperturaTotal = () => {
    setStockCeramica(true);
    setEncargosCeramica(true);
    setStockIlustracion(true);
    setEncargosIlustracion(true);
    handleGuardar({
      stockCeramica: true,
      encargosCeramica: true,
      stockIlustracion: true,
      encargosIlustracion: true,
    });
  };

  return (
    <div className="rounded-3xl border border-[#E5E0D8] bg-[#FAF7F2]/90 p-4 sm:p-6 shadow-xs space-y-5">
      {/* ─── Cabecera con Estado Global y Atajos Rápidos ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E8DCCF]/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-2xs border border-[#E5E0D8]">
            <span className="text-2xl">
              {todoPausado ? "⏸️" : todoAbierto ? "🟢" : "🟡"}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-serif font-bold text-chocolate">
                Apertura y Cierre de Tienda & Cupo Mensual del Taller
              </h2>
              {todoPausado && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-900 border border-amber-500/30">
                  Modo Taller Activo
                </span>
              )}
              {todoAbierto && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-900 border border-emerald-500/30">
                  100% Operativo
                </span>
              )}
              {!todoPausado && !todoAbierto && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-400/40">
                  Apertura Selectiva
                </span>
              )}
            </div>
            <p className="text-xs text-stone-600 mt-0.5">
              Controlá el stock físico y el límite de producción unificado (Cerámica + Ilustración suman juntas al cupo mensual de ~50 piezas).
            </p>
          </div>
        </div>

        {/* Atajos Rápidos de 1 Clic */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            disabled={isPending}
            onClick={activarModoTallerTotal}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
              todoPausado
                ? "bg-amber-100 text-amber-900 border-amber-300 shadow-2xs"
                : "bg-white text-stone-700 border-[#E5E0D8] hover:bg-amber-50 hover:text-amber-900"
            }`}
          >
            ⏸️ Pausar Todo
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={activarAperturaTotal}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
              todoAbierto
                ? "bg-emerald-100 text-emerald-900 border-emerald-300 shadow-2xs"
                : "bg-white text-stone-700 border-[#E5E0D8] hover:bg-emerald-50 hover:text-emerald-900"
            }`}
          >
            ▶️ Abrir Todo
          </button>
        </div>
      </div>

      {/* ─── TARJETA PRINCIPAL: CUPO MENSUAL UNIFICADO (CERÁMICA + ILUSTRACIÓN) ─── */}
      <div className="rounded-2xl border-2 border-[#E0D3C1] bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🌿</span>
            <div>
              <h3 className="text-base font-serif font-bold text-chocolate">
                Cupo Mensual de Producción Artesanal (Combinado)
              </h3>
              <p className="text-xs text-stone-600">
                Al ser un taller de autor con una única creadora, las piezas de <strong>cerámica</strong> e <strong>ilustración</strong> se suman en un único límite mensual.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <label htmlFor="cupo-total-input" className="text-xs font-medium text-stone-700">
              Límite mensual deseado:
            </label>
            <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-300 rounded-xl px-2.5 py-1">
              <input
                id="cupo-total-input"
                type="number"
                min={1}
                max={500}
                value={cupoTotal}
                onChange={(e) => setCupoTotal(Math.max(1, Number(e.target.value) || 50))}
                className="w-14 text-center text-sm font-bold text-chocolate bg-transparent focus:outline-none"
              />
              <span className="text-xs text-stone-500 font-medium">piezas totales</span>
            </div>
          </div>
        </div>

        {/* Barra de Progreso Unificada */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-stone-800">
              Progreso de producción del mes:
            </span>
            <span className="font-serif font-bold text-chocolate text-sm">
              {piezasTotalMes} / {cupoTotal} piezas ({pctTotal}%)
            </span>
          </div>

          <div className="w-full bg-stone-100 rounded-full h-3 overflow-hidden border border-stone-200 shadow-inner">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                pctTotal >= 100
                  ? "bg-amber-500"
                  : pctTotal >= 80
                  ? "bg-amber-400"
                  : "bg-emerald-500"
              }`}
              style={{ width: `${pctTotal}%` }}
            />
          </div>

          {/* Desglose visual por disciplina */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-0.5 rounded-lg font-medium">
                🏺 Cerámica: <strong>{piezasCeramicaMes} piezas</strong>
              </span>
              <span className="text-stone-300">+</span>
              <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-900 border border-sky-200 px-2.5 py-0.5 rounded-lg font-medium">
                🎨 Ilustración: <strong>{piezasIlustracionMes} piezas</strong>
              </span>
              <span className="text-stone-300">=</span>
              <span className="font-bold text-chocolate">
                {piezasTotalMes} piezas totales
              </span>
            </div>

            {cupoAutoPausado && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-900 bg-amber-100 px-3 py-1 rounded-lg border border-amber-300 shadow-2xs">
                <span>⏸️</span>
                <span>
                  Cupo mensual alcanzado: Agenda pausada por 30 días{fechaReapertura ? ` hasta el ${fechaReapertura}` : ""}{diasRestantes ? ` (${diasRestantes} días restantes)` : ""}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ─── Cuadrícula de 2 Bloques: Interruptores Cerámica vs Ilustración ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* BLOQUE 1: CERÁMICA */}
        <div className="rounded-2xl border border-stone-200 bg-white/90 p-4 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏺</span>
              <div>
                <h3 className="text-sm font-serif font-bold text-chocolate">
                  Cerámica de Autor
                </h3>
                <p className="text-[10px] text-stone-500">
                  Piezas modeladas a mano y horneadas en taller
                </p>
              </div>
            </div>
            {estadisticas && (
              <span className="text-[11px] font-medium text-stone-600 bg-stone-100 px-2 py-0.5 rounded-lg border border-stone-200">
                Stock físico: <strong className="text-chocolate">{stockTotalCeramica}</strong> u.
              </span>
            )}
          </div>

          {/* Sub-item: Stock Cerámica */}
          <div
            className={`rounded-xl border p-3 transition-all ${
              stockCeramica
                ? "bg-emerald-50/40 border-emerald-500/25"
                : "bg-amber-50/60 border-amber-300/80"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-xs font-semibold text-stone-800">
                  Stock Físico Inmediato
                </span>
                <p className="text-[10px] text-stone-500">
                  {stockCeramica
                    ? "🟢 Habilitado: Compras directas activas"
                    : "🟡 En pausa: Solo catálogo visible con enlace a portfolio"}
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={stockCeramica}
                disabled={isPending}
                onClick={() => setStockCeramica(!stockCeramica)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  stockCeramica ? "bg-emerald-600" : "bg-stone-300"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    stockCeramica ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Sub-item: Encargos Cerámica */}
          <div
            className={`rounded-xl border p-3 transition-all ${
              encargosCeramica
                ? "bg-emerald-50/40 border-emerald-500/25"
                : "bg-amber-50/60 border-amber-300/80"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-xs font-semibold text-stone-800">
                  Agenda de Encargos Personalizados
                </span>
                <p className="text-[10px] text-stone-500">
                  {encargosCeramica && !cupoAutoPausado
                    ? "🟢 Habilitada: Tomando pedidos a medida"
                    : cupoAutoPausado
                    ? "⏸️ En pausa por cupo mensual alcanzado (30 días de producción)"
                    : "🟡 En pausa: Agenda manual en pausa"}
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={encargosCeramica}
                disabled={isPending}
                onClick={() => setEncargosCeramica(!encargosCeramica)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  encargosCeramica ? "bg-emerald-600" : "bg-stone-300"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    encargosCeramica ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* BLOQUE 2: ILUSTRACIÓN */}
        <div className="rounded-2xl border border-stone-200 bg-white/90 p-4 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎨</span>
              <div>
                <h3 className="text-sm font-serif font-bold text-chocolate">
                  Estudio de Ilustración
                </h3>
                <p className="text-[10px] text-stone-500">
                  Prints, láminas originales, cuadros y diseños
                </p>
              </div>
            </div>
            {estadisticas && (
              <span className="text-[11px] font-medium text-stone-600 bg-stone-100 px-2 py-0.5 rounded-lg border border-stone-200">
                Stock físico: <strong className="text-chocolate">{stockTotalIlustracion}</strong> u.
              </span>
            )}
          </div>

          {/* Sub-item: Stock Ilustración */}
          <div
            className={`rounded-xl border p-3 transition-all ${
              stockIlustracion
                ? "bg-emerald-50/40 border-emerald-500/25"
                : "bg-amber-50/60 border-amber-300/80"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-xs font-semibold text-stone-800">
                  Stock de Prints & Láminas
                </span>
                <p className="text-[10px] text-stone-500">
                  {stockIlustracion
                    ? "🟢 Habilitado: Compras directas activas"
                    : "🟡 En pausa: Solo catálogo visible"}
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={stockIlustracion}
                disabled={isPending}
                onClick={() => setStockIlustracion(!stockIlustracion)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  stockIlustracion ? "bg-emerald-600" : "bg-stone-300"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    stockIlustracion ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Sub-item: Encargos Ilustración */}
          <div
            className={`rounded-xl border p-3 transition-all ${
              encargosIlustracion
                ? "bg-emerald-50/40 border-emerald-500/25"
                : "bg-amber-50/60 border-amber-300/80"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-xs font-semibold text-stone-800">
                  Agenda de Ilustraciones Personalizadas
                </span>
                <p className="text-[10px] text-stone-500">
                  {encargosIlustracion && !cupoAutoPausado
                    ? "🟢 Habilitada: Tomando encargos personalizados"
                    : cupoAutoPausado
                    ? "⏸️ En pausa por cupo mensual alcanzado (30 días de producción)"
                    : "🟡 En pausa: Agenda manual en pausa"}
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={encargosIlustracion}
                disabled={isPending}
                onClick={() => setEncargosIlustracion(!encargosIlustracion)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  encargosIlustracion ? "bg-emerald-600" : "bg-stone-300"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    encargosIlustracion ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Automatizaciones Inteligentes & Regla del Último Cliente ─── */}
      <div className="rounded-2xl border border-[#E8DCCF] bg-[#FAF4ED] p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">🤖</span>
            <div>
              <h4 className="text-xs font-semibold text-chocolate">
                Automatizaciones Inteligentes del Taller
              </h4>
              <p className="text-[11px] text-stone-600">
                Evitan que sigas recibiendo pedidos cuando estás sin stock o llegaste a tu límite de producción mensual.
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none bg-white/80 px-3 py-1.5 rounded-xl border border-stone-200">
            <span className="text-xs font-medium text-stone-700">
              Pausar compras directas al agotar stock físico:
            </span>
            <input
              type="checkbox"
              checked={autoPausarStock}
              onChange={(e) => setAutoPausarStock(e.target.checked)}
              className="h-4 w-4 rounded border-stone-300 text-chocolate focus:ring-chocolate"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-[11px] text-stone-700">
          <div className="bg-white/85 rounded-xl p-3 border border-stone-200/70 space-y-1">
            <span className="font-semibold text-chocolate flex items-center gap-1">
              ✨ Regla del Último Cliente (Cupo Total):
            </span>
            <p className="text-stone-600 leading-relaxed">
              Si tu cupo conjunto es 50 y llevás 48 piezas encargadas (entre cerámica e ilustración), el próximo cliente que pida (por ejemplo 5 piezas) <strong>es aceptado en su totalidad</strong>. Una vez completado ese encargo, el sistema cierra automáticamente ambas agendas para no recibir más hasta el 1º del mes siguiente.
            </p>
          </div>

          <div className="bg-white/85 rounded-xl p-3 border border-stone-200/70 space-y-1">
            <span className="font-semibold text-chocolate flex items-center gap-1">
              📦 Auto-Reapertura de Stock:
            </span>
            <p className="text-stone-600 leading-relaxed">
              Si una sección de stock físico se agota y se pausa, en cuanto vayas a <strong>Productos</strong> y cargues nuevo inventario en piezas activas, la tienda de stock <strong>se reactiva automáticamente</strong> sin necesidad de tocar ningún interruptor.
            </p>
          </div>
        </div>
      </div>

      {/* ─── Mensaje Informativo de Plantillas Predefinidas y Enlaces ─── */}
      <div className="rounded-2xl border border-[#E8DCCF] bg-amber-50/40 p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-chocolate flex items-center gap-1.5">
            ✨ Mensajes que ven tus clientes (en primera persona con hipervínculos)
          </span>
          <span className="text-[10px] text-stone-500">Diseño amigable y cercano</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-stone-700">
          <div className="bg-white/80 rounded-xl p-2.5 border border-stone-200/70 space-y-1">
            <span className="font-semibold text-terracota">🏺 Al pausar Stock:</span>
            <p className="italic">
              &ldquo;El stock se encuentra en pausa mientras creo nuevas piezas en el taller 🏺 Te invito a conocer{" "}
              <Link href="/sobre-mi" className="text-terracota underline font-medium">mi historia</Link>, ver mi{" "}
              <Link href="/ceramica/portfolio" className="text-terracota underline font-medium">portfolio de obras</Link> y seguirme en{" "}
              <a href="https://instagram.com/milideas_arte" target="_blank" rel="noopener noreferrer" className="text-terracota underline font-medium">@milideas_arte</a> ✨&rdquo;
            </p>
          </div>
          <div className="bg-white/80 rounded-xl p-2.5 border border-stone-200/70 space-y-1">
            <span className="font-semibold text-terracota">📝 Al alcanzar Límite Mensual de Encargos:</span>
            <p className="italic">
              &ldquo;¡Llegué al límite de producción mensual! ✨ Para cuidar cada detalle y la calidad artesanal, la agenda de encargos está en pausa temporal y reabrirá el próximo mes. Te invito a ver{" "}
              <Link href="/ceramica/portfolio" className="text-terracota underline font-medium">mi portfolio</Link> y seguirme en{" "}
              <a href="https://instagram.com/milideas_arte" target="_blank" rel="noopener noreferrer" className="text-terracota underline font-medium">@milideas_arte</a> 🌿&rdquo;
            </p>
          </div>
        </div>
      </div>

      {/* ─── Botón de Guardado ─── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[#E8DCCF]/60">
        <p className="text-[11px] text-stone-500 font-sans">
          💡 Los cambios se sincronizan en tiempo real con la web de tus clientes.
        </p>

        <Button
          type="button"
          onClick={() => handleGuardar()}
          disabled={isPending}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-semibold text-xs bg-chocolate hover:bg-chocolate/90 text-white shadow-xs cursor-pointer transition-all"
        >
          {isPending ? "Guardando cambios..." : "💾 Guardar Disponibilidad y Cupos"}
        </Button>
      </div>
    </div>
  );
}
