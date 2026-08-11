"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatPrecio } from "@/lib/pricing";
import type { ProductoConImagenes } from "@/types";

interface HeroCarouselProps {
  items: ProductoConImagenes[];
}

export function HeroCarousel({ items }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const nextSlide = useCallback(() => {
    if (items.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % items.length);
  }, [items.length]);

  const prevSlide = useCallback(() => {
    if (items.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  }, [items.length]);

  // Autoplay every 6 seconds if not hovered
  useEffect(() => {
    if (isHovered || items.length <= 1) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 6000);
    return () => clearInterval(timer);
  }, [isHovered, items.length, nextSlide]);

  if (items.length === 0) return null;

  const currentItem = items[currentIndex];
  if (!currentItem) return null;

  const sortedImages = [...(currentItem.producto_imagenes ?? [])].sort(
    (a, b) => a.orden - b.orden
  );

  const mainImageUrl =
    sortedImages[0]?.url_imagen ?? "https://placehold.co/800x800?text=Milideas";

  return (
    <div
      className="group relative flex flex-col w-full overflow-hidden transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ─── Image Stage — Full Coverage with Rounded Corners ─── */}
      <div className="relative h-[230px] sm:h-[380px] lg:h-[420px] w-full max-w-full overflow-hidden rounded-2xl shadow-md border border-border/40 bg-surface/50">
        {/* Soft Ambient Glow Reflection */}
        <div
          className="absolute inset-0 z-0 opacity-25 blur-3xl scale-125 transition-all duration-700 pointer-events-none"
          style={{
            backgroundImage: `url('${mainImageUrl}')`,
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        />

        {/* Product Image occupying 100% of container with rounded corners */}
        <div className="relative z-10 flex h-full w-full items-center justify-center">
          <img
            key={currentItem.id}
            src={mainImageUrl}
            alt={currentItem.nombre}
            className="h-full w-full object-cover rounded-2xl transition-all duration-500 group-hover:scale-[1.03]"
          />
        </div>

        {/* Carousel Navigation Arrows */}
        {items.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                prevSlide();
              }}
              aria-label="Pieza anterior"
              className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border/60 bg-surface/80 text-chocolate font-bold shadow-md backdrop-blur-sm transition-all hover:bg-terracota hover:text-white hover:border-terracota hover:scale-110 active:scale-95"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                nextSlide();
              }}
              aria-label="Siguiente pieza"
              className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border/60 bg-surface/80 text-chocolate font-bold shadow-md backdrop-blur-sm transition-all hover:bg-terracota hover:text-white hover:border-terracota hover:scale-110 active:scale-95"
            >
              ›
            </button>
          </>
        )}

        {/* Collection Badge — floating over image */}
        <div className="absolute top-4 left-4 z-20">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-surface/90 px-3.5 py-1.5 text-[11px] font-semibold font-sans tracking-wide text-chocolate shadow-sm backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-verde-menta animate-pulse" />
            {currentItem.producciones?.nombre ?? currentItem.categorias?.nombre ?? "Pieza de Lanzamiento"}
          </span>
        </div>

        {/* "Ver pieza" — aparece solo en hover sobre la imagen */}
        <Link
          href={`/producto/${currentItem.slug}`}
          className="absolute bottom-4 right-4 z-20 inline-flex items-center justify-center rounded-full bg-terracota px-5 py-2.5 text-xs font-semibold text-white shadow-lg transition-all opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 hover:bg-terracota/90 hover:scale-105 active:scale-95 font-sans"
        >
          Ver pieza →
        </Link>
      </div>

      {/* ─── Bottom Info Bar ─── */}
      <div className="mt-4 flex flex-col gap-3 px-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-lg sm:text-xl font-medium font-serif tracking-tight text-chocolate leading-snug">
              {currentItem.nombre}
            </h3>
            <p className="mt-0.5 text-base font-semibold font-sans text-terracota">
              {formatPrecio(currentItem.precio_base)}
            </p>
          </div>
        </div>

        {/* Interactive Thumbnail Strip */}
        {items.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-1 no-scrollbar">
            {items.map((item, idx) => {
              const itemImg =
                item.producto_imagenes?.[0]?.url_imagen ??
                "https://placehold.co/100x100";
              const isSelected = idx === currentIndex;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border transition-all ${
                    isSelected
                      ? "border-chocolate ring-2 ring-terracota/30 bg-surface scale-105"
                      : "border-border/60 bg-surface/60 opacity-60 hover:opacity-100 hover:border-border"
                  }`}
                  title={item.nombre}
                >
                  <img
                    src={itemImg}
                    alt={item.nombre}
                    className="h-full w-full object-contain p-1"
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
