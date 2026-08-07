import { notFound } from "next/navigation";
import {
  getCategorias,
  getProduccionById,
  getTodasLasPiezasProduccion,
  getTodosLosProductosCatalog,
} from "@/lib/supabase/queries";
import { ProduccionWizard } from "@/components/admin/produccion-wizard";

export const metadata = { title: "Admin — Gestionar producción" };

interface PageProps {
  params: Promise<{
    categoriaId: string;
  }>;
}

export default async function ResumeProduccionPage({ params }: PageProps) {
  const { categoriaId: produccionId } = await params;
  const [categorias, produccion, productosCatalogo] = await Promise.all([
    getCategorias().catch(() => []),
    getProduccionById(produccionId).catch(() => null),
    getTodosLosProductosCatalog().catch(() => []),
  ]);

  if (!produccion) {
    notFound();
  }

  const piezasExistentes = await getTodasLasPiezasProduccion(produccionId).catch(() => []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Producción</h1>
        <p className="mt-1 text-sm text-muted">
          Gestionar la colección <strong>{produccion.nombre}</strong>.
        </p>
      </div>
      <ProduccionWizard
        categorias={categorias}
        categoriaId={produccionId}
        categoriaNombre={produccion.nombre}
        piezasExistentes={piezasExistentes}
        productosCatalogo={productosCatalogo}
      />
    </div>
  );
}


