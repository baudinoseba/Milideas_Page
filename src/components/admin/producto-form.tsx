"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { saveProductoAction } from "@/lib/actions";
import type { Categoria, Producto } from "@/types";

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function ProductoForm({
  categorias,
  producto,
}: {
  categorias: Categoria[];
  producto?: Producto;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await saveProductoAction(formData, producto?.id);
      if (!result.error) router.push("/admin/productos");
    });
  };

  return (
    <Card className="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="nombre">Nombre</Label>
          <Input
            id="nombre"
            name="nombre"
            defaultValue={producto?.nombre}
            required
            onChange={(e) => {
              if (!producto) {
                const slugInput = document.getElementById("slug") as HTMLInputElement;
                if (slugInput) slugInput.value = slugify(e.target.value);
              }
            }}
          />
        </div>
        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" name="slug" defaultValue={producto?.slug} required />
        </div>
        <div>
          <Label htmlFor="descripcion">Descripción</Label>
          <Textarea id="descripcion" name="descripcion" defaultValue={producto?.descripcion ?? ""} />
        </div>
        <div>
          <Label htmlFor="categoriaId">Categoría</Label>
          <Select id="categoriaId" name="categoriaId" defaultValue={producto?.categoria_id ?? ""}>
            <option value="">Sin categoría</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="precioBase">Precio base</Label>
            <Input id="precioBase" name="precioBase" type="number" defaultValue={producto?.precio_base ?? 0} required />
          </div>
          <div>
            <Label htmlFor="stockDisponible">Stock</Label>
            <Input id="stockDisponible" name="stockDisponible" type="number" defaultValue={producto?.stock_disponible ?? 0} required />
          </div>
        </div>
        <div>
          <Label htmlFor="fechaLanzamiento">Fecha lanzamiento (Drop)</Label>
          <Input
            id="fechaLanzamiento"
            name="fechaLanzamiento"
            type="datetime-local"
            defaultValue={
              producto?.fecha_lanzamiento
                ? new Date(producto.fecha_lanzamiento).toISOString().slice(0, 16)
                : ""
            }
          />
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="esPersonalizable" defaultChecked={producto?.es_personalizable} />
            Personalizable
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="esEntregaInmediata" defaultChecked={producto?.es_entrega_inmediata} />
            Entrega inmediata
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="activo" defaultChecked={producto?.activo ?? true} />
            Activo (Drop visible)
          </label>
        </div>
        <Button type="submit" isLoading={pending}>
          Guardar producto
        </Button>
      </form>
    </Card>
  );
}
