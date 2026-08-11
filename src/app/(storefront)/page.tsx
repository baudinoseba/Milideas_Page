import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product/product-card";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { FadeIn } from "@/components/ui/fade-in";
import { getHeroProductos, getConfiguracionSitio, getProductos } from "@/lib/supabase/queries";

function IconSparkles() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
    </svg>
  );
}

function IconPalette() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.92 0 1.67-.75 1.67-1.67 0-.42-.16-.8-.44-1.08-.27-.28-.44-.68-.44-1.1 0-.92.75-1.67 1.67-1.67H16c3.3 0 6-2.7 6-6 0-4.97-4.48-9-10-9z" />
    </svg>
  );
}

function IconShieldHeart() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
    </svg>
  );
}

export default async function HomePage() {
  const config = await getConfiguracionSitio().catch(() => ({
    id: "default",
    logo_url: null,
    hero_titulo: "Piezas únicas, hechas a mano.",
    hero_subtitulo: "Cerámica de autor en ediciones limitadas. Cada lanzamiento es único y las piezas se agotan rápidamente.",
    hero_imagen_url: null,
    coleccion_destacada_id: null,
  }));

  const heroItems = await getHeroProductos(config.coleccion_destacada_id).catch(() => []);

  let colecciones = config.coleccion_destacada_id
    ? await getProductos({ categoriaId: config.coleccion_destacada_id }).catch(() => [])
    : [];

  if (colecciones.length === 0) {
    colecciones = heroItems.length > 0 ? heroItems : await getProductos({}).catch(() => []);
  }

  const featuredProduct = heroItems[0] ?? colecciones[0];
  const nombreColeccion = featuredProduct?.producciones?.nombre ?? featuredProduct?.categorias?.nombre ?? "Colección Destacada";

  return (
    <div className="space-y-12 sm:space-y-16 pb-16 w-full max-w-full overflow-hidden">
      {/* Hero Section — Compact, Dynamic Mobile Proportions */}
      {heroItems.length > 0 ? (
        <section className="relative w-full max-w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-border/40 bg-surface/30 p-4 sm:p-8 lg:p-10 transition-colors duration-300">
          {config.hero_imagen_url && (
            <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
              <img src={config.hero_imagen_url} alt="" className="h-full w-full object-cover" />
            </div>
          )}
          <div className="relative z-10 grid gap-5 sm:gap-8 lg:grid-cols-12 lg:items-center">
            {/* Left Column — Compact Narrative Intro */}
            <div className="space-y-3 sm:space-y-5 lg:col-span-7">
              <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-terracota/20 bg-surface/80 px-3 py-1 shadow-sm backdrop-blur-md overflow-hidden">
                <span className="h-2 w-2 shrink-0 rounded-full bg-verde-menta animate-pulse" />
                <span className="font-handwritten text-sm sm:text-xl text-terracota truncate">
                  ✨ {nombreColeccion}
                </span>
              </div>
              <h1 className="text-xl sm:text-4xl lg:text-[3.5rem] font-medium tracking-tight text-chocolate font-serif leading-[1.15] break-words">
                Cerámica que te devuelve la sonrisa.
              </h1>
              <p className="max-w-xl text-xs sm:text-base leading-relaxed text-barro font-sans break-words">
                {config.hero_subtitulo}
              </p>
              <div className="pt-1">
                <a href="#lanzamiento">
                  <Button className="w-full sm:w-auto px-6 py-2.5 text-xs sm:text-base font-semibold rounded-full bg-terracota text-white hover:bg-terracota/90 transition-all shadow-md hover:-translate-y-0.5 hover:shadow-lg font-sans">
                    Descubrir el Lanzamiento ↓
                  </Button>
                </a>
              </div>
            </div>

            {/* Right Column — Compact Image Showcase */}
            <div className="w-full max-w-full overflow-hidden lg:col-span-5">
              <HeroCarousel items={heroItems} />
            </div>
          </div>
        </section>
      ) : (
        <section className="space-y-6 py-8 text-center sm:py-20 bg-gradient-to-b from-crema-cruda to-arena/40 rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-border/40">
          <p className="text-xs uppercase tracking-[0.2em] text-barro font-semibold font-sans">
            Cerámica de autor — Sunchales
          </p>
          <h1 className="text-2xl font-medium tracking-tight text-chocolate font-serif sm:text-[3.5rem]">
            Piezas únicas,
            <br />
            <span className="text-terracota font-handwritten text-3xl sm:text-6xl">hechas a mano con amor.</span>
          </h1>
          <p className="mx-auto max-w-md text-barro font-sans text-xs sm:text-sm leading-relaxed">
            Descubrí cerámica ilustrada en ediciones limitadas. Cada lanzamiento es único y las piezas se agotan rápidamente.
          </p>
          <Link href="/catalogo">
            <Button className="bg-terracota text-white hover:bg-terracota/90 rounded-full px-6 py-2.5 text-xs sm:text-base font-semibold">Explorar catálogo</Button>
          </Link>
        </section>
      )}

      {/* ─── Trust Band ─── */}
      <FadeIn>
        <section className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-12 py-3 text-xs sm:text-sm font-sans text-barro/90">
          <span className="flex items-center gap-2">
            <span className="text-terracota text-base">✦</span>
            Esculpido e ilustrado a mano
          </span>
          <span className="hidden sm:block h-4 w-px bg-border/60" />
          <span className="flex items-center gap-2">
            <span className="text-terracota text-base">✦</span>
            Ediciones limitadas
          </span>
          <span className="hidden sm:block h-4 w-px bg-border/60" />
          <span className="flex items-center gap-2">
            <span className="text-terracota text-base">✦</span>
            Embalaje antigolpes garantizado
          </span>
        </section>
      </FadeIn>

      {/* ─── About Mili Section ─── */}
      <FadeIn delay={100}>
        <section className="relative w-full max-w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-border/50 bg-arena/40 p-5 sm:p-10">
          <div className="grid gap-6 lg:grid-cols-12 lg:items-center">
            <div className="space-y-4 lg:col-span-8">
              <span className="text-xs font-semibold uppercase tracking-wider text-barro font-sans">
                La artista detrás del torno
              </span>
              <h2 className="text-2xl font-medium text-chocolate font-serif sm:text-4xl leading-tight">
                "Cada pieza tiene alma propia y provoca una sonrisa."
              </h2>
              <p className="text-xs sm:text-base leading-relaxed text-barro font-sans max-w-2xl">
                Hola, soy Mili Ferrero. Desde mi taller en Sunchales, Santa Fe, produzco objetos de diseño que acompañan y hacen un poquito más linda tu rutina diaria ❤️ haciendo foco en los procesos lentos y el amor por el oficio.
              </p>
              <p className="font-handwritten text-xl sm:text-2xl text-terracota pt-1">
                — Mili Ferrero
              </p>
            </div>
            <div className="lg:col-span-4 flex justify-center">
              <div className="relative rounded-2xl overflow-hidden shadow-lg w-full max-w-xs aspect-[3/4]">
                <img
                  src="/mili-ferrero.jpg"
                  alt="Mili Ferrero con sus piezas de cerámica ilustradas"
                  className="rounded-2xl object-cover w-full h-full object-center"
                />
                <span className="absolute bottom-3 right-3 rounded-full bg-chocolate/85 backdrop-blur-md px-3 py-1 text-[10px] sm:text-[11px] font-medium text-crema-cruda shadow-md font-sans">
                  Mili Ferrero — Sunchales 🇦🇷
                </span>
              </div>
            </div>
          </div>
        </section>
      </FadeIn>

      {/* Collection Grid */}
      {colecciones.length > 0 && (
        <FadeIn delay={150}>
          <section id="lanzamiento" className="scroll-mt-24 space-y-6 w-full max-w-full overflow-hidden">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-border/60 pb-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-barro font-sans">
                  Piezas disponibles del lanzamiento
                </span>
                <h2 className="mt-0.5 text-xl font-medium text-chocolate font-serif sm:text-3xl">
                  {nombreColeccion}
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <Link
                  href="/colecciones"
                  className="inline-flex items-center gap-1.5 rounded-full border border-terracota/30 bg-terracota/10 px-3.5 py-1.5 text-xs font-semibold text-terracota hover:bg-terracota hover:text-white transition-all shadow-xs"
                >
                  <span>✨ Explorar colección completa</span>
                  <span>→</span>
                </Link>
                <Link
                  href="/catalogo"
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold text-chocolate hover:bg-arena/60 transition-all shadow-xs"
                >
                  <span>🏺 Revisar catálogo actual</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-6">
              {colecciones.map((producto) => (
                <ProductCard key={producto.id} producto={producto} />
              ))}
            </div>
          </section>
        </FadeIn>
      )}
    </div>
  );
}
