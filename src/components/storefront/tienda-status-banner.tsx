"use client";

import { useState } from "react";
import Link from "next/link";
import { useTiendaStatusStore } from "@/stores/tienda-status-store";

export function TiendaStatusBanner() {
  const [dismissed, setDismissed] = useState(false);

  const stockCeramicaAbierto = useTiendaStatusStore((s) => s.stockCeramicaAbierto);
  const encargosCeramicaAbiertos = useTiendaStatusStore((s) => s.encargosCeramicaAbiertos);
  const stockIlustracionAbierto = useTiendaStatusStore((s) => s.stockIlustracionAbierto);
  const encargosIlustracionAbiertos = useTiendaStatusStore((s) => s.encargosIlustracionAbiertos);

  const todoAbierto =
    stockCeramicaAbierto &&
    encargosCeramicaAbiertos &&
    stockIlustracionAbierto &&
    encargosIlustracionAbiertos;

  const todoPausado =
    !stockCeramicaAbierto &&
    !encargosCeramicaAbiertos &&
    !stockIlustracionAbierto &&
    !encargosIlustracionAbiertos;

  if (dismissed || todoAbierto) {
    return null;
  }

  // 1. MODO TALLER TOTAL (Todo en pausa)
  if (todoPausado) {
    return (
      <aside
        aria-label="Aviso de taller en producción"
        className="relative z-40 bg-[#FAF4ED] border-b border-[#E8DCCF] text-chocolate px-4 py-2.5 text-xs sm:text-sm transition-all animate-in fade-in slide-in-from-top-1 duration-300 shadow-2xs"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-center sm:text-left">
          <div className="flex items-center gap-2.5">
            <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-[#EFE3D3] text-sm">
              🌿
            </span>
            <div className="font-sans leading-snug">
              <span className="font-semibold text-chocolate font-serif text-sm">
                Taller en producción ✨
              </span>{" "}
              <span className="text-stone-700">
                Las compras directas y la agenda de encargos están en pausa temporal mientras creo piezas nuevas en el taller. ¡Seguime en Instagram para recibir novedades de cuándo habrá nuevo stock o más encargos disponibles!
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-end text-xs font-medium">
            <Link
              href="/ceramica/portfolio"
              className="text-terracota hover:text-chocolate font-semibold underline underline-offset-2 transition-colors"
            >
              Mi Portfolio ✦
            </Link>
            <span className="text-stone-300">·</span>
            <Link
              href="/sobre-mi"
              className="text-terracota hover:text-chocolate font-semibold underline underline-offset-2 transition-colors"
            >
              Sobre mí 🎨
            </Link>
            <span className="text-stone-300">·</span>
            <a
              href="https://instagram.com/milideas_arte"
              target="_blank"
              rel="noopener noreferrer"
              className="text-terracota hover:text-chocolate font-semibold underline underline-offset-2 transition-colors"
            >
              Instagram @milideas_arte ↗
            </a>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="ml-1 text-stone-400 hover:text-stone-700 p-1 rounded-md transition-colors"
              aria-label="Cerrar aviso temporalmente"
            >
              ✕
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // 2. PAUSA SOLO EN CERÁMICA (Stock y Encargos de cerámica cerrados, pero ilustración activa)
  if (!stockCeramicaAbierto && !encargosCeramicaAbiertos) {
    return (
      <aside
        aria-label="Aviso cerámica en producción"
        className="relative z-40 bg-[#FAF4ED] border-b border-[#E8DCCF] text-chocolate px-4 py-2 text-xs sm:text-sm transition-all animate-in fade-in duration-300 shadow-2xs"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="text-base">🏺</span>
            <span className="text-stone-700 font-sans">
              <strong className="text-chocolate font-medium">Cerámica en producción ✨</strong>{" "}
              El stock y encargos de cerámica están en pausa mientras creo piezas nuevas en el taller. ¡Revisá @milideas_arte para recibir novedades de cuándo habrá nuevo stock o reapertura de cupos!
            </span>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0 text-xs font-semibold">
            <Link
              href="/ilustracion/stock"
              className="text-terracota hover:text-chocolate underline underline-offset-2 transition-colors"
            >
              Ver Láminas e Ilustraciones →
            </Link>
            <span className="text-stone-300">·</span>
            <a
              href="https://instagram.com/milideas_arte"
              target="_blank"
              rel="noopener noreferrer"
              className="text-terracota hover:text-chocolate underline underline-offset-2 transition-colors"
            >
              @milideas_arte ↗
            </a>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="text-stone-400 hover:text-stone-700 p-1 rounded-md"
              aria-label="Cerrar aviso"
            >
              ✕
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // 3. PAUSA SOLO EN ILUSTRACIÓN (Stock y Encargos de ilustración cerrados, pero cerámica activa)
  if (!stockIlustracionAbierto && !encargosIlustracionAbiertos) {
    return (
      <aside
        aria-label="Aviso ilustración en pausa"
        className="relative z-40 bg-[#FAF4ED] border-b border-[#E8DCCF] text-chocolate px-4 py-2 text-xs sm:text-sm transition-all animate-in fade-in duration-300 shadow-2xs"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="text-base">🎨</span>
            <span className="text-stone-700 font-sans">
              <strong className="text-chocolate font-medium">Ilustración en pausa ✨</strong>{" "}
              La sección de láminas y dibujos está en pausa temporal mientras preparo nuevas obras. ¡Revisá Instagram para enterarte de cuándo habrá nuevo stock o encargos disponibles!
            </span>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0 text-xs font-semibold">
            <Link
              href="/ceramica/stock"
              className="text-terracota hover:text-chocolate underline underline-offset-2 transition-colors"
            >
              Ver Cerámica en Stock →
            </Link>
            <span className="text-stone-300">·</span>
            <a
              href="https://instagram.com/milideas_arte"
              target="_blank"
              rel="noopener noreferrer"
              className="text-terracota hover:text-chocolate underline underline-offset-2 transition-colors"
            >
              @milideas_arte ↗
            </a>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="text-stone-400 hover:text-stone-700 p-1 rounded-md"
              aria-label="Cerrar aviso"
            >
              ✕
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // 4. STOCK PAUSADO (algún stock está cerrado pero hay encargos abiertos)
  if (!stockCeramicaAbierto || !stockIlustracionAbierto) {
    const rubroPausado = !stockCeramicaAbierto && !stockIlustracionAbierto
      ? "El stock"
      : !stockCeramicaAbierto
        ? "El stock de cerámica"
        : "El stock de ilustraciones";

    return (
      <aside
        aria-label="Aviso de stock en pausa"
        className="relative z-40 bg-[#FAF7F2] border-b border-[#E8DCCF] text-chocolate px-4 py-2 text-xs sm:text-sm transition-all animate-in fade-in duration-300 shadow-2xs"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="text-base">🏺</span>
            <span className="text-stone-700 font-sans">
              <strong className="text-chocolate font-medium">{rubroPausado} en pausa ✨</strong>{" "}
              Se encuentra en pausa temporal mientras creo nuevas piezas en el taller. Te invito a conocer mi{" "}
              <Link href="/ceramica/portfolio" className="text-terracota underline underline-offset-2 font-medium">
                portfolio
              </Link>{" "}
              o seguirme en{" "}
              <a
                href="https://instagram.com/milideas_arte"
                target="_blank"
                rel="noopener noreferrer"
                className="text-terracota underline underline-offset-2 font-medium"
              >
                @milideas_arte
              </a>{" "}
              para recibir novedades de cuándo habrá nuevo stock o cuándo habrá más encargos disponibles ✨
            </span>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0 text-xs font-semibold">
            <Link
              href="/ceramica/catalogo"
              className="text-terracota hover:text-chocolate underline underline-offset-2 transition-colors"
            >
              ¡Hacé tu pedido por catálogo! →
            </Link>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="text-stone-400 hover:text-stone-700 p-1 rounded-md"
              aria-label="Cerrar aviso"
            >
              ✕
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // 5. ENCARGOS PAUSADOS (alguna agenda de encargos completa o límite mensual alcanzado)
  const rubroEncargoPausado = !encargosCeramicaAbiertos && !encargosIlustracionAbiertos
    ? "Agenda de encargos"
    : !encargosCeramicaAbiertos
      ? "Agenda de cerámica"
      : "Agenda de ilustraciones";

  const portfolioHref = !encargosCeramicaAbiertos ? "/ceramica/portfolio" : "/ilustracion/portfolio";

  return (
    <aside
      aria-label="Aviso de cupos mensuales alcanzados"
      className="relative z-40 bg-[#FAF7F2] border-b border-[#E8DCCF] text-chocolate px-4 py-2.5 text-xs sm:text-sm transition-all animate-in fade-in duration-300 shadow-2xs"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-center sm:text-left">
        <div className="flex items-center gap-2.5">
          <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-[#EFE3D3] text-sm">
            🌿
          </span>
          <span className="text-stone-700 font-sans leading-snug">
            <strong className="text-chocolate font-medium">{rubroEncargoPausado}: ¡Llegué al límite de producción mensual! ✨</strong>{" "}
            Para cuidar cada detalle y la calidad artesanal, la agenda está en pausa temporal por 30 días mientras creo piezas nuevas en el taller. Te invito a conocer{" "}
            <Link href="/sobre-mi" className="text-terracota underline font-semibold">
              mi historia
            </Link>
            , ver{" "}
            <Link href={portfolioHref} className="text-terracota underline font-semibold">
              mi portfolio de obras
            </Link>{" "}
            y seguirme en{" "}
            <a
              href="https://instagram.com/milideas_arte"
              target="_blank"
              rel="noopener noreferrer"
              className="text-terracota underline font-semibold"
            >
              @milideas_arte
            </a>{" "}
            para recibir novedades de cuándo habrá más encargos disponibles o nuevo stock 🌿
          </span>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0 text-xs font-semibold">
          <Link
            href="/ceramica/stock"
            className="text-terracota hover:text-chocolate underline underline-offset-2 transition-colors"
          >
            Ver piezas en stock disponibles →
          </Link>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="text-stone-400 hover:text-stone-700 p-1 rounded-md"
            aria-label="Cerrar aviso"
          >
            ✕
          </button>
        </div>
      </div>
    </aside>
  );
}
