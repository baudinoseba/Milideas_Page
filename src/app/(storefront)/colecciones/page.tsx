import { ProductCard } from "@/components/product/product-card";
import { getProductos } from "@/lib/supabase/queries";
import { BackButton } from "@/components/ui/back-button";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { CATALOGO_LABELS, type TipoCatalogo } from "@/types";

export const metadata = {
  title: "Colecciones",
  description: "Colecciones de arte y piezas de autor Milideas.",
};

export default async function ColeccionesPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: "actual" | "pasadas"; tipo?: TipoCatalogo }>;
}) {
  const { filtro = "actual", tipo } = await searchParams;
  const productos = await getProductos({ coleccionesFilter: filtro, tipoCatalogo: tipo }).catch(() => []);

  const catalogTypes: TipoCatalogo[] = ["ceramica", "esculturas", "ilustraciones"];

  return (
    <div>
      <div className="mb-4">
        <BackButton fallbackHref="/">Volver al inicio</BackButton>
      </div>

      <div className="mb-6 space-y-3 border-b border-border/60 pb-6">
        <span className="text-xs font-semibold uppercase tracking-wider text-barro font-sans">
          Nuestros lanzamientos
        </span>
        <h1 className="text-3xl font-medium font-serif text-chocolate sm:text-4xl">Colecciones de Autor</h1>
        <p className="text-sm font-sans text-barro max-w-lg">
          Lanzamientos de piezas únicas y ediciones limitadas.
        </p>
      </div>

      {/* Catalog Type Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href={`/colecciones?filtro=${filtro}`}
          className={cn(
            "rounded-full px-4 py-1.5 text-xs font-semibold font-sans transition-all border",
            !tipo
              ? "bg-terracota text-white border-terracota"
              : "bg-surface text-chocolate border-border hover:bg-arena/50"
          )}
        >
          ✨ Todas las Colecciones
        </Link>
        {catalogTypes.map((t) => (
          <Link
            key={t}
            href={`/colecciones?filtro=${filtro}&tipo=${t}`}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-semibold font-sans transition-all border flex items-center gap-1.5",
              tipo === t
                ? "bg-terracota text-white border-terracota"
                : "bg-surface text-chocolate border-border hover:bg-arena/50"
            )}
          >
            <span>{CATALOGO_LABELS[t].emoji}</span>
            <span>{CATALOGO_LABELS[t].nombre}</span>
          </Link>
        ))}
      </div>

      <div className="mb-8 flex gap-4 border-b border-border pb-px">
        <Link
          href={`/colecciones?filtro=actual${tipo ? `&tipo=${tipo}` : ""}`}
          className={cn(
            "pb-3 text-sm transition-colors border-b-2 -mb-px",
            filtro === "actual"
              ? "border-foreground font-medium text-foreground"
              : "border-transparent text-muted hover:text-foreground",
          )}
        >
          Colección Actual
        </Link>
        <Link
          href={`/colecciones?filtro=pasadas${tipo ? `&tipo=${tipo}` : ""}`}
          className={cn(
            "pb-3 text-sm transition-colors border-b-2 -mb-px",
            filtro === "pasadas"
              ? "border-foreground font-medium text-foreground"
              : "border-transparent text-muted hover:text-foreground",
          )}
        >
          Colecciones Pasadas
        </Link>
      </div>

      {productos.length === 0 ? (
        <p className="text-muted">
          {filtro === "actual"
            ? "No hay una colección activa en este momento para este filtro."
            : "No se encontraron colecciones pasadas para este filtro."}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6">
          {productos.map((p) => (
            <ProductCard key={p.id} producto={p} />
          ))}
        </div>
      )}
    </div>
  );
}
