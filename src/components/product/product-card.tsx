"use client";

import { useState } from "react";
import Link from "next/link";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { Badge } from "@/components/ui/badge";
import { formatPrecio } from "@/lib/pricing";
import { getStockStatus } from "@/lib/stock";
import { QuickAddToCartButton } from "@/components/product/quick-add-cart-button";
import type { ProductoConImagenes } from "@/types";

export function ProductCard({ producto, priority = false }: { producto: ProductoConImagenes; priority?: boolean }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const imagen = producto.producto_imagenes?.sort((a, b) => a.orden - b.orden)[0];
  const stockStatus = getStockStatus(producto.stock_disponible);

  return (
    <>
      <article
        className="group relative flex flex-col justify-between space-y-3 rounded-2xl border border-border/50 bg-surface p-3 transition-all duration-300 hover:-translate-y-1 hover:border-border hover:shadow-piece w-full max-w-full overflow-hidden"
        style={{ boxShadow: "var(--shadow-subtle)" }}
      >
        {/* Clickable Image & Details — Clean single <a> tag */}
        <Link href={`/producto/${producto.slug}`} className="block space-y-3">
          {/* Image container — Full piece visible with contain */}
          <div className="relative overflow-hidden rounded-xl aspect-[4/5] w-full bg-arena/20 flex items-center justify-center p-1.5 sm:p-2 border border-border/30">
            <OptimizedImage
              src={imagen?.url_imagen ?? "https://placehold.co/800x800"}
              alt={producto.nombre}
              aspectRatio="none"
              objectFit="contain"
              priority={priority}
              className="h-full w-full object-contain rounded-lg transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            />

            {/* Badges overlay */}
            <div className="absolute left-2.5 top-2.5 flex flex-col gap-1.5 z-10">
              {producto.stock_disponible === 1 && (
                <Badge variant="default" className="shadow-sm bg-terracota text-white border border-terracota/20 backdrop-blur-md text-[11px] font-medium">
                  🎨 Pieza Única
                </Badge>
              )}
              {producto.es_entrega_inmediata && (
                <Badge variant="success" className="shadow-sm bg-surface/90 text-terracota border border-terracota/20 backdrop-blur-md text-[11px] font-medium">
                  Entrega inmediata
                </Badge>
              )}
              {stockStatus === "bajo_pedido" && (
                <Badge variant="warning" className="shadow-sm bg-surface/90 text-chocolate border border-barro-claro backdrop-blur-md text-[11px] font-medium">
                  Bajo pedido
                </Badge>
              )}
            </div>

            {stockStatus === "no_disponible" && (
              <div className="absolute inset-0 flex items-center justify-center bg-chocolate/40 backdrop-blur-[2px] z-10">
                <span className="rounded-full bg-surface/90 px-3 py-1 text-xs font-semibold text-chocolate shadow-sm">
                  Encontró su hogar (Agotado)
                </span>
              </div>
            )}
          </div>

          {/* Text info — Centered aesthetic layout */}
          <div className="space-y-1 px-1 text-center flex flex-col items-center">
            {producto.categorias && (
              <p className="text-[10px] sm:text-[11px] font-semibold font-sans uppercase tracking-wider text-terracota/90 truncate max-w-full">
                {producto.categorias.nombre}
              </p>
            )}
            <h3 className="text-base font-medium font-serif leading-tight text-chocolate transition-colors group-hover:text-terracota line-clamp-2">
              {producto.nombre}
            </h3>

            <div className="flex flex-col items-center justify-center gap-0.5 pt-1">
              <p className="text-base sm:text-lg font-bold font-sans text-chocolate">
                {formatPrecio(producto.precio_base)}
              </p>

              {producto.stock_disponible > 0 ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-stone-600 font-sans">
                  <span
                    className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                      producto.stock_disponible === 1
                        ? "bg-amber-500 animate-pulse"
                        : "bg-emerald-500"
                    }`}
                  />
                  <span>
                    {producto.stock_disponible === 1
                      ? "Disponible: 1"
                      : `Disponibles: ${producto.stock_disponible}`}
                  </span>
                </span>
              ) : stockStatus === "bajo_pedido" ? (
                <span className="text-[11px] font-medium text-chocolate/80">A pedido</span>
              ) : (
                <span className="text-[11px] font-medium text-stone-400">Agotado</span>
              )}
            </div>
          </div>
        </Link>

        {/* Action Buttons — Sibling of Link (Prevents <a> nesting hydration error) */}
        <div className="pt-1 px-1">
          <QuickAddToCartButton producto={producto} />
        </div>
      </article>

      {/* Lightbox Modal con Zoom */}
      <ImageLightbox
        images={[
          {
            url: imagen?.url_imagen ?? "https://placehold.co/800x800",
            title: producto.nombre,
            subtitle: `Precio: ${formatPrecio(producto.precio_base)} · ${producto.categorias?.nombre || "Cerámica de Autor"}`,
          },
        ]}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}
