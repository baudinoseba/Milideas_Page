import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CategoriaForm } from "@/components/admin/categoria-form";
import type { Categoria } from "@/types";

export default async function EditarCategoriaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("categorias").select("*").eq("id", id).single();
  if (!data) notFound();

  const categoria = data as Categoria;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-medium">Editar categoría</h1>
      <CategoriaForm id={categoria.id} nombre={categoria.nombre} />
    </div>
  );
}
