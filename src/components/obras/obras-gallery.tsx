"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { ImageLightbox, type LightboxImage } from "@/components/ui/image-lightbox";
import type { ObraProyecto } from "@/types";

interface ObrasGalleryProps {
  obras: ObraProyecto[];
  categoriaInicial?: string;
}

const CATEGORIAS_CONFIG: Array<{ id: string; label: string; emoji: string }> = [
  { id: "todas", label: "Todas las obras", emoji: "✨" },
  { id: "murales", label: "Murales & Vidrieras", emoji: "🖌️" },
  { id: "esculturas", label: "Esculturas 3D / Mascotas", emoji: "🐾" },
  { id: "gran_dimension_b2b", label: "Gastronomía & B2B", emoji: "🍽️" },
  { id: "ilustraciones", label: "Ilustraciones Gran Formato", emoji: "🎨" },
  { id: "miniaturas", label: "Miniaturas & Objetos", emoji: "🔎" },
];

export function ObrasGallery({ obras, categoriaInicial }: ObrasGalleryProps) {
  const [categoriaActiva, setCategoriaActiva] = useState<string>(categoriaInicial || "todas");
  const [lightboxImages, setLightboxImages] = useState<LightboxImage[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const obrasFiltradas = obras.filter((o) => {
    if (categoriaActiva === "todas") return true;
    return o.categoria === categoriaActiva;
  });

  const abrirLightbox = (obra: ObraProyecto, startIdx = 0) => {
    const rawFotos = Array.isArray(obra.fotos) && obra.fotos.length > 0
      ? obra.fotos
      : [obra.portada_url || ""].filter(Boolean);

    const catInfo = CATEGORIAS_CONFIG.find((c) => c.id === obra.categoria);

    const formatted: LightboxImage[] = rawFotos.map((url, idx) => ({
      url,
      title: obra.titulo,
      subtitle: obra.subtitulo || obra.descripcion || undefined,
      tag: `${catInfo?.label || "Obra"} ${rawFotos.length > 1 ? `(${idx + 1}/${rawFotos.length})` : ""}`,
    }));

    if (formatted.length === 0) return;

    setLightboxImages(formatted);
    setLightboxIndex(startIdx);
    setLightboxOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* ─── Filtros por Categoría: Responsive (Píldoras en Desktop, Menú Desplegable en Móviles) ─── */}
      
      {/* Vista Móvil / Pantallas Angostas: Botón "Todas" + Desplegable de Categorías */}
      <div className="flex md:hidden items-center gap-2 w-full">
        <button
          type="button"
          onClick={() => setCategoriaActiva("todas")}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold font-sans transition-all shrink-0 cursor-pointer shadow-xs",
            categoriaActiva === "todas"
              ? "bg-chocolate text-crema-cruda"
              : "bg-surface text-chocolate border border-border/70 hover:bg-secondary/40"
          )}
        >
          <span>✨</span>
          <span>Todas</span>
        </button>

        <div className="relative flex-1 min-w-0">
          <select
            value={categoriaActiva === "todas" ? "" : categoriaActiva}
            onChange={(e) => setCategoriaActiva(e.target.value || "todas")}
            className={cn(
              "w-full appearance-none rounded-full px-4 py-2 pr-8 text-xs font-semibold font-sans transition-all cursor-pointer shadow-xs truncate",
              categoriaActiva !== "todas"
                ? "bg-chocolate text-crema-cruda border-chocolate"
                : "bg-surface text-chocolate border border-border/70 hover:bg-secondary/40"
            )}
          >
            <option value="" className="bg-surface text-chocolate">
              📁 Filtrar por categoría...
            </option>
            {CATEGORIAS_CONFIG.filter((c) => c.id !== "todas").map((cat) => (
              <option key={cat.id} value={cat.id} className="bg-surface text-chocolate font-sans">
                {cat.emoji} {cat.label}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs opacity-70">
            ▼
          </span>
        </div>
      </div>

      {/* Vista Desktop / Pantallas Anchas: Píldoras completas visibles */}
      <div className="hidden md:flex flex-wrap gap-2 pb-1">
        {CATEGORIAS_CONFIG.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCategoriaActiva(cat.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold font-sans transition-all cursor-pointer shadow-xs shrink-0",
              categoriaActiva === cat.id
                ? "bg-chocolate text-crema-cruda shadow-sm"
                : "bg-surface text-chocolate border border-border/70 hover:bg-secondary/40",
            )}
          >
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* ─── Grid de Proyectos ─── */}
      {obrasFiltradas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-3xl border border-border/60 bg-arena/25 p-8 space-y-3">
          <span className="text-4xl">🖌️</span>
          <h3 className="text-lg font-medium font-serif text-chocolate">
            No hay obras cargadas en esta categoría por el momento
          </h3>
          <p className="max-w-md text-xs sm:text-sm text-barro font-sans">
            Mili está digitalizando y cargando fotos de nuevos proyectos. Podés consultarle directamente por WhatsApp sobre este tipo de trabajos.
          </p>
          <a
            href="https://wa.me/5493493668308?text=Hola%20Mili!%20Me%20gustar%C3%ADa%20consultarte%20por%20un%20proyecto%20especial%20a%20medida."
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-terracota text-white px-5 py-2 text-xs font-semibold hover:bg-terracota/90 transition-all shadow-xs"
          >
            Consultar por WhatsApp →
          </a>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {obrasFiltradas.map((obra) => {
            const catInfo = CATEGORIAS_CONFIG.find((c) => c.id === obra.categoria);
            const waText = `¡Hola Mili! Vi tu proyecto "${obra.titulo}" en tu web y me gustaría consultarte para realizar una propuesta similar.`;
            const fotos = Array.isArray(obra.fotos) && obra.fotos.length > 0
              ? obra.fotos
              : [obra.portada_url || ""].filter(Boolean);

            return (
              <div
                key={obra.id}
                className="group rounded-2xl sm:rounded-3xl border border-border/60 bg-surface p-5 shadow-xs transition-all hover:shadow-md hover:border-terracota/40 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Foto / Carrusel de fotos del proyecto */}
                  {fotos.length > 0 ? (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => abrirLightbox(obra, 0)}
                        className="group/main relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-arena/30 border border-border/40 cursor-zoom-in flex items-center justify-center p-2"
                      >
                        <img
                          src={fotos[0]}
                          alt={obra.titulo}
                          className="h-full w-full object-contain transition-transform duration-300 group-hover/main:scale-105 rounded-xl"
                        />
                        <span className="absolute bottom-2 right-2 rounded-full bg-black/60 text-white px-2.5 py-0.5 text-[10px] font-medium backdrop-blur-xs">
                          🔍 Ver {fotos.length} {fotos.length === 1 ? "foto" : "fotos"}
                        </span>
                      </button>

                      {fotos.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                          {fotos.map((fUrl, fIdx) => (
                            <button
                              key={fIdx}
                              type="button"
                              onClick={() => abrirLightbox(obra, fIdx)}
                              className="relative h-12 w-12 shrink-0 rounded-xl overflow-hidden border border-border/60 cursor-zoom-in hover:opacity-90 bg-arena/20 p-0.5 flex items-center justify-center"
                            >
                              <img src={fUrl} alt="" className="h-full w-full object-contain" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-arena/40 to-surface border border-border/40 flex flex-col items-center justify-center p-4 text-center space-y-2">
                      <span className="text-4xl">{catInfo?.emoji || "✨"}</span>
                      <span className="text-xs font-semibold text-chocolate font-serif">{obra.titulo}</span>
                      <span className="text-[10px] text-muted">Galería en preparación</span>
                    </div>
                  )}

                  {/* Header info */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-semibold text-terracota uppercase tracking-wider mb-1">
                      <span>{catInfo ? `${catInfo.emoji} ${catInfo.label}` : "Obra Especial"}</span>
                      {obra.cliente_lugar && (
                        <span className="text-muted truncate max-w-[130px]">📍 {obra.cliente_lugar}</span>
                      )}
                    </div>
                    <h3 className="text-base sm:text-lg font-serif font-medium text-chocolate group-hover:text-terracota transition-colors">
                      {obra.titulo}
                    </h3>
                  </div>

                  {obra.subtitulo && (
                    <p className="text-xs text-barro font-sans font-medium">
                      {obra.subtitulo}
                    </p>
                  )}

                  {obra.descripcion && (
                    <p className="text-xs text-muted font-sans leading-relaxed line-clamp-3">
                      {obra.descripcion}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-border/40 space-y-2">
                  <a
                    href={`https://wa.me/5493493668308?text=${encodeURIComponent(waText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-1.5 rounded-full bg-terracota text-white px-4 py-2 text-xs font-semibold shadow-xs hover:bg-terracota/90 transition-all cursor-pointer"
                  >
                    <span>Cotizar Proyecto similar</span>
                    <span>↗</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Lightbox Modal con Zoom para Obras ─── */}
      <ImageLightbox
        images={lightboxImages}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}
