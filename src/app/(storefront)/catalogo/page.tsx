import { ProductCard } from "@/components/product/product-card";
import { getCategorias, getProductos } from "@/lib/supabase/queries";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export const metadata = {
  title: "Catálogo",
  description: "Explorá toda la colección de cerámica ilustrada Milideas.",
};

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria } = await searchParams;
  const [productos, categorias] = await Promise.all([
    getProductos({ categoriaId: categoria }).catch(() => []),
    getCategorias().catch(() => []),
  ]);

  return (
    <div className="space-y-6 pb-12">
      {/* Page header */}
      <div className="space-y-1.5 border-b border-border/60 pb-4">
        <h1 className="text-3xl font-medium font-serif text-chocolate sm:text-4xl">Catálogo del Taller</h1>
        <p className="text-sm font-sans text-barro">
          Todas las piezas disponibles moldeadas e ilustradas a mano.
        </p>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none pt-1">
        <Link
          href="/catalogo"
          className={cn(
            "shrink-0 rounded-full border px-4 py-2 text-xs font-semibold font-sans transition-all duration-200 shadow-sm",
            !categoria
              ? "border-terracota bg-terracota text-white"
              : "border-barro-claro/60 bg-surface text-chocolate hover:border-terracota/60 hover:bg-arena/50",
          )}
        >
          Todas las piezas
        </Link>
        {categorias.map((cat) => (
          <Link
            key={cat.id}
            href={`/catalogo?categoria=${cat.id}`}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-xs font-semibold font-sans transition-all duration-200 shadow-sm",
              categoria === cat.id
                ? "border-terracota bg-terracota text-white"
                : "border-barro-claro/60 bg-surface text-chocolate hover:border-terracota/60 hover:bg-arena/50",
            )}
          >
            {cat.nombre}
          </Link>
        ))}
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between text-xs text-barro font-sans">
        <p>
          {productos.length} {productos.length === 1 ? "pieza encontrada" : "piezas encontradas"}
        </p>
        <span className="font-handwritten text-base text-terracota">Ediciones limitadas</span>
      </div>

      {/* Product grid or empty state */}
      {productos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-3xl border border-border/50 bg-arena/30 p-8 space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rosa-buho/20 text-terracota text-3xl">
            🏺
          </div>
          <h2 className="text-xl font-medium font-serif text-chocolate">No hay piezas disponibles en esta categoría</h2>
          <p className="max-w-md text-sm font-sans text-barro leading-relaxed">
            Las piezas de este lanzamiento se han agotado o están en etapa de horneado en el taller. Explorá otras colecciones.
          </p>
          <Link
            href="/catalogo"
            className="inline-flex items-center gap-1 rounded-full bg-terracota px-6 py-2.5 text-xs font-semibold text-white transition-all hover:bg-terracota/90 shadow-sm"
          >
            Ver todas las piezas
          </Link>
        </div>
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

