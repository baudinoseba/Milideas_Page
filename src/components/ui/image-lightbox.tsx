"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils/cn";

export interface LightboxImage {
  url: string;
  alt?: string;
  title?: string;
  subtitle?: string;
  tag?: string;
}

interface ImageLightboxProps {
  images: LightboxImage[] | string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export function ImageLightbox({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
}: ImageLightboxProps) {
  const [mounted, setMounted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Normalize images array
  const normalizedImages: LightboxImage[] = images.map((img) =>
    typeof img === "string" ? { url: img } : img
  );

  const currentImage = normalizedImages[currentIndex] || normalizedImages[0];

  // Sync initialIndex when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, initialIndex]);

  // Lock body scroll when open to prevent background scrolling
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Reset zoom and pan when slide changes
  const changeSlide = useCallback(
    (newIndex: number) => {
      if (newIndex < 0) {
        setCurrentIndex(normalizedImages.length - 1);
      } else if (newIndex >= normalizedImages.length) {
        setCurrentIndex(0);
      } else {
        setCurrentIndex(newIndex);
      }
      setScale(1);
      setPosition({ x: 0, y: 0 });
    },
    [normalizedImages.length]
  );

  // Click to zoom toggle (1x -> 2x -> 3x -> 1x)
  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (scale === 1) {
      setScale(2);
    } else if (scale === 2) {
      setScale(3);
    } else {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  };

  // Keyboard navigation & Esc to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight") {
        changeSlide(currentIndex + 1);
      } else if (e.key === "ArrowLeft") {
        changeSlide(currentIndex - 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, currentIndex, changeSlide, onClose]);

  // Mouse wheel zoom inside modal
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.deltaY < 0) {
      setScale((prev) => Math.min(prev + 0.3, 3.5));
    } else {
      setScale((prev) => {
        const next = Math.max(prev - 0.3, 1);
        if (next === 1) setPosition({ x: 0, y: 0 });
        return next;
      });
    }
  };

  // Dragging logic when zoomed in
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    setPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  if (!isOpen || !currentImage || !mounted) return null;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none cursor-zoom-out"
    >
      {/* ─── Pop-up Card Centrado Elegante ─── */}
      <div
        onClick={(e) => e.stopPropagation()}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="relative max-w-lg sm:max-w-xl w-full rounded-3xl bg-surface p-4 sm:p-5 shadow-2xl space-y-3 cursor-default animate-in zoom-in-95 duration-200 border border-border/60"
      >
        {/* Botón Cerrar (Cruz Arriba a la Derecha) */}
        <button
          type="button"
          onClick={onClose}
          title="Cerrar (Esc)"
          className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 hover:bg-black text-white transition-all active:scale-95 cursor-pointer z-20 shadow-md font-bold"
        >
          ✕
        </button>

        {/* Contenedor de Imagen con Zoom y Pan */}
        <div
          onWheel={handleWheel}
          className="relative aspect-square sm:aspect-[4/3] rounded-2xl overflow-hidden bg-arena/30 flex items-center justify-center"
          style={{ cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "zoom-in" }}
        >
          <div
            onClick={handleImageClick}
            onMouseDown={handleMouseDown}
            className="relative flex items-center justify-center transition-transform duration-75 ease-out h-full w-full"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            }}
          >
            <img
              src={currentImage.url}
              alt={currentImage.alt || currentImage.title || "Imagen ampliada"}
              draggable={false}
              className="h-full w-full object-contain rounded-2xl"
            />
          </div>

          {/* Badge indicador de zoom cuando está ampliada */}
          {scale > 1 && (
            <span className="absolute bottom-2.5 left-2.5 rounded-full bg-black/75 text-white px-2.5 py-0.5 text-[11px] font-medium backdrop-blur-xs pointer-events-none z-10">
              🔍 Zoom: {Math.round(scale * 100)}% (clic para restablecer)
            </span>
          )}

          {/* Flecha Anterior (si hay múltiples fotos) */}
          {normalizedImages.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                changeSlide(currentIndex - 1);
              }}
              title="Imagen anterior (←)"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-black/60 hover:bg-black text-white text-xl transition-all shadow-md active:scale-95 cursor-pointer z-10"
            >
              ‹
            </button>
          )}

          {/* Flecha Siguiente (si hay múltiples fotos) */}
          {normalizedImages.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                changeSlide(currentIndex + 1);
              }}
              title="Siguiente imagen (→)"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-black/60 hover:bg-black text-white text-xl transition-all shadow-md active:scale-95 cursor-pointer z-10"
            >
              ›
            </button>
          )}
        </div>

        {/* Info del producto / obra abajo */}
        {(currentImage.title || currentImage.subtitle) && (
          <div className="px-1 text-center space-y-0.5">
            {currentImage.title && (
              <h4 className="text-base font-serif font-medium text-chocolate">
                {currentImage.title}
              </h4>
            )}
            {currentImage.subtitle && (
              <p className="text-xs text-muted font-sans">
                {currentImage.subtitle}
              </p>
            )}
          </div>
        )}

        {/* Miniaturas si hay múltiples fotos */}
        {normalizedImages.length > 1 && (
          <div className="flex justify-center gap-1.5 overflow-x-auto scrollbar-none pt-1">
            {normalizedImages.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => changeSlide(idx)}
                className={cn(
                  "relative h-10 w-10 shrink-0 rounded-lg overflow-hidden border-2 transition-all cursor-pointer",
                  currentIndex === idx
                    ? "border-terracota scale-105 shadow-sm"
                    : "border-transparent opacity-50 hover:opacity-100"
                )}
              >
                <img
                  src={img.url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
