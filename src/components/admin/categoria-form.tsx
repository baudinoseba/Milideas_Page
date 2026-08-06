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
}: {
  id?: string;
  nombre?: string;
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
    <Card className="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="nombre">Nombre</Label>
          <Input id="nombre" name="nombre" defaultValue={nombre} required />
        </div>
        <Button type="submit" isLoading={pending}>
          Guardar
        </Button>
      </form>
    </Card>
  );
}
