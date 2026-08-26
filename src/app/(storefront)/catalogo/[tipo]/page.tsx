import { ProductCard } from "@/components/product/product-card";
import { getCategorias, getProductos } from "@/lib/supabase/queries";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { getCatalogoMeta, type TipoCatalogo } from "@/types";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tipo: string }>;
}) {
  const { tipo } = await params;
  const meta = getCatalogoMeta(tipo);
  return {
    title: meta.titulo,
    description: meta.desc,
  };
}

export default async function CatalogoTipoPage({
  params,
  searchParams,
}: {
  params: Promise<{ tipo: string }>;
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { tipo } = await params;
  const { categoria } = await searchParams;

  if (!["ceramica", "esculturas", "ilustraciones", "ilustracion"].includes(tipo)) {
    notFound();
  }

  const currentTipo = tipo as TipoCatalogo;
  const currentMeta = getCatalogoMeta(currentTipo);

  const [productos, categorias] = await Promise.all([
    getProductos({ tipoCatalogo: currentTipo, categoriaId: categoria }).catch(() => []),
    getCategorias(currentTipo).catch(() => []),
  ]);

  const catalogTypes: TipoCatalogo[] = ["ceramica", "esculturas", "ilustraciones"];

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header with Original Artwork Value Badge */}
      <div className="space-y-3 border-b border-border/60 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <h1 className="text-2xl font-medium font-serif text-chocolate sm:text-4xl flex items-center gap-2.5 leading-tight">
            <span>{currentMeta.emoji}</span>
            <span>{currentMeta.titulo}</span>
          </h1>

          <div className="inline-flex items-center gap-1.5 rounded-full border border-terracota/20 bg-arena/40 px-3.5 py-1 text-xs font-semibold text-terracota shadow-xs self-start sm:self-auto font-sans shrink-0">
            <span>✨</span>
            <span>Obra Original de Autor · Piezas Únicas No Seriadas</span>
          </div>
        </div>

        <p className="text-xs sm:text-sm font-sans text-barro leading-relaxed max-w-3xl">
          {currentMeta.desc}
        </p>
      </div>

      {/* Category Sub-filters (if categories exist) */}
      {categorias.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none pt-1">
          <Link
            href={`/catalogo/${currentTipo}`}
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
              href={`/catalogo/${currentTipo}?categoria=${cat.id}`}
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
      )}

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
            {currentMeta.emoji}
          </div>
          <h2 className="text-xl font-medium font-serif text-chocolate">No hay piezas disponibles en este catálogo actualmente</h2>
          <p className="max-w-md text-sm font-sans text-barro leading-relaxed">
            Las piezas de este lanzamiento se encuentran en proceso de producción o fueron agotadas. Explorá los demás catálogos.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            {catalogTypes.filter((t) => t !== currentTipo).map((t) => {
              const itemMeta = getCatalogoMeta(t);
              return (
                <Link
                  key={t}
                  href={`/catalogo/${t}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-terracota px-5 py-2 text-xs font-semibold text-white transition-all hover:bg-terracota/90 shadow-sm"
                >
                  <span>{itemMeta.emoji}</span>
                  <span>Ver {itemMeta.nombre}</span>
                </Link>
              );
            })}
          </div>
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
