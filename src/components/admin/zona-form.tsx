"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { saveZonaAction } from "@/lib/actions";
import type { ZonaLogistica } from "@/types";

export function ZonaForm({ zona }: { zona?: ZonaLogistica }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await saveZonaAction(formData, zona?.id);
      if (!result.error) router.push("/admin/logistica");
    });
  };

  return (
    <Card className="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="zonaNombre">Zona</Label>
          <Input id="zonaNombre" name="zonaNombre" defaultValue={zona?.zona_nombre} required />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="precioAgencia">Precio agencia</Label>
            <Input id="precioAgencia" name="precioAgencia" type="number" defaultValue={zona?.precio_agencia ?? 0} required />
          </div>
          <div>
            <Label htmlFor="precioDomicilio">Precio domicilio</Label>
            <Input id="precioDomicilio" name="precioDomicilio" type="number" defaultValue={zona?.precio_domicilio ?? 0} required />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="activa" defaultChecked={zona?.activa ?? true} />
          Zona activa
        </label>
        <Button type="submit" isLoading={pending}>
          Guardar
        </Button>
      </form>
    </Card>
  );
}
