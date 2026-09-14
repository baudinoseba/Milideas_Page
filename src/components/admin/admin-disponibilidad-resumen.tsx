"use client";

import Link from "next/link";
import type { ConfiguracionSitio, EstadisticasDisponibilidad } from "@/types";

interface AdminDisponibilidadResumenProps {
  config: ConfiguracionSitio;
  estadisticas?: EstadisticasDisponibilidad;
}

export function AdminDisponibilidadResumen({
  config,
  estadisticas,
}: AdminDisponibilidadResumenProps) {
  const stockCeramica = config.stock_ceramica_abierto ?? true;
  const encargosCeramica = config.encargos_ceramica_abiertos ?? true;
  const stockIlustracion = config.stock_ilustracion_abierto ?? true;
  const encargosIlustracion = config.encargos_ilustracion_abiertos ?? true;

  const todoPausado = !stockCeramica && !encargosCeramica && !stockIlustracion && !encargosIlustracion;
  const todoAbierto = stockCeramica && encargosCeramica && stockIlustracion && encargosIlustracion;

  const piezasCeramica = estadisticas?.piezasEncargadasMesCeramica ?? 0;
  const piezasIlustracion = estadisticas?.piezasEncargadasMesIlustracion ?? 0;
  const piezasTotal = estadisticas?.piezasEncargadasMesTotal ?? (piezasCeramica + piezasIlustracion);
  const cupoTotal = estadisticas?.cupoMensualTotal ?? config.cupo_mensual_total ?? config.cupo_mensual_ceramica ?? 50;

  const stockCeramicaTotal = estadisticas?.stockFisicoCeramica ?? 0;
  const stockIlustracionTotal = estadisticas?.stockFisicoIlustracion ?? 0;

  const pct = Math.min(100, Math.round((piezasTotal / (cupoTotal || 1)) * 100));

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

  const cupoAlcanzado =
    Boolean(config.encargos_pausado_hasta && new Date() < new Date(config.encargos_pausado_hasta)) ||
    piezasTotal >= cupoTotal;

  return (
    <div className="rounded-3xl border border-[#E5E0D8] bg-[#FAF7F2]/90 p-4 sm:p-5 shadow-xs transition-all hover:border-[#D9CFBF]">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Lado Izquierdo: Título y Estado Global */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xl">
              {todoPausado ? "⏸️" : todoAbierto ? "🟢" : "🟡"}
            </span>
            <h2 className="text-sm sm:text-base font-serif font-bold text-chocolate">
              Disponibilidad del Taller & Cupo Mensual
            </h2>
            {todoPausado ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-500/30">
                Modo Taller
              </span>
            ) : todoAbierto ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-900 border border-emerald-500/30">
                100% Operativo
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-400/40">
                Apertura Selectiva
              </span>
            )}
          </div>
          <p className="text-xs text-stone-600 font-sans">
            Capacidad artesanal unificada: los encargos de cerámica e ilustración suman juntos al tope mensual.
          </p>
        </div>

        {/* Lado Derecho: Botón de configuración */}
        <Link
          href="/admin/disponibilidad"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-[#E5E0D8] text-chocolate hover:bg-amber-50 hover:border-amber-300 shadow-2xs transition-all self-start md:self-center shrink-0 cursor-pointer"
        >
          <span>⏱️</span>
          <span>Gestionar Disponibilidad & Cupos →</span>
        </Link>
      </div>

      {/* Barra de Progreso del Cupo Mensual Combinado */}
      <div className="mt-4 pt-3.5 border-t border-[#E8DCCF]/70 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div className="md:col-span-7 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-stone-700 font-medium flex items-center gap-1">
              <span>Producción mensual de encargos:</span>
            </span>
            <span className="font-bold text-chocolate font-serif text-sm">
              {piezasTotal} / {cupoTotal} piezas ({pct}%)
            </span>
          </div>

          <div className="w-full bg-stone-200/80 rounded-full h-2.5 overflow-hidden shadow-inner">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                pct >= 100
                  ? "bg-amber-500"
                  : pct >= 80
                  ? "bg-amber-400"
                  : "bg-emerald-500"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>

          {cupoAlcanzado && (
            <p className="text-[11px] text-amber-800 font-medium">
              ⚠️ Cupo mensual alcanzado ({piezasTotal}/{cupoTotal} u.). La agenda se encuentra en pausa automática por 30 días{fechaReapertura ? ` hasta el ${fechaReapertura}` : ""}{diasRestantes ? ` (${diasRestantes} días restantes)` : ""}.
            </p>
          )}
        </div>

        {/* Desglose de piezas y stock */}
        <div className="md:col-span-5 flex flex-wrap items-center gap-2 md:justify-end text-xs">
          <div className="rounded-xl bg-white/80 border border-stone-200/80 px-3 py-1.5 shadow-2xs">
            <span className="text-stone-500 text-[10px] block font-medium">Encargos del mes</span>
            <span className="font-bold text-chocolate">
              🏺 {piezasCeramica} Cerámica · 🎨 {piezasIlustracion} Ilustración
            </span>
          </div>

          <div className="rounded-xl bg-white/80 border border-stone-200/80 px-3 py-1.5 shadow-2xs">
            <span className="text-stone-500 text-[10px] block font-medium">Inventario Físico</span>
            <span className="font-bold text-stone-700">
              🏺 {stockCeramicaTotal} u. · 🎨 {stockIlustracionTotal} u.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
