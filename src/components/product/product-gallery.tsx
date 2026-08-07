"use client";

import { useState } from "react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { cn } from "@/lib/utils/cn";
import type { ProductoImagen } from "@/types";

export function ProductGallery({ imagenes }: { imagenes: ProductoImagen[] }) {
  const sorted = [...imagenes].sort((a, b) => a.orden - b.orden);
  const [active, setActive] = useState(0);
  const current = sorted[active];

  if (!current) {
    return (
      <OptimizedImage
        src="https://placehold.co/800x800"
        alt="Sin imagen"
        className="w-full rounded-xl"
      />
    );
  }

  return (
    <div className="space-y-3">
      {/* Main image with fade transition and uncropped containment */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-crema-cruda to-arena/60 aspect-[4/5] sm:h-[440px] flex items-center justify-center p-4">
        <OptimizedImage
          key={current.id}
          src={current.url_imagen}
          alt="Imagen del producto"
          aspectRatio="none"
          objectFit="contain"
          className="animate-fade-in h-full w-full"
          priority
        />
      </div>
      {/* Thumbnails */}
      {sorted.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1">
          {sorted.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-200",
                i === active
                  ? "border-foreground ring-1 ring-foreground/20"
                  : "border-transparent opacity-60 hover:opacity-100",
              )}
            >
              <OptimizedImage
                src={img.url_imagen}
                alt=""
                sizes="64px"
                className="h-full w-full"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
