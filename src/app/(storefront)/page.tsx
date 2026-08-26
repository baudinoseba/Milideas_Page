import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product/product-card";
import { FadeIn } from "@/components/ui/fade-in";
import { getProductos, getObrasProyectos } from "@/lib/supabase/queries";

export default async function HomePage() {
  // 1. Obtener piezas disponibles en stock para el drop destacado
  const productosStock = await getProductos({}).catch(() => []);
  const piezasDisponibles = productosStock.filter((p) => (p.stock_disponible ?? 0) > 0).slice(0, 4);

  // 2. Obtener proyectos y obras destacadas
  const obrasDestacadas = await getObrasProyectos({ soloDestacados: true }).catch(() => []);

  return (
    <div className="space-y-12 sm:space-y-16 pb-16 w-full max-w-full overflow-hidden">
      
      {/* ─── 1. HERO / BANNER DE MARCA (Según boceto de la artista) ─── */}
      <section className="relative w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-border/60 bg-gradient-to-b from-surface via-arena/30 to-crema-cruda p-6 sm:p-12 text-center shadow-xs transition-colors duration-300">
        <div className="mx-auto max-w-2xl space-y-4">
          
          {/* Tag de autor artesanal */}
          <div className="inline-flex items-center gap-2 rounded-full border border-terracota/25 bg-surface/90 px-3.5 py-1 text-xs font-semibold text-terracota shadow-xs backdrop-blur-md font-sans">
            <span className="h-2 w-2 rounded-full bg-verde-menta animate-pulse" />
            <span>Estudio de Arte & Cerámica · Sunchales 🇦🇷</span>
          </div>

          {/* Logotipo ilustrado amplio / Estilo Boceto */}
          <div className="py-2">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-chocolate font-serif flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
              <span>MIL</span>
              <span className="text-terracota font-handwritten text-5xl sm:text-7xl lg:text-8xl transform -rotate-2">
                Ideas
              </span>
              <span className="inline-block text-2xl sm:text-4xl animate-bounce">💡</span>
            </h1>
            <p className="font-handwritten text-2xl sm:text-3xl text-terracota/90 mt-1">
              ~ Objetos de diseño ~
            </p>
          </div>

          <p className="mx-auto max-w-lg text-xs sm:text-sm text-barro leading-relaxed font-sans">
            Piezas únicas moldeadas, esculpidas y pintadas a mano con amor y dedicación. Pequeñas producciones de autor que transforman tus momentos.
          </p>

          {/* Botones de acción rápida mobile-first */}
          <div className="flex flex-wrap justify-center gap-2.5 pt-2">
            <Link href="/ceramica">
              <Button className="rounded-full bg-terracota text-white hover:bg-terracota/90 px-5 py-2 text-xs sm:text-sm font-semibold shadow-sm transition-all hover:scale-105 active:scale-95">
                🏺 Catálogo de Cerámica
              </Button>
            </Link>
            <Link href="/ilustracion">
              <Button variant="outline" className="rounded-full border-border/80 bg-surface/80 text-chocolate hover:bg-arena px-5 py-2 text-xs sm:text-sm font-semibold shadow-xs transition-all hover:scale-105 active:scale-95">
                🎨 Ilustraciones & Prints
              </Button>
            </Link>
          </div>

        </div>
      </section>

      {/* ─── 2. DROP ACTIVO / PIEZAS EN STOCK PARA COMPRA INMEDIATA ─── */}
      {piezasDisponibles.length > 0 && (
        <FadeIn>
          <section className="space-y-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between border-b border-border/60 pb-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-barro font-sans flex items-center gap-1.5">
                  <span className="text-terracota">✨</span> Lanzamiento Actual
                </span>
                <h2 className="text-xl sm:text-3xl font-medium text-chocolate font-serif">
                  Piezas listas en Stock
                </h2>
                <p className="text-xs text-barro font-sans mt-0.5">
                  Producción en pequeños lotes con entrega inmediata.
                </p>
              </div>

              <Link
                href="/ceramica"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-terracota hover:text-chocolate transition-colors font-sans"
              >
                <span>Ver todas las piezas disponibles</span>
                <span>→</span>
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">
              {piezasDisponibles.map((producto, idx) => (
                <ProductCard key={producto.id} producto={producto} priority={idx === 0} />
              ))}
            </div>
          </section>
        </FadeIn>
      )}

      {/* ─── 3. LOS 2 PILARES CREATIVOS (CERÁMICA & ILUSTRACIÓN) ─── */}
      <FadeIn delay={100}>
        <section className="grid gap-4 sm:grid-cols-2 sm:gap-6">
          {/* Pilar 1: Cerámica */}
          <div className="group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border/60 bg-gradient-to-br from-surface to-arena/40 p-6 sm:p-8 transition-all hover:shadow-md hover:border-terracota/40 flex flex-col justify-between">
            <div className="space-y-3">
              <span className="text-3xl sm:text-4xl">🏺</span>
              <h3 className="text-xl sm:text-2xl font-serif font-medium text-chocolate">
                Cerámica de Autor
              </h3>
              <p className="text-xs sm:text-sm text-barro font-sans leading-relaxed">
                Mates, cuencos, tazas XXL, bandejas, floreros y vajilla a pedido. Elegí el formato que más te guste del catálogo y personalizalo con tu diseño favorito.
              </p>
              <ul className="text-xs text-muted space-y-1 pt-1 font-sans">
                <li>✦ 45 formatos físicos disponibles</li>
                <li>✦ Diseños a elección de nuestro portfolio o Instagram</li>
                <li>✦ Tiempos de producción artesanal: ~30 días</li>
              </ul>
            </div>
            <div className="pt-5">
              <Link href="/ceramica">
                <Button className="w-full sm:w-auto rounded-full bg-chocolate text-crema-cruda hover:bg-chocolate/90 text-xs font-semibold px-5 py-2 shadow-xs">
                  Ver Formatos & Encargar →
                </Button>
              </Link>
            </div>
          </div>

          {/* Pilar 2: Ilustración */}
          <div className="group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border/60 bg-gradient-to-br from-surface to-rosa-buho/15 p-6 sm:p-8 transition-all hover:shadow-md hover:border-rosa-buho/50 flex flex-col justify-between">
            <div className="space-y-3">
              <span className="text-3xl sm:text-4xl">🎨</span>
              <h3 className="text-xl sm:text-2xl font-serif font-medium text-chocolate">
                Ilustración & Prints
              </h3>
              <p className="text-xs sm:text-sm text-barro font-sans leading-relaxed">
                Láminas sobre papel texturado de alta calidad, cuadros enmarcados artesanalmente y stickers coleccionables con el universo botánico y animal de Mili.
              </p>
              <ul className="text-xs text-muted space-y-1 pt-1 font-sans">
                <li>✦ Tamaños A4, A3 y Gran Formato</li>
                <li>✦ Opcional marco de madera listo para colgar</li>
                <li>✦ Diseños originales impresos con pigmentos finos</li>
              </ul>
            </div>
            <div className="pt-5">
              <Link href="/ilustracion">
                <Button className="w-full sm:w-auto rounded-full bg-chocolate text-crema-cruda hover:bg-chocolate/90 text-xs font-semibold px-5 py-2 shadow-xs">
                  Explorar Ilustraciones →
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </FadeIn>

      {/* ─── 4. LA ARTISTA DETRÁS DE CADA CREACIÓN (Mili Ferrero) ─── */}
      <FadeIn delay={150}>
        <section className="relative w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-border/60 bg-gradient-to-r from-arena/50 via-surface to-arena/30 p-6 sm:p-10 shadow-xs">
          <div className="grid gap-6 lg:grid-cols-12 lg:items-center">
            
            <div className="space-y-3 sm:space-y-4 lg:col-span-8">
              <span className="text-xs font-semibold uppercase tracking-wider text-barro font-sans flex items-center gap-1.5">
                <span className="text-terracota">♥</span> Identidad & Taller
              </span>
              
              <h2 className="text-2xl sm:text-3xl font-serif font-medium text-chocolate leading-tight">
                La artista detrás de cada creación
              </h2>
              
              <blockquote className="font-handwritten text-xl sm:text-2xl text-terracota italic">
                &quot;Cada pieza tiene alma propia y provoca una sonrisa.&quot;
              </blockquote>

              <p className="text-xs sm:text-sm text-barro font-sans leading-relaxed max-w-xl">
                Hola, soy Mili Ferrero. Desde mi taller en Sunchales, Santa Fe, doy vida a objetos de diseño y piezas de arte únicas. Cada taza, mural o escultura nace de un proceso lento, respetuoso del material y lleno de calidez para acompañarte en tu día a día.
              </p>

              <div className="pt-2 flex items-center gap-3">
                <a
                  href="https://instagram.com/milideas_arte"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-terracota hover:text-chocolate transition-colors font-sans"
                >
                  <span>Seguir el proceso en Instagram @milideas_arte</span>
                  <span className="text-xs">↗</span>
                </a>
              </div>
            </div>

            <div className="lg:col-span-4 flex justify-center">
              <div className="relative rounded-2xl overflow-hidden shadow-md w-full max-w-[240px] sm:max-w-xs aspect-[3/4] border border-border/60">
                <img
                  src="/mili-ferrero.jpg"
                  alt="Mili Ferrero en el taller"
                  loading="eager"
                  className="rounded-2xl object-cover w-full h-full object-center"
                />
                <span className="absolute bottom-2.5 right-2.5 rounded-full bg-chocolate/90 backdrop-blur-md px-3 py-1 text-[10px] sm:text-[11px] font-medium text-crema-cruda shadow-md font-sans">
                  Mili Ferrero · Sunchales 🇦🇷
                </span>
              </div>
            </div>

          </div>
        </section>
      </FadeIn>

      {/* ─── 5. OBRAS & PROYECTOS ESPECIALES (Murales, Esculturas Mascotas, B2B) ─── */}
      <FadeIn delay={200}>
        <section className="space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between border-b border-border/60 pb-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-barro font-sans flex items-center gap-1.5">
                <span className="text-terracota">🌟</span> Arte a Gran Escala & Pedidos Únicos
              </span>
              <h2 className="text-xl sm:text-3xl font-medium text-chocolate font-serif">
                Obras & Proyectos Especiales
              </h2>
              <p className="text-xs text-barro font-sans mt-0.5">
                Murales, vidrieras comerciales, esculturas de mascotas personalizadas y vajilla para restaurantes.
              </p>
            </div>

            <Link
              href="/obras"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-terracota hover:text-chocolate transition-colors font-sans"
            >
              <span>Ver todas las obras</span>
              <span>→</span>
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {obrasDestacadas.map((obra) => (
              <div
                key={obra.id}
                className="group rounded-2xl border border-border/60 bg-surface p-4 shadow-xs transition-all hover:shadow-md hover:border-terracota/40 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-terracota font-semibold uppercase tracking-wider">
                    <span>
                      {obra.categoria === "murales" && "🖌️ Mural & Vidriera"}
                      {obra.categoria === "esculturas" && "🐾 Escultura 3D"}
                      {obra.categoria === "gran_dimension_b2b" && "🍽️ Gastronomía / B2B"}
                      {obra.categoria === "ilustraciones" && "🎨 Ilustración"}
                      {obra.categoria === "miniaturas" && "✨ Miniatura"}
                    </span>
                    {obra.cliente_lugar && (
                      <span className="text-muted truncate max-w-[120px]">{obra.cliente_lugar}</span>
                    )}
                  </div>

                  <h4 className="text-base font-serif font-medium text-chocolate group-hover:text-terracota transition-colors">
                    {obra.titulo}
                  </h4>

                  {obra.subtitulo && (
                    <p className="text-xs text-barro font-sans line-clamp-2">
                      {obra.subtitulo}
                    </p>
                  )}
                </div>

                <a
                  href={`https://wa.me/5493493668308?text=${encodeURIComponent(`¡Hola Mili! Vi el proyecto "${obra.titulo}" en tu web y me gustaría cotizar una propuesta similar.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-secondary/30 px-3.5 py-1.5 text-xs font-medium text-chocolate hover:bg-terracota hover:text-white transition-all shadow-2xs w-full text-center"
                >
                  <span>Cotizar por WhatsApp</span>
                  <span>↗</span>
                </a>
              </div>
            ))}
          </div>
        </section>
      </FadeIn>

    </div>
  );
}
