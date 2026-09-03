"use client";

import { useState } from "react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { ImageLightbox, type LightboxImage } from "@/components/ui/image-lightbox";
import { cn } from "@/lib/utils/cn";
import type { ProductoImagen } from "@/types";

export function ProductGallery({
  imagenes = [],
  nombreProducto,
}: {
  imagenes?: ProductoImagen[];
  nombreProducto?: string;
}) {
  const list = Array.isArray(imagenes) ? imagenes : [];
  const sorted = [...list].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const current = sorted[active] || sorted[0];

  if (!current) {
    return (
      <OptimizedImage
        src="https://placehold.co/800x800"
        alt="Sin imagen"
        className="w-full rounded-2xl max-w-[420px] mx-auto"
      />
    );
  }

  const lightboxImages: LightboxImage[] = sorted.map((img) => ({
    url: img.url_imagen,
    title: nombreProducto || "Fotografía de Autor",
  }));

  return (
    <div className="space-y-3 max-w-[440px] mx-auto lg:max-w-none">
      {/* Main image — Proportioned container with rounded corners & click to zoom */}
      <div
        onClick={() => setLightboxOpen(true)}
        className="group relative overflow-hidden rounded-2xl sm:rounded-3xl bg-arena/20 aspect-square sm:aspect-[4/3] lg:aspect-square w-full max-h-[420px] border border-border/60 shadow-md cursor-zoom-in select-none flex items-center justify-center p-3"
      >
        <OptimizedImage
          key={current.id}
          src={current.url_imagen}
          alt="Imagen del producto"
          aspectRatio="none"
          objectFit="contain"
          className="animate-fade-in h-full w-full object-contain rounded-2xl transition-transform duration-500 group-hover:scale-[1.02]"
          priority
        />

        {/* Hover hint */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center pointer-events-none">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full bg-black/75 text-white px-3.5 py-1.5 text-xs font-medium backdrop-blur-xs flex items-center gap-1.5 shadow-lg">
            <span>🔍 Clic para ampliar</span>
          </span>
        </div>
      </div>

      {/* Thumbnails */}
      {sorted.length > 1 && (
        <div className="flex justify-center sm:justify-start gap-2.5 overflow-x-auto pb-1 scrollbar-none">
          {sorted.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-200 cursor-pointer bg-arena/20 p-1 flex items-center justify-center",
                i === active
                  ? "border-terracota ring-2 ring-terracota/20 scale-105 shadow-sm"
                  : "border-border/60 opacity-60 hover:opacity-100",
              )}
            >
              <img
                src={img.url_imagen}
                alt=""
                className="h-full w-full object-contain rounded-lg"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox / Popup con Zoom */}
      <ImageLightbox
        images={lightboxImages}
        initialIndex={active}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}
