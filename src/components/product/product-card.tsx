import Link from "next/link";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { Badge } from "@/components/ui/badge";
import { formatPrecio } from "@/lib/pricing";
import { getStockStatus } from "@/lib/stock";
import { QuickAddToCartButton } from "@/components/product/quick-add-cart-button";
import type { ProductoConImagenes } from "@/types";

export function ProductCard({ producto }: { producto: ProductoConImagenes }) {
  const imagen = producto.producto_imagenes.sort((a, b) => a.orden - b.orden)[0];
  const stockStatus = getStockStatus(producto.stock_disponible);

  return (
    <Link href={`/producto/${producto.slug}`} className="group block">
      <article
        className="space-y-3 rounded-2xl border border-border/50 bg-surface p-3 transition-all duration-300 hover:-translate-y-1 hover:border-border hover:shadow-piece"
        style={{ boxShadow: "var(--shadow-subtle)" }}
      >
        {/* Image container — Full coverage with rounded corners */}
        <div className="relative overflow-hidden rounded-xl aspect-[4/5] w-full bg-surface/50">
          <OptimizedImage
            src={imagen?.url_imagen ?? "https://placehold.co/800x800"}
            alt={producto.nombre}
            aspectRatio="none"
            objectFit="cover"
            className="h-full w-full object-cover rounded-xl transition-transform duration-500 ease-out group-hover:scale-[1.03]"
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

          {/* Stock quantity indicator */}
          {producto.stock_disponible > 0 && (
            <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10">
              <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-chocolate/90 px-3 py-1.5 text-[11px] font-medium text-crema-cruda shadow-sm backdrop-blur-md">
                <span className={`h-1.5 w-1.5 rounded-full ${producto.stock_disponible === 1 ? "bg-amarillo-sol animate-pulse" : "bg-verde-menta"}`} />
                {producto.stock_disponible === 1
                  ? "¡Última unidad disponible!"
                  : `📦 ${producto.stock_disponible} unidades disponibles`}
              </span>
            </div>
          )}

          {stockStatus === "no_disponible" && (
            <div className="absolute inset-0 flex items-center justify-center bg-chocolate/40 backdrop-blur-[2px] z-10">
              <span className="rounded-full bg-surface/90 px-3 py-1 text-xs font-semibold text-chocolate shadow-sm">
                Encontró su hogar (Agotado)
              </span>
            </div>
          )}
        </div>

        {/* Text info */}
        <div className="space-y-2 px-1 pb-1">
          <h3 className="text-base font-medium font-serif leading-tight text-chocolate transition-colors group-hover:text-terracota">
            {producto.nombre}
          </h3>
          <div className="flex items-center justify-between pt-0.5">
            <p className="text-sm font-semibold font-sans text-chocolate">{formatPrecio(producto.precio_base)}</p>
            {producto.categorias && (
              <span className="text-[11px] font-medium text-barro font-sans">
                {producto.categorias.nombre}
              </span>
            )}
          </div>

          <div className="pt-1">
            <QuickAddToCartButton producto={producto} />
          </div>
        </div>
      </article>
    </Link>
  );
}

