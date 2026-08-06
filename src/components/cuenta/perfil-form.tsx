"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { updatePerfilAction } from "@/lib/actions";
import type { Perfil } from "@/types";

export function PerfilForm({ perfil }: { perfil: Perfil }) {
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await updatePerfilAction(formData);
    });
  };

  return (
    <Card className="max-w-md">
      <h1 className="mb-6 text-xl font-medium">Mi perfil</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="nombreCompleto">Nombre completo</Label>
          <Input
            id="nombreCompleto"
            name="nombreCompleto"
            defaultValue={perfil.nombre_completo ?? ""}
            required
          />
        </div>
        <div>
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input
            id="whatsapp"
            name="whatsapp"
            defaultValue={perfil.whatsapp ?? ""}
            required
          />
        </div>
        <Button type="submit" isLoading={pending}>
          Guardar cambios
        </Button>
      </form>
    </Card>
  );
}
