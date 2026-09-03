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

  // Referencias para distinguir con precisión arrastre (drag/pan) vs clic/tap
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const pointerDownPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasDraggedRef = useRef<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Normalizar array de imágenes
  const normalizedImages: LightboxImage[] = images.map((img) =>
    typeof img === "string" ? { url: img } : img
  );

  const currentImage = normalizedImages[currentIndex] || normalizedImages[0];

  // Sincronizar initialIndex al abrir
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setScale(1);
      setPosition({ x: 0, y: 0 });
      hasDraggedRef.current = false;
      setIsDragging(false);
    }
  }, [isOpen, initialIndex]);

  // Bloquear scroll de la página de fondo
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Cambiar de diapositiva
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
      hasDraggedRef.current = false;
      setIsDragging(false);
    },
    [normalizedImages.length]
  );

  // Funciones directas de zoom
  const zoomIn = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setScale((prev) => Math.min(Number((prev + 0.5).toFixed(1)), 3.5));
  };

  const zoomOut = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setScale((prev) => {
      const next = Math.max(Number((prev - 0.5).toFixed(1)), 1);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const resetZoom = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setScale(1);
    setPosition({ x: 0, y: 0 });
    hasDraggedRef.current = false;
    setIsDragging(false);
  };

  // Clic/Tap para alternar zoom (solo si NO se arrastró)
  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Si hubo arrastre, ignoramos el clic para evitar que aumente o resetee el zoom por error
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false;
      return;
    }

    if (scale === 1) {
      setScale(2);
    } else if (scale === 2) {
      setScale(3);
    } else {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  };

  // Navegación con teclado
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight") {
        changeSlide(currentIndex + 1);
      } else if (e.key === "ArrowLeft") {
        changeSlide(currentIndex - 1);
      } else if (e.key === "+" || e.key === "=") {
        zoomIn();
      } else if (e.key === "-") {
        zoomOut();
      } else if (e.key === "0") {
        resetZoom();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, currentIndex, changeSlide, onClose]);

  // Zoom con rueda del ratón
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

  // Inicio de arrastre (compatible mouse y táctil con PointerEvents)
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return; // Solo clic izquierdo principal
    setIsDragging(true);
    hasDraggedRef.current = false;
    pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
    dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;

    const distance = Math.hypot(
      e.clientX - pointerDownPosRef.current.x,
      e.clientY - pointerDownPosRef.current.y
    );

    // Si se desplazó más de 5px, se considera arrastre activo
    if (distance > 5) {
      hasDraggedRef.current = true;
    }

    if (scale > 1) {
      setPosition({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setTimeout(() => {
      // hasDraggedRef se mantendrá para el onClick inmediato
    }, 50);
  };

  // Multi-touch pinch-to-zoom y paneo táctil en móviles
  const pinchStartDistRef = useRef<number>(0);
  const pinchStartScaleRef = useRef<number>(1);
  const touchStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastTapTimeRef = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    const t0 = e.touches[0];
    const t1 = e.touches[1];

    if (e.touches.length === 2 && t0 && t1) {
      // Gesto de 2 dedos (Pinch to zoom)
      e.stopPropagation();
      const dist = Math.hypot(
        t0.clientX - t1.clientX,
        t0.clientY - t1.clientY
      );
      pinchStartDistRef.current = dist;
      pinchStartScaleRef.current = scale;
      setIsDragging(false);
    } else if (e.touches.length === 1 && t0) {
      // Doble toque rápido para hacer zoom / resetear
      const now = Date.now();
      if (now - lastTapTimeRef.current < 300) {
        e.stopPropagation();
        if (scale > 1) {
          setScale(1);
          setPosition({ x: 0, y: 0 });
        } else {
          setScale(2.5);
        }
      }
      lastTapTimeRef.current = now;

      touchStartPosRef.current = {
        x: t0.clientX - position.x,
        y: t0.clientY - position.y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const t0 = e.touches[0];
    const t1 = e.touches[1];

    if (e.touches.length === 2 && pinchStartDistRef.current > 0 && t0 && t1) {
      e.preventDefault();
      e.stopPropagation();
      const dist = Math.hypot(
        t0.clientX - t1.clientX,
        t0.clientY - t1.clientY
      );
      const ratio = dist / pinchStartDistRef.current;
      const targetScale = Math.min(Math.max(pinchStartScaleRef.current * ratio, 1), 4);
      setScale(targetScale);
      if (targetScale === 1) {
        setPosition({ x: 0, y: 0 });
      }
    } else if (e.touches.length === 1 && scale > 1 && t0) {
      e.preventDefault();
      e.stopPropagation();
      setPosition({
        x: t0.clientX - touchStartPosRef.current.x,
        y: t0.clientY - touchStartPosRef.current.y,
      });
    }
  };

  const handleTouchEnd = () => {
    pinchStartDistRef.current = 0;
  };

  if (!isOpen || !currentImage || !mounted) return null;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200 select-none cursor-zoom-out"
    >
      {/* ─── Pop-up Card Centrado Elegante ─── */}
      <div
        onClick={(e) => e.stopPropagation()}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative max-w-lg sm:max-w-2xl w-full rounded-3xl bg-surface p-4 sm:p-5 shadow-2xl space-y-3 cursor-default animate-in zoom-in-95 duration-200 border border-border/60"
      >
        {/* Barra Superior con Controles de Zoom y Cerrar */}
        <div className="flex items-center justify-between pb-1 border-b border-border/40">
          {/* Controles de Zoom Accesibles */}
          <div className="flex items-center gap-1.5 bg-arena/40 rounded-full px-2.5 py-1 border border-border/60">
            <button
              type="button"
              onClick={zoomOut}
              disabled={scale <= 1}
              title="Alejar (-)"
              className="flex h-6 w-6 items-center justify-center rounded-full bg-surface hover:bg-stone-200 text-chocolate font-bold text-xs disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              −
            </button>
            <span className="text-[11px] font-mono font-semibold text-chocolate min-w-[42px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              onClick={zoomIn}
              disabled={scale >= 3.5}
              title="Acercar (+)"
              className="flex h-6 w-6 items-center justify-center rounded-full bg-surface hover:bg-stone-200 text-chocolate font-bold text-xs disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              +
            </button>
            {scale > 1 && (
              <button
                type="button"
                onClick={resetZoom}
                title="Restablecer (0)"
                className="ml-1 text-[10px] font-semibold text-terracota hover:underline cursor-pointer px-1"
              >
                ⟲ Restablecer
              </button>
            )}
          </div>

          {/* Botón Cerrar */}
          <button
            type="button"
            onClick={onClose}
            title="Cerrar (Esc)"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 hover:bg-black text-white transition-all active:scale-95 cursor-pointer shadow-md font-bold text-xs"
          >
            ✕
          </button>
        </div>

        {/* Contenedor de Imagen con Zoom y Pan */}
        <div
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative aspect-square sm:aspect-[4/3] rounded-2xl overflow-hidden bg-arena/30 flex items-center justify-center touch-none select-none"
          style={{
            cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "zoom-in",
          }}
        >
          <div
            onClick={handleImageClick}
            onPointerDown={handlePointerDown}
            className="relative flex items-center justify-center transition-transform duration-75 ease-out h-full w-full select-none"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            }}
          >
            <img
              src={currentImage.url}
              alt={currentImage.alt || currentImage.title || "Imagen ampliada"}
              draggable={false}
              className="h-full w-full object-contain rounded-2xl pointer-events-none"
            />
          </div>

          {/* Badge indicador de zoom cuando está ampliada */}
          {scale > 1 && (
            <span className="absolute bottom-2.5 left-2.5 rounded-full bg-black/75 text-white px-2.5 py-0.5 text-[11px] font-medium backdrop-blur-xs pointer-events-none z-10">
              🔍 Arrastrá libremente para recorrer la pieza
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
                  "relative h-10 w-10 shrink-0 rounded-lg overflow-hidden border-2 transition-all cursor-pointer bg-arena/30 flex items-center justify-center p-0.5",
                  currentIndex === idx
                    ? "border-terracota scale-105 shadow-sm"
                    : "border-transparent opacity-50 hover:opacity-100"
                )}
              >
                <img
                  src={img.url}
                  alt=""
                  className="h-full w-full object-contain"
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
