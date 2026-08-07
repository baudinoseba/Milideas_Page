import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import type { Categoria } from "@/types";

export const metadata = { title: "Categorías" };

export default async function AdminCategoriasPage() {
  const supabase = await createClient();

  // Get categories with product count
  const { data: categorias } = await supabase
    .from("categorias")
    .select("*")
    .order("nombre");

  // Get product counts per category
  const { data: productCounts } = await supabase
    .from("productos")
    .select("categoria_id")
    .eq("activo", true);

  const countMap: Record<string, number> = {};
  (productCounts ?? []).forEach((p) => {
    if (p.categoria_id) {
      countMap[p.categoria_id] = (countMap[p.categoria_id] ?? 0) + 1;
    }
  });

  const cats = (categorias ?? []) as Categoria[];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Categorías</h1>
          <p className="mt-1 text-sm text-muted">
            Organizá tus piezas en categorías para que tus clientes las
            encuentren fácil
          </p>
        </div>
        <Link href="/admin/categorias/nueva">
          <Button>+ Nueva categoría</Button>
        </Link>
      </div>

      {cats.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border p-12 text-center">
          <p className="text-3xl mb-3">📁</p>
          <p className="text-lg font-medium">No tenés categorías</p>
          <p className="mt-1 text-sm text-muted mb-6">
            Creá categorías para organizar tus piezas (ej: Tazas, Platos,
            Macetas)
          </p>
          <Link href="/admin/categorias/nueva">
            <Button>Crear primera categoría</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cats.map((cat) => {
            const count = countMap[cat.id] ?? 0;
            return (
              <Link
                key={cat.id}
                href={`/admin/categorias/${cat.id}`}
                className="flex items-center justify-between rounded-lg border border-border bg-surface p-5 transition-all hover:border-admin-accent hover:shadow-sm"
              >
                <div>
                  <h3 className="font-medium">{cat.nombre}</h3>
                  <p className="mt-0.5 text-xs text-muted">
                    {count} pieza{count !== 1 ? "s" : ""}
                  </p>
                </div>
                <span className="text-sm text-muted">Editar →</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
