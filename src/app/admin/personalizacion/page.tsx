import { getConfiguracionSitio, getCategorias, getProduccionesCompletas } from "@/lib/supabase/queries";
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
      <div>
        <h1 className="text-2xl font-semibold">🎨 Personalización de la Portada</h1>
        <p className="mt-1 text-sm text-muted">
          Controlá el logo de tu tienda, la imagen de fondo, el título principal y la colección elegida para la Home.
        </p>
      </div>

      <PersonalizacionForm
        config={config}
        categorias={categorias}
        producciones={producciones}
      />
    </div>
  );
}

