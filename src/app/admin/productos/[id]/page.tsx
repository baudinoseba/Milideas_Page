import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductoForm } from "@/components/admin/producto-form";
import type { Categoria, Producto } from "@/types";

export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: producto }, { data: categorias }] = await Promise.all([
    supabase.from("productos").select("*").eq("id", id).single(),
    supabase.from("categorias").select("*").order("nombre"),
  ]);

  if (!producto) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-medium">Editar producto</h1>
      <ProductoForm
        categorias={(categorias ?? []) as Categoria[]}
        producto={producto as Producto}
      />
    </div>
  );
}
