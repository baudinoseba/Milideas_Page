import { ProductCard } from "@/components/product/product-card";
import { getProductos } from "@/lib/supabase/queries";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export const metadata = {
  title: "Colecciones",
  description: "Colecciones de cerámica de autor Milideas.",
};

export default async function ColeccionesPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: "actual" | "pasadas" }>;
}) {
  const { filtro = "actual" } = await searchParams;
  const productos = await getProductos({ coleccionesFilter: filtro }).catch(() => []);

  return (
    <div>
      <div className="mb-10 space-y-3 border-b border-border/60 pb-6">
        <span className="text-xs font-semibold uppercase tracking-wider text-barro font-sans">
          Nuestros lanzamientos
        </span>
        <h1 className="text-3xl font-medium font-serif text-chocolate sm:text-4xl">Colecciones</h1>
        <p className="text-sm font-sans text-barro max-w-lg">
          Lanzamientos de piezas únicas y ediciones limitadas.
        </p>
      </div>

      <div className="mb-8 flex gap-4 border-b border-border pb-px">
        <Link
          href="/colecciones?filtro=actual"
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
          href="/colecciones?filtro=pasadas"
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
            ? "No hay una colección activa en este momento."
            : "No se encontraron colecciones pasadas."}
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
