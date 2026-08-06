import Link from "next/link";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { Badge } from "@/components/ui/badge";
import { formatPrecio } from "@/lib/pricing";
import { getStockStatus, getStockLabel } from "@/lib/stock";
import type { ProductoConImagenes } from "@/types";

export function ProductCard({ producto }: { producto: ProductoConImagenes }) {
  const imagen = producto.producto_imagenes.sort((a, b) => a.orden - b.orden)[0];
  const stockStatus = getStockStatus(producto.stock_disponible);

  return (
    <Link href={`/producto/${producto.slug}`} className="group block">
      <article>
        <OptimizedImage
          src={imagen?.url_imagen ?? "https://placehold.co/800x800"}
          alt={producto.nombre}
          className="mb-3 transition-opacity group-hover:opacity-90"
        />
        <div className="space-y-1">
          <h3 className="text-sm font-medium">{producto.nombre}</h3>
          <p className="text-sm text-muted">{formatPrecio(producto.precio_base)}</p>
          <div className="flex flex-wrap gap-1">
            {producto.es_entrega_inmediata && (
              <Badge variant="success">Entrega inmediata</Badge>
            )}
            {stockStatus === "bajo_pedido" && (
              <Badge variant="warning">Bajo pedido</Badge>
            )}
            {stockStatus === "no_disponible" && (
              <Badge variant="muted">{getStockLabel(stockStatus)}</Badge>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
