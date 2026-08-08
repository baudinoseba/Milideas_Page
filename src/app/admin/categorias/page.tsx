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
            const tipo = cat.tipo_catalogo || "ceramica";
            const badge =
              tipo === "ilustraciones"
                ? { label: "Ilustraciones", emoji: "🎨", color: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20" }
                : tipo === "esculturas"
                ? { label: "Esculturas", emoji: "🗿", color: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20" }
                : { label: "Cerámica", emoji: "🏺", color: "bg-terracota/10 text-terracota border-terracota/20" };

            return (
              <Link
                key={cat.id}
                href={`/admin/categorias/${cat.id}`}
                className="flex items-center justify-between rounded-2xl border border-border bg-surface p-5 transition-all hover:border-admin-accent hover:shadow-sm"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-chocolate font-serif">{cat.nombre}</h3>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${badge.color}`}>
                      <span>{badge.emoji}</span>
                      <span>{badge.label}</span>
                    </span>
                  </div>
                  <p className="text-xs text-muted">
                    {count} pieza{count !== 1 ? "s" : ""} asociadas
                  </p>
                </div>
                <span className="text-xs font-semibold text-admin-accent">Editar →</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
