import { createClient } from "@/lib/supabase/server";
import { ProductoForm } from "@/components/admin/producto-form";
import { BackButton } from "@/components/ui/back-button";
import type { Categoria } from "@/types";

export default async function NuevoProductoPage() {
  const supabase = await createClient();
  const { data: categorias } = await supabase.from("categorias").select("*").order("nombre");

  return (
    <div>
      <div className="mb-4">
        <BackButton fallbackHref="/admin/productos">Volver a productos</BackButton>
      </div>
      <h1 className="mb-6 text-2xl font-medium">Nuevo producto</h1>
      <ProductoForm categorias={(categorias ?? []) as Categoria[]} />
    </div>
  );
}
