import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Producto } from "@/types";

type ProductoConCategoria = Producto & {
  categorias: { nombre: string } | null;
};

export const metadata = { title: "Productos" };

export default async function AdminProductosPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("productos")
    .select("*, categorias(nombre)")
    .order("created_at", { ascending: false });

  const productos = (data ?? []) as ProductoConCategoria[];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-medium">Productos</h1>
        <Link href="/admin/productos/nuevo">
          <Button>Nuevo producto</Button>
        </Link>
      </div>
      <ul className="divide-y divide-border rounded-sm border border-border">
        {productos.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-4 p-4">
            <div>
              <p className="font-medium">{p.nombre}</p>
              <p className="text-xs text-muted">
                Stock: {p.stock_disponible} ·{" "}
                {p.categorias?.nombre ?? "Sin categoría"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!p.activo && <Badge variant="muted">Inactivo</Badge>}
              <Link
                href={`/admin/productos/${p.id}`}
                className="text-sm text-muted hover:text-foreground"
              >
                Editar
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
