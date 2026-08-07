import Link from "next/link";
import { getProduccionesCompletas } from "@/lib/supabase/queries";
import { Button } from "@/components/ui/button";
import { ProduccionListClient } from "@/components/admin/produccion-list-client";

export const metadata = { title: "Admin — Gestión de Producciones" };

export default async function ProduccionesPage() {
  const producciones = await getProduccionesCompletas();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">🎬 Producciones y Colecciones</h1>
          <p className="mt-1 text-sm text-muted">
            Administrá todas las colecciones, editá sus piezas, agregá nuevos productos o eliminalas.
          </p>
        </div>
        <Link href="/admin/produccion/nueva">
          <Button>+ Nueva Producción</Button>
        </Link>
      </div>

      <ProduccionListClient initialProducciones={producciones} />
    </div>
  );
}
