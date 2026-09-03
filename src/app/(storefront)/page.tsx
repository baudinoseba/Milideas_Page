import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product/product-card";
import { FadeIn } from "@/components/ui/fade-in";
import { ObrasCarousel } from "@/components/obras/obras-carousel";
import { getProductos, getObrasProyectos, getConfiguracionSitio } from "@/lib/supabase/queries";

export default async function HomePage() {
  const [config, productosStock, obrasDestacadas] = await Promise.all([
    getConfiguracionSitio().catch(() => null),
    getProductos({}).catch(() => []),
    getObrasProyectos({ soloDestacados: true }).catch(() => []),
  ]);

  const piezasDisponibles = productosStock.filter((p) => (p.stock_disponible ?? 0) > 0).slice(0, 4);

  return (
    <div className="w-full">
      
      {/* ─── 1. HERO / BANNER DE MARCA (100% Full Width Real, Sin Sombreados ni Filtros) ─── */}
      {config?.hero_imagen_url ? (
        <section className="relative w-full overflow-hidden border-b border-border/60 bg-[#FAF7F2] min-h-[260px] sm:min-h-[380px] lg:min-h-[440px] flex flex-col justify-end p-6 sm:p-10 transition-all duration-300">
          <img
            src={config.hero_imagen_url}
            alt="Portada Milideas"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          {/* Sin sombreados oscuros ni efectos: se muestra la ilustración original limpia y nítida */}

          {/* Botones de acción sobre el banner compactos y alineados horizontalmente */}
          <div className="mx-auto w-full max-w-7xl px-2.5 sm:px-6 relative z-10 flex items-center justify-center gap-2 sm:gap-3 pb-2 sm:pb-4">
            <Link href="/ceramica">
              <Button className="rounded-full border border-stone-300/80 bg-white/90 hover:bg-white text-stone-900 hover:text-chocolate px-3.5 sm:px-5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md min-h-8 sm:min-h-9">
                🏺 Piezas de Cerámica
              </Button>
            </Link>
            <Link href="/ilustracion">
              <Button className="rounded-full border border-stone-300/80 bg-white/90 hover:bg-white text-stone-900 hover:text-chocolate px-3.5 sm:px-5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md min-h-8 sm:min-h-9">
                🎨 Obras & Ilustraciones
              </Button>
            </Link>
          </div>
        </section>
      ) : (
        <section className="relative w-full overflow-hidden border-b border-border/60 bg-gradient-to-b from-surface via-arena/30 to-crema-cruda p-8 sm:p-12 text-center shadow-xs">
          <div className="mx-auto max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-terracota/25 bg-surface/90 px-3.5 py-1 text-xs font-semibold text-terracota shadow-xs backdrop-blur-md font-sans">
              <span className="h-2 w-2 rounded-full bg-verde-menta animate-pulse" />
              <span>Estudio de Arte & Cerámica · Sunchales 🇦🇷</span>
            </div>

            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Link href="/ceramica">
                <Button className="rounded-full bg-terracota text-white hover:bg-terracota/90 px-6 py-2.5 text-xs sm:text-sm font-bold shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer">
                  🏺 Piezas de Cerámica
                </Button>
              </Link>
              <Link href="/ilustracion">
                <Button variant="outline" className="rounded-full border-border/80 bg-surface/80 text-chocolate hover:bg-arena px-6 py-2.5 text-xs sm:text-sm font-bold shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer">
                  🎨 Obras & Ilustraciones
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ─── CONTENEDOR CENTRAL DE LA PÁGINA (Stock, Pilares y Obras) ─── */}
      <div className="mx-auto w-full max-w-7xl px-3.5 sm:px-6 py-8 sm:py-12 space-y-10 sm:space-y-14">

        {/* ─── 2. DROP ACTIVO / PIEZAS EN STOCK PARA COMPRA INMEDIATA ─── */}
        {piezasDisponibles.length > 0 && (
        <FadeIn>
          <section className="space-y-5">
            <div className="flex flex-col items-center text-center gap-1 border-b border-border/60 pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-barro font-sans flex items-center justify-center gap-1.5">
                <span className="text-terracota">✨</span> Lanzamiento Actual
              </span>
              <h2 className="text-xl sm:text-2xl font-medium text-chocolate font-serif">
                Piezas listas en Stock
              </h2>
              <p className="text-xs text-barro font-sans">
                Producción en pequeños lotes con entrega inmediata.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">
              {piezasDisponibles.map((producto, idx) => (
                <ProductCard key={producto.id} producto={producto} priority={idx === 0} />
              ))}
            </div>

            {/* Botón horizontal llamativo para explorar todo el stock */}
            <div className="pt-1 sm:pt-2 flex justify-center">
              <Link href="/ceramica/stock" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto rounded-full border-terracota/35 bg-surface/90 text-chocolate hover:bg-terracota hover:text-white px-6 sm:px-8 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold shadow-xs transition-all hover:scale-[1.02] active:scale-98 flex items-center justify-center gap-2 font-sans cursor-pointer group"
                >
                  <span>✨ Ver todo el Stock disponible</span>
                  <span className="group-hover:translate-x-1 transition-transform font-bold">→</span>
                </Button>
              </Link>
            </div>
          </section>
        </FadeIn>
      )}

      {/* ─── 3. LOS 2 PILARES CREATIVOS (CERÁMICA & ILUSTRACIÓN - EMOJIS EN LÍNEA) ─── */}
      <FadeIn delay={100}>
        <section className="grid gap-4 sm:grid-cols-2 sm:gap-5">
          {/* Pilar 1: Cerámica */}
          <div className="group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border/60 bg-gradient-to-br from-surface to-arena/40 p-5 sm:p-6 transition-all hover:shadow-md hover:border-terracota/40 flex flex-col justify-between space-y-4">
            <div className="space-y-2.5">
              <h3 className="text-lg sm:text-xl font-serif font-medium text-chocolate text-center flex items-center justify-center gap-2">
                <span className="text-2xl">🏺</span>
                <span>Cerámica de Autor</span>
              </h3>
              <p className="text-xs sm:text-sm text-barro font-sans leading-relaxed">
                Mates, cuencos, tazas, tazones, bandejas, floreros, veladores y mucho más. La pieza que más te guste, te la hago a pedido.
              </p>
              <ul className="text-xs text-muted space-y-1 pt-0.5 font-sans">
                <li>✦ Más de 40 formatos físicos disponibles</li>
                <li>✦ Diseños a elección de mi portfolio o Instagram</li>
                <li>✦ Tiempos de producción artesanal: ~30 días</li>
              </ul>
            </div>
            <div className="pt-2">
              <Link href="/ceramica/catalogo">
                <Button className="w-full sm:w-auto rounded-full bg-chocolate text-crema-cruda hover:bg-chocolate/90 text-xs font-semibold px-5 py-2 shadow-xs">
                  Ver Formatos & Encargar →
                </Button>
              </Link>
            </div>
          </div>

          {/* Pilar 2: Ilustración */}
          <div className="group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border/60 bg-gradient-to-br from-surface to-rosa-buho/15 p-5 sm:p-6 transition-all hover:shadow-md hover:border-rosa-buho/50 flex flex-col justify-between space-y-4">
            <div className="space-y-2.5">
              <h3 className="text-lg sm:text-xl font-serif font-medium text-chocolate text-center flex items-center justify-center gap-2">
                <span className="text-2xl">🎨</span>
                <span>Ilustración de Autor</span>
              </h3>
              <p className="text-xs sm:text-sm text-barro font-sans leading-relaxed">
                Pinturas y dibujos originales sobre papel acuarela de alta calidad, obras únicas enmarcadas.
              </p>
              <ul className="text-xs text-muted space-y-1 pt-0.5 font-sans">
                <li>✦ Diferentes tamaños y formatos</li>
                <li>✦ Enmarcadas artesanalmente listas para colgar</li>
                <li>✦ Diseños originales y personalizados pintados a mano</li>
              </ul>
            </div>
            <div className="pt-2">
              <Link href="/ilustracion/catalogo">
                <Button className="w-full sm:w-auto rounded-full bg-chocolate text-crema-cruda hover:bg-chocolate/90 text-xs font-semibold px-5 py-2 shadow-xs">
                  Explorar Ilustraciones →
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </FadeIn>

      {/* ─── 4. OBRAS & PROYECTOS ESPECIALES (Un Solo Contenedor Destacado con Slider y Zoom) ─── */}
      <FadeIn delay={150}>
        <ObrasCarousel obras={obrasDestacadas} />
      </FadeIn>

      </div>
    </div>
  );
}
