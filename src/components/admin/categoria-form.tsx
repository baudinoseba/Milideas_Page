"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { saveCategoriaAction } from "@/lib/actions";

export function CategoriaForm({
  id,
  nombre = "",
  tipoCatalogo = "ceramica",
}: {
  id?: string;
  nombre?: string;
  tipoCatalogo?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await saveCategoriaAction(formData, id);
      if (!result.error) router.push("/admin/categorias");
    });
  };

  return (
    <Card className="max-w-md p-6 rounded-2xl border-border bg-surface">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label htmlFor="nombre" className="text-xs font-semibold text-chocolate">Nombre de la Categoría</Label>
          <Input id="nombre" name="nombre" defaultValue={nombre} placeholder="ej. Bandejas, Acuarelas, Animales" required className="mt-1" />
        </div>

        <div>
          <Label htmlFor="tipoCatalogo" className="text-xs font-semibold text-chocolate">Disciplina / Tipo de Catálogo</Label>
          <select
            id="tipoCatalogo"
            name="tipoCatalogo"
            defaultValue={tipoCatalogo || "ceramica"}
            className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-xs font-semibold text-chocolate focus:border-admin-accent focus:outline-none"
          >
            <option value="ceramica">🏺 Cerámica (Piezas Únicas / Utilitarias)</option>
            <option value="ilustraciones">🎨 Ilustraciones (Láminas / Obras en Papel)</option>
            <option value="esculturas">🗿 Esculturas (Modelado Tridimensional)</option>
          </select>
        </div>

        <Button type="submit" isLoading={pending} className="w-full bg-admin-accent text-white hover:bg-admin-accent-hover rounded-full">
          Guardar Categoría
        </Button>
      </form>
    </Card>
  );
}
