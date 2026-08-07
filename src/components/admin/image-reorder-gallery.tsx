"use client";

import { useState, useTransition } from "react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { Button } from "@/components/ui/button";
import { reorderProductoImagesAction, deleteProductoImageAction } from "@/lib/actions";
import type { ProductoImagen } from "@/types";

interface ImageReorderGalleryProps {
  productoId: string;
  imagenes: ProductoImagen[];
  onImagesChange?: (newImages: ProductoImagen[]) => void;
}

export function ImageReorderGallery({
  productoId,
  imagenes: initialImagenes,
  onImagesChange,
}: ImageReorderGalleryProps) {
  const [imagenes, setImagenes] = useState<ProductoImagen[]>(
    [...initialImagenes].sort((a, b) => a.orden - b.orden),
  );
  const [pending, startTransition] = useTransition();

  const handleSaveOrder = (newList: ProductoImagen[]) => {
    setImagenes(newList);
    if (onImagesChange) onImagesChange(newList);

    const idsInOrder = newList.map((img) => img.id);
    startTransition(async () => {
      await reorderProductoImagesAction(productoId, idsInOrder);
    });
  };

  const handleMove = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= imagenes.length) return;

    const newList = [...imagenes];
    const [moved] = newList.splice(index, 1);
    if (moved) {
      newList.splice(targetIndex, 0, moved);
      handleSaveOrder(newList);
    }
  };

  const handleMakeCover = (index: number) => {
    if (index === 0) return;
    const newList = [...imagenes];
    const [moved] = newList.splice(index, 1);
    if (moved) {
      newList.unshift(moved);
      handleSaveOrder(newList);
    }
  };

  const handleDelete = (imageId: string) => {
    const newList = imagenes.filter((img) => img.id !== imageId);
    setImagenes(newList);
    if (onImagesChange) onImagesChange(newList);

    startTransition(async () => {
      await deleteProductoImageAction(imageId, productoId);
    });
  };

  if (imagenes.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface/50 p-6 text-center text-xs text-muted">
        No hay fotos cargadas en esta pieza aún. Subí imágenes arriba para ordenarlas.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
          📸 Carrusel de Fotos (Secuencia Instagram)
        </label>
        <span className="text-[11px] text-muted">
          {imagenes.length} {imagenes.length === 1 ? "foto" : "fotos"} — La primera es la <strong>Portada</strong>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {imagenes.map((img, idx) => {
          const isCover = idx === 0;
          return (
            <div
              key={img.id}
              className={`group relative flex flex-col overflow-hidden rounded-xl border bg-surface p-1.5 transition-all ${
                isCover ? "border-foreground/50 ring-2 ring-foreground/10" : "border-border"
              }`}
            >
              {/* Badge order */}
              <div className="absolute left-3 top-3 z-10">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    isCover
                      ? "bg-foreground text-background shadow-md"
                      : "bg-surface/90 text-foreground backdrop-blur-md border border-border"
                  }`}
                >
                  {isCover ? "⭐ 1º Portada" : `#${idx + 1}`}
                </span>
              </div>

              {/* Image Container */}
              <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-border/20">
                <OptimizedImage
                  src={img.url_imagen}
                  alt={`Imagen ${idx + 1}`}
                  aspectRatio="square"
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Control Bar */}
              <div className="mt-2 flex items-center justify-between gap-1">
                <div className="flex items-center gap-1">
                  {!isCover && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleMakeCover(idx)}
                      disabled={pending}
                      title="Hacer foto de portada (1ª)"
                      className="h-7 px-2 text-[11px]"
                    >
                      ⭐
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleMove(idx, -1)}
                    disabled={idx === 0 || pending}
                    title="Mover a la izquierda"
                    className="h-7 px-1.5 text-xs"
                  >
                    ←
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleMove(idx, 1)}
                    disabled={idx === imagenes.length - 1 || pending}
                    title="Mover a la derecha"
                    className="h-7 px-1.5 text-xs"
                  >
                    →
                  </Button>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => handleDelete(img.id)}
                  disabled={pending}
                  title="Eliminar foto"
                  className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                >
                  🗑️
                </Button>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
