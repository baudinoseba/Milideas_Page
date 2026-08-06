import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import type { Categoria } from "@/types";

export const metadata = { title: "Categorías" };

export default async function AdminCategoriasPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categorias")
    .select("*")
    .order("nombre");

  const categorias = (data ?? []) as Categoria[];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-medium">Categorías</h1>
        <Link href="/admin/categorias/nueva">
          <Button>Nueva categoría</Button>
        </Link>
      </div>
      <ul className="divide-y divide-border rounded-sm border border-border">
        {categorias.map((cat) => (
          <li key={cat.id} className="flex items-center justify-between p-4">
            <span>{cat.nombre}</span>
            <Link
              href={`/admin/categorias/${cat.id}`}
              className="text-sm text-muted hover:text-foreground"
            >
              Editar
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
