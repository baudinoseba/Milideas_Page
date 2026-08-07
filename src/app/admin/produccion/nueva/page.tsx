import { getCategorias, getTodosLosProductosCatalog } from "@/lib/supabase/queries";
import { ProduccionWizard } from "@/components/admin/produccion-wizard";

export const metadata = { title: "Admin — Nueva producción" };

export default async function NuevaProduccionPage() {
  const [categorias, productosCatalogo] = await Promise.all([
    getCategorias().catch(() => []),
    getTodosLosProductosCatalog().catch(() => []),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Producción</h1>
        <p className="mt-1 text-sm text-muted">
          Crear una colección completa de piezas paso a paso.
        </p>
      </div>
      <ProduccionWizard
        categorias={categorias}
        productosCatalogo={productosCatalogo}
      />
    </div>
  );
}

