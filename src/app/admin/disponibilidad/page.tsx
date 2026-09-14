import Link from "next/link";
import {
  getConfiguracionSitio,
  getEstadisticasDisponibilidad,
} from "@/lib/supabase/queries";
import { AdminDisponibilidadControl } from "@/components/admin/admin-disponibilidad-control";

export const metadata = { title: "Disponibilidad & Cupos Mensuales · Admin" };

export default async function DisponibilidadPage() {
  const [config, estadisticas] = await Promise.all([
    getConfiguracionSitio(),
    getEstadisticasDisponibilidad().catch(() => undefined),
  ]);

  return (
    <div className="space-y-6">
      {/* Cabecera de la sección */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
            <Link href="/admin" className="hover:text-chocolate transition-colors">
              Admin
            </Link>
            <span>/</span>
            <span className="text-stone-800 font-medium">Disponibilidad & Cupos</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-chocolate flex items-center gap-2">
            <span>⏱️</span>
            <span>Disponibilidad & Cupos Mensuales</span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted">
            Gestioná los interruptores de stock y la capacidad mensual de producción artesanal unificada de tu taller.
          </p>
        </div>
      </div>

      {config && (
        <AdminDisponibilidadControl
          config={config}
          estadisticas={estadisticas}
        />
      )}
    </div>
  );
}
