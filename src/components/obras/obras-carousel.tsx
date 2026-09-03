"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ImageLightbox, type LightboxImage } from "@/components/ui/image-lightbox";
import type { ObraProyecto } from "@/types";

interface ObrasCarouselProps {
  obras: ObraProyecto[];
}

const CATEGORIAS_MAP: Record<string, { label: string; emoji: string }> = {
  murales: { label: "Mural & Vidriera", emoji: "🖌️" },
  esculturas: { label: "Escultura 3D / Mascotas", emoji: "🐾" },
  gran_dimension_b2b: { label: "Gastronomía & B2B", emoji: "🍽️" },
  ilustraciones: { label: "Ilustración", emoji: "🎨" },
  miniaturas: { label: "Miniatura", emoji: "✨" },
};

export function ObrasCarousel({ obras }: ObrasCarouselProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<LightboxImage[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Estados para touch swipe en celulares
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 45;

  const nextSlide = useCallback(() => {
    if (!obras || obras.length === 0) return;
    setActiveIdx((prev) => (prev + 1) % obras.length);
  }, [obras]);

  const prevSlide = useCallback(() => {
    if (!obras || obras.length === 0) return;
    setActiveIdx((prev) => (prev - 1 + obras.length) % obras.length);
  }, [obras]);

  // Autoplay desde el inicio (cada 4.5 segundos)
  useEffect(() => {
    if (isPaused || lightboxOpen || !obras || obras.length <= 1) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 4500);

    return () => clearInterval(interval);
  }, [isPaused, lightboxOpen, obras, nextSlide]);

  if (!obras || obras.length === 0) {
    return null;
  }

  const currentObra = obras[activeIdx] ?? obras[0];
  if (!currentObra) {
    return null;
  }

  const catInfo = CATEGORIAS_MAP[currentObra.categoria] || {
    label: "Obra de Autor",
    emoji: "🌟",
  };

  const rawFotos =
    Array.isArray(currentObra.fotos) && currentObra.fotos.length > 0
      ? (currentObra.fotos.filter(Boolean) as string[])
      : ([currentObra.portada_url, "/logo-artistic.jpg"].filter(Boolean) as string[]);
  const portada = rawFotos[0] || "/logo-artistic.jpg";

  // Manejo de gestos táctiles en mobile
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0]?.clientX ?? null);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0]?.clientX ?? null);
  };

  const onTouchEnd = () => {
    if (touchStart === null || touchEnd === null) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance) {
      nextSlide();
    } else if (distance < -minSwipeDistance) {
      prevSlide();
    }
  };

  const handleOpenLightbox = (startIdx = activeIdx) => {
    const allObraImages: LightboxImage[] = obras.map((obra, idx) => {
      const raw = Array.isArray(obra.fotos) && obra.fotos.length > 0 ? obra.fotos[0] : obra.portada_url;
      const cat = CATEGORIAS_MAP[obra.categoria] || { label: "Obra de Autor", emoji: "🌟" };
      return {
        url: raw || "/logo-artistic.jpg",
        title: obra.titulo,
        subtitle: obra.subtitulo || obra.cliente_lugar || undefined,
        tag: `${cat.emoji} ${cat.label} · Proyecto ${idx + 1} de ${obras.length}`,
      };
    });

    setLightboxImages(allObraImages);
    setLightboxIndex(startIdx);
    setLightboxOpen(true);
  };

  const waText = `¡Hola Mili! Vi tu proyecto "${currentObra.titulo}" en tu web y me gustaría cotizar una propuesta similar.`;

  return (
    <div
      className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border/60 bg-surface/90 shadow-xs"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-center p-6 sm:p-8 lg:p-10">
        
        {/* ─── Columna Izquierda: Título, Descripción y Enlace ─── */}
        <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-barro font-sans flex items-center gap-1.5">
              <span className="text-terracota">🌟</span> Arte a Gran Escala & Pedidos Únicos
            </span>
            
            <h2 className="text-2xl sm:text-3xl font-medium text-chocolate font-serif leading-tight">
              Obras & Proyectos Especiales
            </h2>

            <p className="text-xs sm:text-sm text-barro font-sans leading-relaxed">
              Murales residenciales y comerciales, vidrieras pintadas a mano, esculturas tridimensionales de mascotas y producciones a medida para marcas y gastronomía.
            </p>
          </div>

          {/* Indicadores de proyecto y enlace a galería */}
          <div className="pt-2 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-sans text-muted">
                Proyecto <strong className="text-chocolate">{activeIdx + 1}</strong> de {obras.length}
              </span>
              
              {/* Puntos / Indicadores de proyecto */}
              <div className="flex gap-1.5">
                {obras.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveIdx(idx)}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      activeIdx === idx ? "w-6 bg-terracota" : "w-2 bg-border/80 hover:bg-muted"
                    }`}
                    aria-label={`Ver proyecto ${idx + 1}`}
                  />
                ))}
              </div>
            </div>

            <div className="pt-1">
              <Link
                href="/obras"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-terracota hover:text-chocolate transition-colors font-sans"
              >
                <span>Ver galería completa de todas las obras</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ─── Columna Derecha: Un Solo Contenedor Destacado con Controles SOBRE la Imagen ─── */}
        <div className="lg:col-span-7">
          <div className="relative rounded-2xl sm:rounded-3xl border border-border/60 bg-gradient-to-br from-surface to-arena/30 p-4 sm:p-6 shadow-sm transition-all flex flex-col space-y-4">
            
            {/* Imagen Principal con Click para Ampliar, Touch Swipe y Flechas */}
            <div
              onClick={() => handleOpenLightbox(activeIdx)}
              className="relative aspect-[16/10] sm:aspect-[16/9] w-full rounded-2xl overflow-hidden bg-arena/25 border border-border/40 select-none cursor-pointer group/card flex items-center justify-center p-2.5 sm:p-4"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <img
                src={portada}
                alt={currentObra.titulo}
                className="h-full w-full object-contain transition-transform duration-500 group-hover/card:scale-105 rounded-xl"
                draggable={false}
              />

              {/* Botón Flecha Anterior SOBRE la imagen */}
              {obras.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    prevSlide();
                  }}
                  aria-label="Obra anterior"
                  className="absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-black/60 hover:bg-black/85 text-white text-xl sm:text-2xl transition-all shadow-lg active:scale-95 cursor-pointer z-20 backdrop-blur-xs"
                >
                  ‹
                </button>
              )}

              {/* Botón Flecha Siguiente SOBRE la imagen */}
              {obras.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    nextSlide();
                  }}
                  aria-label="Siguiente obra"
                  className="absolute right-2.5 sm:right-3.5 top-1/2 -translate-y-1/2 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-black/60 hover:bg-black/85 text-white text-xl sm:text-2xl transition-all shadow-lg active:scale-95 cursor-pointer z-20 backdrop-blur-xs"
                >
                  ›
                </button>
              )}

              {/* Badge de fotos si hay más de 1 */}
              {rawFotos.length > 1 && (
                <span className="absolute bottom-2.5 right-2.5 rounded-full bg-black/70 text-white px-2.5 py-0.5 text-[11px] font-medium backdrop-blur-xs pointer-events-none z-10">
                  📷 {rawFotos.length} fotos
                </span>
              )}
            </div>

            {/* Info de la obra actual */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold text-terracota uppercase tracking-wider">
                <span>
                  {catInfo.emoji} {catInfo.label}
                </span>
                {currentObra.cliente_lugar && (
                  <span className="text-muted truncate max-w-[180px]">
                    📍 {currentObra.cliente_lugar}
                  </span>
                )}
              </div>

              <h3 className="text-lg sm:text-xl font-serif font-medium text-chocolate">
                {currentObra.titulo}
              </h3>

              {currentObra.subtitulo && (
                <p className="text-xs text-barro font-sans font-medium">
                  {currentObra.subtitulo}
                </p>
              )}

              {currentObra.descripcion && (
                <p className="text-xs text-muted font-sans leading-relaxed line-clamp-3">
                  {currentObra.descripcion}
                </p>
              )}
            </div>

            {/* Botón de Cotización por WhatsApp */}
            <div className="pt-2 flex items-center justify-between gap-3 border-t border-border/40">
              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_VENDOR_WHATSAPP || "5493493664420"}?text=${encodeURIComponent(waText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-terracota text-white px-5 py-2 text-xs font-semibold hover:bg-terracota/90 transition-all shadow-xs"
              >
                <span>Cotizar propuesta similar por WhatsApp</span>
                <span>↗</span>
              </a>

              {rawFotos.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleOpenLightbox(0)}
                  className="text-xs text-chocolate font-semibold hover:text-terracota transition-colors underline"
                >
                  Ver galería ({rawFotos.length})
                </button>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* ─── Lightbox Modal con Zoom ─── */}
      <ImageLightbox
        images={lightboxImages}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}
