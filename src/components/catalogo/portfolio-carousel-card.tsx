"use client";

import { useState, useEffect, useCallback } from "react";
import { ImageLightbox, type LightboxImage } from "@/components/ui/image-lightbox";
import type { PortfolioColeccion } from "@/types";

interface PortfolioCarouselCardProps {
  coleccion: PortfolioColeccion;
  rubro?: "ceramica" | "ilustraciones" | string;
}

export function PortfolioCarouselCard({ coleccion }: PortfolioCarouselCardProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Estados para touch swipe en celulares
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 35;

  // Array de fotos
  const rawFotos =
    Array.isArray(coleccion.fotos) && coleccion.fotos.length > 0
      ? (coleccion.fotos.filter(Boolean) as string[])
      : ([coleccion.portada_url].filter(Boolean) as string[]);

  const fotos = rawFotos.length > 0 ? rawFotos : ["/logo-artistic.jpg"];
  const total = fotos.length;

  const nextSlide = useCallback(() => {
    if (total <= 1) return;
    setActiveIdx((prev) => (prev + 1) % total);
  }, [total]);

  const prevSlide = useCallback(() => {
    if (total <= 1) return;
    setActiveIdx((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Autoplay cada 3.5 segundos (pausa en hover o lightbox)
  useEffect(() => {
    if (isPaused || lightboxOpen || total <= 1) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 3500);
    return () => clearInterval(interval);
  }, [isPaused, lightboxOpen, total, nextSlide]);

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

  const currentFoto = fotos[activeIdx] || fotos[0];

  const lightboxImages: LightboxImage[] = fotos.map((url, idx) => ({
    url,
    title: coleccion.nombre,
    subtitle: coleccion.descripcion || undefined,
    tag: `Colección · Foto ${idx + 1} de ${total}`,
  }));

  return (
    <div
      className="rounded-2xl sm:rounded-3xl border border-[#E5E0D8] bg-[#FAF7F2]/80 p-3.5 sm:p-4 shadow-xs space-y-2.5 transition-all flex flex-col justify-between"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Encabezado de la Colección */}
      <div className="border-b border-[#E5E0D8]/80 pb-2 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm sm:text-base font-serif font-bold text-chocolate truncate">
            ✨ {coleccion.nombre}
          </h3>
          {coleccion.descripcion && (
            <p className="text-[11px] text-stone-600 font-sans line-clamp-1 mt-0.5">
              {coleccion.descripcion}
            </p>
          )}
        </div>
        <span className="text-[10px] font-semibold text-stone-500 font-sans shrink-0 px-1.5 py-0.5 rounded-md bg-stone-200/50">
          {total} {total === 1 ? "foto" : "fotos"}
        </span>
      </div>

      {/* Contenedor del Carrusel Compacto */}
      <div
        className="relative w-full aspect-[4/3] max-h-[220px] sm:max-h-[250px] rounded-xl sm:rounded-2xl overflow-hidden bg-arena/30 border border-stone-200 shadow-2xs group select-none cursor-pointer flex items-center justify-center p-2"
        onClick={() => setLightboxOpen(true)}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <img
          src={currentFoto}
          alt={`${coleccion.nombre} foto ${activeIdx + 1}`}
          className="h-full w-full object-contain object-center transition-all duration-300 hover:scale-102 rounded-xl"
        />

        {/* Contador de Foto */}
        <div className="absolute top-2 right-2 rounded-full bg-black/60 text-white backdrop-blur-md px-2 py-0.5 text-[10px] font-mono font-semibold shadow-xs pointer-events-none">
          {activeIdx + 1} / {total}
        </div>

        {/* Flechas de Navegación Adelante / Atrás */}
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prevSlide();
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-black/60 hover:bg-black/85 text-white text-xs sm:text-sm transition-all shadow-md active:scale-95 cursor-pointer backdrop-blur-xs"
              aria-label="Foto anterior"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                nextSlide();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-black/60 hover:bg-black/85 text-white text-xs sm:text-sm transition-all shadow-md active:scale-95 cursor-pointer backdrop-blur-xs"
              aria-label="Foto siguiente"
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* Tira de Miniaturas / Circulitos Abajo */}
      {total > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-0.5 flex-wrap">
          {fotos.map((foto, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveIdx(idx);
              }}
              className={`relative h-7 w-7 sm:h-8 sm:w-8 rounded-lg overflow-hidden border-2 transition-all cursor-pointer shadow-2xs ${
                activeIdx === idx
                  ? "border-chocolate ring-1 ring-chocolate/30 scale-105"
                  : "border-stone-300 opacity-60 hover:opacity-100 hover:border-stone-400"
              }`}
              title={`Ver foto ${idx + 1}`}
            >
              <img src={foto} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox con Galería Completa Navegable */}
      <ImageLightbox
        images={lightboxImages}
        initialIndex={activeIdx}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}
