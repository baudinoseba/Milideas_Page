import { getObrasProyectos } from "@/lib/supabase/queries";
import { ObrasGallery } from "@/components/obras/obras-gallery";

export const metadata = {
  title: "Obras & Proyectos Especiales — Murales, Esculturas y B2B",
  description: "Murales y vidrieras comerciales, esculturas tridimensionales personalizadas de mascotas, packaging y proyectos para gastronomía y hotelería.",
};

export default async function ObrasPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria } = await searchParams;
  const obras = await getObrasProyectos({}).catch(() => []);

  return (
    <div className="space-y-6 pb-16">
      {/* ─── Encabezado de Sección ─── */}
      <div className="border-b border-border/60 pb-5 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🌟</span>
          <div>
            <h1 className="text-2xl sm:text-4xl font-serif font-medium text-chocolate">
              Obras & Proyectos Especiales
            </h1>
            <p className="text-xs sm:text-sm text-barro font-sans max-w-2xl">
              Intervenciones artísticas a gran escala, murales comerciales y residenciales, esculturas personalizadas de mascotas y producciones a medida para marcas y gastronomía.
            </p>
          </div>
        </div>
      </div>

      <ObrasGallery obras={obras} categoriaInicial={categoria} />
    </div>
  );
}
