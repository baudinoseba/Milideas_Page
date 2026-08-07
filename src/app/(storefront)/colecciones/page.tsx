import { ProductCard } from "@/components/product/product-card";
import { getProductos } from "@/lib/supabase/queries";
import { BackButton } from "@/components/ui/back-button";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { CATALOGO_LABELS, type TipoCatalogo, type ProductoConImagenes } from "@/types";

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
  const rawProductos = await getProductos({ coleccionesFilter: filtro, tipoCatalogo: tipo }).catch(() => []);

  const catalogTypes: TipoCatalogo[] = ["ceramica", "esculturas", "ilustraciones"];

  // Logic for "Colección Actual": Keep ONLY the single latest collection launched
  let actualProducts: ProductoConImagenes[] = [];
  let latestCollectionName = "Colección Actual";

  if (filtro === "actual" && rawProductos.length > 0) {
    // Find the latest collection name from the first product
    latestCollectionName =
      rawProductos[0]?.producciones?.nombre ??
      rawProductos[0]?.categorias?.nombre ??
      "Última Colección Lanzada";

    actualProducts = rawProductos.filter((p) => {
      const pName = p.producciones?.nombre ?? p.categorias?.nombre ?? "Última Colección Lanzada";
      return pName === latestCollectionName;
    });
  }

  // Logic for "Colecciones Pasadas": Group products by collection name
  const pastGrouped = new Map<string, ProductoConImagenes[]>();
  if (filtro === "pasadas" && rawProductos.length > 0) {
    for (const p of rawProductos) {
      const groupName = p.producciones?.nombre ?? p.categorias?.nombre ?? "Colecciones Anteriores";
      if (!pastGrouped.has(groupName)) {
        pastGrouped.set(groupName, []);
      }
      pastGrouped.get(groupName)!.push(p);
    }
  }

  return (
    <div className="space-y-8 pb-12">
      <div>
        <BackButton fallbackHref="/">Volver al inicio</BackButton>
      </div>

      <div className="space-y-3 border-b border-border/60 pb-6">
        <span className="text-xs font-semibold uppercase tracking-wider text-barro font-sans">
          Nuestros lanzamientos
        </span>
        <h1 className="text-3xl font-medium font-serif text-chocolate sm:text-4xl">Colecciones de Autor</h1>
        <p className="text-sm font-sans text-barro max-w-lg leading-relaxed">
          Ediciones limitadas agrupadas por colecciones conceptuales de Mili Ferrero.
        </p>
      </div>

      {/* Catalog Type Tags (Cerámica, Esculturas, Ilustraciones) */}
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/colecciones?filtro=${filtro}`}
          className={cn(
            "rounded-full px-4 py-1.5 text-xs font-semibold font-sans transition-all border shadow-xs",
            !tipo
              ? "bg-terracota text-white border-terracota font-bold"
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
              "rounded-full px-4 py-1.5 text-xs font-semibold font-sans transition-all border flex items-center gap-1.5 shadow-xs",
              tipo === t
                ? "bg-terracota text-white border-terracota font-bold"
                : "bg-surface text-chocolate border-border hover:bg-arena/50"
            )}
          >
            <span>{CATALOGO_LABELS[t].emoji}</span>
            <span>{CATALOGO_LABELS[t].nombre}</span>
          </Link>
        ))}
      </div>

      {/* Primary Tabs: Colección Actual vs Colecciones Pasadas */}
      <div className="flex gap-6 border-b border-border/80 pb-px">
        <Link
          href={`/colecciones?filtro=actual${tipo ? `&tipo=${tipo}` : ""}`}
          className={cn(
            "pb-3 text-sm font-medium transition-all border-b-2 -mb-px flex items-center gap-2",
            filtro === "actual"
              ? "border-terracota text-chocolate font-bold text-base"
              : "border-transparent text-barro hover:text-chocolate",
          )}
        >
          <span>✨ Colección Actual</span>
        </Link>
        <Link
          href={`/colecciones?filtro=pasadas${tipo ? `&tipo=${tipo}` : ""}`}
          className={cn(
            "pb-3 text-sm font-medium transition-all border-b-2 -mb-px flex items-center gap-2",
            filtro === "pasadas"
              ? "border-terracota text-chocolate font-bold text-base"
              : "border-transparent text-barro hover:text-chocolate",
          )}
        >
          <span>📦 Colecciones Pasadas</span>
        </Link>
      </div>

      {/* ─── TAB 1: COLECCIÓN ACTUAL ─── */}
      {filtro === "actual" && (
        <div className="space-y-8">
          {actualProducts.length === 0 ? (
            <div className="py-16 text-center rounded-3xl border border-border/50 bg-arena/20 p-8 space-y-3">
              <p className="text-base font-serif text-chocolate font-medium">
                No hay una colección activa en este momento para esta categoría.
              </p>
              <p className="text-xs text-barro">
                Te invitamos a recorrer las colecciones pasadas para ver obras históricas de la artista.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-arena/30 p-5 rounded-2xl border border-terracota/20">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-terracota font-sans">
                    ÚLTIMO LANZAMIENTO PUBLICADO
                  </span>
                  <h2 className="text-2xl font-serif font-semibold text-chocolate mt-0.5">
                    ✨ {latestCollectionName}
                  </h2>
                </div>
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-3.5 py-1.5 rounded-full border border-emerald-500/20 self-start sm:self-auto">
                  🟢 Piezas disponibles
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6">
                {actualProducts.map((p) => (
                  <ProductCard key={p.id} producto={p} />
                ))}
              </div>
            </div>
          )}

          {/* Invitation Callout Card to Past Collections */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl border border-terracota/30 bg-gradient-to-r from-arena/40 to-arena/10 p-6 sm:p-8 shadow-xs">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="font-serif text-lg font-medium text-chocolate">
                ¿Querés explorar obras de ediciones anteriores?
              </h3>
              <p className="text-xs text-barro font-sans max-w-lg">
                Recorré los lanzamientos y colecciones históricas moldeadas e ilustradas a mano por Mili Ferrero.
              </p>
            </div>
            <Link
              href={`/colecciones?filtro=pasadas${tipo ? `&tipo=${tipo}` : ""}`}
              className="shrink-0 rounded-full bg-terracota px-6 py-3 text-xs font-semibold text-white hover:bg-terracota/90 transition-all shadow-md hover:-translate-y-0.5"
            >
              📦 Explorar Colecciones Pasadas →
            </Link>
          </div>
        </div>
      )}

      {/* ─── TAB 2: COLECCIONES PASADAS (AGRUPADAS POR COLECCIÓN) ─── */}
      {filtro === "pasadas" && (
        <div className="space-y-12">
          {pastGrouped.size === 0 ? (
            <div className="py-16 text-center rounded-3xl border border-border/50 bg-arena/20 p-8">
              <p className="text-base font-serif text-chocolate font-medium">
                No se encontraron colecciones pasadas con el filtro seleccionado.
              </p>
            </div>
          ) : (
            Array.from(pastGrouped.entries()).map(([colNombre, prods]) => (
              <section key={colNombre} className="space-y-5 rounded-3xl border border-border/60 bg-surface/40 p-6 sm:p-8 shadow-xs">
                <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-terracota/10 text-terracota text-sm font-bold">
                      📦
                    </span>
                    <h2 className="text-xl font-serif font-semibold text-chocolate sm:text-2xl">
                      {colNombre}
                    </h2>
                  </div>
                  <span className="text-xs font-semibold text-barro bg-arena/60 px-3 py-1 rounded-full border border-border/50">
                    {prods.length} {prods.length === 1 ? "pieza" : "piezas"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 pt-2">
                  {prods.map((p) => (
                    <ProductCard key={p.id} producto={p} />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      )}
    </div>
  );
}
