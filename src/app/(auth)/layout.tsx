import Link from "next/link";
import { getConfiguracionSitio } from "@/lib/supabase/queries";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = await getConfiguracionSitio().catch(() => null);
  const logoUrl = config?.logo_url || "/milideas_logo.png";
  const loginImageUrl = config?.login_imagen_url || "/login-art.jpg";

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#FAF7F2]">
      {/* Columna Izquierda: Formulario de Autenticación */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-4 sm:p-8 lg:p-12 min-h-screen">
        {/* Cabecera sutil con logo y volver a tienda */}
        <div className="flex items-center justify-between w-full max-w-md mx-auto mb-4">
          <Link
            href="/"
            className="flex items-center gap-2.5 group transition-transform active:scale-95"
            title="Volver a la tienda"
          >
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-white p-1 ring-1 ring-stone-200 shadow-2xs overflow-hidden flex items-center justify-center shrink-0">
              <img
                src={logoUrl}
                alt="Milideas"
                className="h-full w-full object-contain rounded-full"
              />
            </div>
            <span className="font-serif font-bold text-chocolate text-base tracking-tight group-hover:text-terracota transition-colors">
              Milideas
            </span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-chocolate transition-colors rounded-full px-3 py-1.5 hover:bg-stone-100"
          >
            <span>←</span> Volver a la tienda
          </Link>
        </div>

        {/* Contenedor central del formulario */}
        <div className="w-full max-w-md mx-auto my-auto py-2 sm:py-4">
          {children}
        </div>

        {/* Pie de página discreto */}
        <div className="text-center text-[11px] text-stone-400 py-3">
          © {new Date().getFullYear()} Milideas Arte · Sunchales, Santa Fe 🇦🇷
        </div>
      </div>

      {/* Columna Derecha: Ilustración artística de la marca (Desktop >= lg) */}
      <div className="hidden lg:flex lg:w-1/2 min-h-screen relative p-8 xl:p-12 items-center justify-center bg-[#F5EFEB]/60 border-l border-[#E5E0D8] overflow-hidden">
        <div className="relative w-full h-full max-h-[88vh] rounded-3xl overflow-hidden shadow-xl border border-stone-200/90 group bg-white">
          <img
            src={loginImageUrl}
            alt="Milideas Arte"
            className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
          />
          {/* Overlay gradiente suave inferior para texto artístico */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent flex flex-col justify-end p-8 text-white">
            <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-white/25 backdrop-blur-md px-3.5 py-1 text-xs font-semibold text-white border border-white/30 shadow-xs mb-2">
              ✨ Hecho con amor en el taller
            </span>
            <h3 className="font-serif text-2xl font-bold tracking-tight text-white">
              Cerámica de Autor & Ilustraciones
            </h3>
            <p className="text-xs text-stone-200 font-sans mt-1 max-w-md leading-relaxed">
              Piezas únicas modeladas a mano y obras originales para llenar de calidez cada rincón de tu hogar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
