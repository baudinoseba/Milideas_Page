import Link from "next/link";
import {
  getConfiguracionSitio,
  getCategorias,
  getProduccionesCompletas,
} from "@/lib/supabase/queries";
import { PersonalizacionForm } from "@/components/admin/personalizacion-form";

export const metadata = { title: "Admin — Personalización de Portada y Sitio" };

export default async function PersonalizacionPage() {
  const [config, categorias, producciones] = await Promise.all([
    getConfiguracionSitio(),
    getCategorias().catch(() => []),
    getProduccionesCompletas().catch(() => []),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-serif font-bold text-chocolate">🎨 Personalización de Portada & Marca</h1>
          <p className="mt-1 text-sm text-muted">
            Configurá el logo, la imagen de fondo, el título principal y la colección destacada de la Home.
          </p>
        </div>

        <Link
          href="/admin/disponibilidad"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#FAF7F2] border border-[#E5E0D8] text-chocolate hover:bg-amber-50 hover:border-amber-300 transition-all self-start sm:self-auto shrink-0 shadow-2xs"
        >
          <span>⏱️</span>
          <span>Ver Disponibilidad & Cupos →</span>
        </Link>
      </div>

      <PersonalizacionForm
        config={config}
        categorias={categorias}
        producciones={producciones}
      />
    </div>
  );
}

