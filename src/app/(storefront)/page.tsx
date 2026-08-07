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

const VALUE_PROPS = [
  {
    icon: IconSparkles,
    title: "Esculpido & Ilustrado a mano",
    description: "Cada pieza pasa por el torno, moldeado tridimensional y pintura libre en Sunchales.",
  },
  {
    icon: IconPalette,
    title: "Ediciones limitadas",
    description: "Lanzamientos de piezas únicas con unidades muy reducidas.",
  },
  {
    icon: IconShieldHeart,
    title: "Embalaje antigolpes garantizado",
    description: "Envíos protegidos a todo el país para que tu pieza llegue lista para ser disfrutada.",
  },
] as const;

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
    <div className="space-y-20 pb-16">
      {/* Hero Section — Open Gallery Stage (Sin Caja dentro de Caja) */}
      {heroItems.length > 0 ? (
        <section className="relative overflow-hidden rounded-3xl border border-border/40 bg-surface/30 p-6 sm:p-10 lg:p-12 transition-colors duration-300">
          {config.hero_imagen_url && (
            <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
              <img src={config.hero_imagen_url} alt="" className="h-full w-full object-cover" />
            </div>
          )}
          <div className="relative z-10 grid gap-8 lg:grid-cols-12 lg:items-center">
            {/* Left Column — Narrative Intro (60% Ancho Editorial) */}
            <div className="space-y-6 lg:col-span-7">
              <div className="inline-flex items-center gap-2.5 rounded-full border border-terracota/20 bg-surface/80 px-4 py-1.5 shadow-sm backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-verde-menta animate-pulse" />
                <span className="font-handwritten text-lg sm:text-xl text-terracota">
                  ✨ {nombreColeccion}
                </span>
              </div>
              <h1 className="text-4xl font-medium tracking-tight text-chocolate font-serif sm:text-5xl lg:text-[4rem] leading-[1.08]">
                Cerámica que te devuelve la sonrisa.
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-barro font-sans">
                {config.hero_subtitulo}
              </p>
              <div className="pt-2">
                <a href="#lanzamiento">
                  <Button className="w-full sm:w-auto px-9 py-4 text-base font-semibold rounded-full bg-terracota text-white hover:bg-terracota/90 transition-all shadow-md hover:-translate-y-1 hover:shadow-lg font-sans">
                    Descubrir el Lanzamiento ↓
                  </Button>
                </a>
              </div>
            </div>

            {/* Right Column — Editorial Vertical Portrait Showcase (40% Ancho) */}
            <div className="w-full lg:col-span-5">
              <HeroCarousel items={heroItems} />
            </div>
          </div>
        </section>

      ) : (
        <section className="space-y-6 py-12 text-center sm:py-24 bg-gradient-to-b from-crema-cruda to-arena/40 rounded-3xl p-8 border border-border/40">
          <p className="text-xs uppercase tracking-[0.2em] text-barro font-semibold font-sans">
            Cerámica de autor — Sunchales
          </p>
          <h1 className="text-4xl font-medium tracking-tight text-chocolate font-serif sm:text-[3.5rem]">
            Piezas únicas,
            <br />
            <span className="text-terracota font-handwritten text-4xl sm:text-6xl">hechas a mano con amor.</span>
          </h1>
          <p className="mx-auto max-w-md text-barro font-sans text-sm leading-relaxed">
            Descubrí cerámica ilustrada en ediciones limitadas. Cada lanzamiento es único y las piezas se agotan rápidamente.
          </p>
          <Link href="/catalogo">
            <Button className="bg-terracota text-white hover:bg-terracota/90 rounded-full px-8 py-3 font-semibold">Explorar catálogo</Button>
          </Link>
        </section>
      )}

      {/* ─── Trust Band — Editorial horizontal, sin tarjetas genéricas ─── */}
      <FadeIn>
      <section className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 py-6 text-sm font-sans text-barro/90">
        <span className="flex items-center gap-2.5">
          <span className="text-terracota text-lg">✦</span>
          Esculpido e ilustrado a mano
        </span>
        <span className="hidden sm:block h-4 w-px bg-border/60" />
        <span className="flex items-center gap-2.5">
          <span className="text-terracota text-lg">✦</span>
          Ediciones limitadas
        </span>
        <span className="hidden sm:block h-4 w-px bg-border/60" />
        <span className="flex items-center gap-2.5">
          <span className="text-terracota text-lg">✦</span>
          Embalaje antigolpes garantizado
        </span>
      </section>
      </FadeIn>

      {/* ─── About Mili Section — Cita diferenciada del bio ─── */}
      <FadeIn delay={100}>
      <section className="relative overflow-hidden rounded-3xl border border-border/50 bg-arena/40 p-8 sm:p-12">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
          <div className="space-y-5 lg:col-span-8">
            <span className="text-xs font-semibold uppercase tracking-wider text-barro font-sans">
              La artista detrás del torno
            </span>
            <h2 className="text-3xl font-medium text-chocolate font-serif sm:text-4xl leading-tight">
              "Cada pieza tiene alma propia y provoca una sonrisa."
            </h2>
            <p className="text-sm sm:text-base leading-relaxed text-barro font-sans max-w-2xl">
              Hola, soy Mili Ferrero. Desde mi taller en Sunchales, Santa Fe, produzco objetos de diseño que acompañan y hacen un poquito más linda tu rutina diaria ❤️ haciendo foco en los procesos lentos y el amor por el oficio.
            </p>
            <p className="font-handwritten text-2xl text-terracota pt-1">
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
              <span className="absolute bottom-3 right-3 rounded-full bg-chocolate/85 backdrop-blur-md px-3.5 py-1 text-[11px] font-medium text-crema-cruda shadow-md font-sans">
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
        <section id="lanzamiento" className="scroll-mt-24 space-y-8">
          <div className="flex items-end justify-between border-b border-border/60 pb-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-barro font-sans">
                Piezas disponibles de la colección
              </span>
              <h2 className="mt-1 text-2xl font-medium text-chocolate font-serif sm:text-3xl">
                {nombreColeccion}
              </h2>
            </div>
            <Link
              href="/colecciones"
              className="text-sm font-semibold text-terracota transition-colors hover:text-chocolate inline-flex items-center gap-1 font-sans"
            >
              <span>Ver todas las colecciones</span>
              <span>→</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6">
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


