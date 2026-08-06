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
        className="w-full"
      />
    );
  }

  return (
    <div className="space-y-3">
      <OptimizedImage
        src={current.url_imagen}
        alt="Imagen del producto"
        className="w-full"
        priority
      />
      {sorted.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {sorted.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-sm border",
                i === active ? "border-foreground" : "border-border",
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
