"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { deleteProduccionCompletaAction } from "@/lib/actions";

interface ProduccionItem {
  id: string;
  nombre: string;
  total_piezas: number;
  piezas_activas: number;
  piezas_borrador: number;
  created_at: string;
}

export function ProduccionListClient({
  initialProducciones,
}: {
  initialProducciones: ProduccionItem[];
}) {
  const [producciones, setProducciones] = useState(initialProducciones);
  const [pending, startTransition] = useTransition();

  const handleDelete = (categoriaId: string, nombre: string) => {
    if (
      !confirm(
        `¿Estás seguro de eliminar la producción "${nombre}"?\nSe borrarán permanentemente todas las piezas y fotos asociadas a esta colección.`,
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await deleteProduccionCompletaAction(categoriaId);
      if (result.success) {
        setProducciones((prev) => prev.filter((p) => p.id !== categoriaId));
      } else {
        alert(result.error ?? "Error al eliminar la producción");
      }
    });
  };

  if (producciones.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-12 text-center">
        <p className="text-xl">🎨</p>
        <h3 className="mt-2 font-medium">No hay producciones creadas todavía</h3>
        <p className="mt-1 text-xs text-muted">
          Creá tu primera colección para cargar piezas y publicarlas en la tienda.
        </p>
        <Link href="/admin/produccion/nueva" className="mt-4 inline-block">
          <Button>Crear primera producción</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {producciones.map((prod) => (
        <div
          key={prod.id}
          className="flex flex-col justify-between rounded-xl border border-border bg-surface p-5 transition-shadow hover:shadow-md"
        >
          <div>
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-base">{prod.nombre}</h3>
              {prod.piezas_borrador > 0 ? (
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                  {prod.piezas_borrador} en borrador
                </span>
              ) : (
                <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-600 dark:text-green-400">
                  Publicada
                </span>
              )}
            </div>

            <div className="mt-4 space-y-1 text-xs text-muted">
              <p>
                <strong>Total piezas:</strong> {prod.total_piezas}
              </p>
              <p>
                <strong>Piezas visibles en tienda:</strong> {prod.piezas_activas}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-border pt-4">
            <Link href={`/admin/produccion/${prod.id}`}>
              <Button variant="outline">
                ✏️ Gestionar / Editar
              </Button>
            </Link>
            <Button
              variant="ghost"
              onClick={() => handleDelete(prod.id, prod.nombre)}
              disabled={pending}
              className="text-destructive hover:bg-destructive/10"
            >
              🗑️ Eliminar
            </Button>
          </div>

        </div>
      ))}
    </div>
  );
}
