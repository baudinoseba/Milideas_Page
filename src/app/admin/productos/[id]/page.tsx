import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductoForm } from "@/components/admin/producto-form";
import { BackButton } from "@/components/ui/back-button";
import type { Categoria, Producto, ProductoImagen } from "@/types";

export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: producto }, { data: categorias }, { data: imagenes }] =
    await Promise.all([
      supabase.from("productos").select("*").eq("id", id).single(),
      supabase.from("categorias").select("*").order("nombre"),
      supabase
        .from("producto_imagenes")
        .select("*")
        .eq("producto_id", id)
        .order("orden"),
    ]);

  if (!producto) notFound();

  return (
    <div>
      <div className="mb-4">
        <BackButton fallbackHref="/admin/productos">Volver a productos</BackButton>
      </div>
      <h1 className="mb-6 text-2xl font-medium">Editar pieza</h1>
      <ProductoForm
        categorias={(categorias ?? []) as Categoria[]}
        producto={producto as Producto}
        imagenes={(imagenes ?? []) as ProductoImagen[]}
      />
    </div>
  );
}
