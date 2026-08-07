import { createClient } from "@/lib/supabase/server";
import { getCategorias } from "@/lib/supabase/queries";
import { ProductosManager } from "@/components/admin/productos-manager";
import type { Categoria, Producto, ProductoImagen } from "@/types";

type ProductoConCategoria = Producto & {
  categorias: { nombre: string } | null;
  producto_imagenes: ProductoImagen[];
};

export const metadata = { title: "Admin — Productos y Categorías" };

export default async function AdminProductosPage() {
  const supabase = await createClient();

  const [{ data: productosData }, categorias] = await Promise.all([
    supabase
      .from("productos")
      .select("*, categorias(nombre), producto_imagenes(*)")
      .order("created_at", { ascending: false }),
    getCategorias().catch(() => []),
  ]);

  const productos = (productosData ?? []) as ProductoConCategoria[];

  return (
    <ProductosManager
      initialProductos={productos}
      initialCategorias={categorias as Categoria[]}
    />
  );
}
