import { createClient } from "@/lib/supabase/server";
import { ProductoForm } from "@/components/admin/producto-form";
import type { Categoria } from "@/types";

export default async function NuevoProductoPage() {
  const supabase = await createClient();
  const { data: categorias } = await supabase.from("categorias").select("*").order("nombre");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-medium">Nuevo producto</h1>
      <ProductoForm categorias={(categorias ?? []) as Categoria[]} />
    </div>
  );
}
