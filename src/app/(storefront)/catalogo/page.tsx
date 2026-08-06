import { ProductCard } from "@/components/product/product-card";
import { getCategorias, getProductos } from "@/lib/supabase/queries";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export const metadata = {
  title: "Catálogo",
  description: "Explorá toda la colección de cerámica Milideas.",
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
    <div>
      <h1 className="mb-6 text-2xl font-medium">Catálogo</h1>
      <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
        <Link
          href="/catalogo"
          className={cn(
            "shrink-0 rounded-sm border px-3 py-1.5 text-sm",
            !categoria ? "border-foreground" : "border-border text-muted",
          )}
        >
          Todos
        </Link>
        {categorias.map((cat) => (
          <Link
            key={cat.id}
            href={`/catalogo?categoria=${cat.id}`}
            className={cn(
              "shrink-0 rounded-sm border px-3 py-1.5 text-sm",
              categoria === cat.id
                ? "border-foreground"
                : "border-border text-muted",
            )}
          >
            {cat.nombre}
          </Link>
        ))}
      </div>
      {productos.length === 0 ? (
        <p className="text-muted">No hay productos disponibles.</p>
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
