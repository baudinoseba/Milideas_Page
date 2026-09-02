import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/fade-in";
import { FaqAccordion } from "@/components/faq/faq-accordion";
import { getConfiguracionSitio } from "@/lib/supabase/queries";

export const metadata = {
  title: "Sobre Mí & Preguntas Frecuentes — Milideas Estudio de Arte",
  description:
    "Conocé a Mili Ferrero, el proceso artesanal detrás de cada pieza de cerámica y pintura original, y respuestas a las preguntas más frecuentes sobre envíos, pagos y cuidados.",
};

const FAQ_ITEMS = [
  {
    categoria: "💳 Formas de Pago",
    pregunta: "¿Cuáles son las formas de pago disponibles?",
    respuesta:
      "Acepto Transferencia Bancaria (con los datos de cuenta al confirmar tu pedido) y Efectivo si retirás personalmente por mi taller en Sunchales. Por el momento no trabajo con tarjetas de débito ni crédito. Si abonás por transferencia bancaria, podés adjuntar el comprobante en la web o enviármelo por WhatsApp para coordinar la entrega de tu pedido.",
  },
  {
    categoria: "📦 Envíos y Embalaje",
    pregunta: "¿Cómo se envían las piezas y a qué lugares llegan?",
    respuesta:
      "Hago envíos seguros a toda la República Argentina. El servicio habitual y principal de logística es Vía Cargo (tanto a sucursal como a domicilio). En caso de que en tu localidad no cuentes con sucursal de Vía Cargo, coordinamos juntas/os otro servicio de encomienda confiable de común acuerdo. Cada pieza de cerámica y cuadro se embala individualmente con varias capas de protección acolchada y cajas reforzadas para garantizar que viaje 100% protegida y llegue en perfectas condiciones.",
  },
  {
    categoria: "⏱️ Tiempos de Entrega",
    pregunta: "¿Cuánto demora en llegar mi pedido?",
    respuesta:
      "• Piezas en Stock: Están listas para retirar en el momento por el taller o se despachan durante la semana una vez confirmado el pedido. El correo demora habitualmente entre 3 y 7 días hábiles según tu localidad.\n• Encargos personalizados: Tienen un tiempo de producción artesanal de aproximadamente 30 días, ya que involucran modelado manual, secado pausado, primera quema en bizcocho cerámico, esmaltado, pintado a mano y horneado final a 1080°C.",
  },
  {
    categoria: "🏺 Cuidados de Cerámica",
    pregunta: "¿Las piezas de cerámica son aptas para microondas y lavavajillas?",
    respuesta:
      "¡Sí! Todas mis piezas de cerámica están esmaltadas con materiales de calidad artística libres de plomo y 100% seguros para alimentos y bebidas. Son aptas para microondas y se pueden lavar tanto a mano como en lavavajillas. Para prolongar el brillo y la vida útil del esmalte artesanal a lo largo de los años, recomiendo evitar cambios bruscos extremos de temperatura (choques térmicos).",
  },
  {
    categoria: "🎨 Ilustraciones y Cuadros",
    pregunta: "¿Cómo son las obras e ilustraciones?",
    respuesta:
      "No trabajo con impresiones ni reproducciones en serie. Todas las obras, dibujos y pinturas son piezas originales realizadas a mano sobre papel acuarela de alto gramaje y calidad artística. También ofrezco la opción de entregarlas enmarcadas artesanalmente en madera natural de primera calidad, listas para colgar y transformar tus espacios.",
  },
  {
    categoria: "🔄 Cambios y Garantía",
    pregunta: "¿Qué pasa si un producto sufre algún daño durante el transporte?",
    respuesta:
      "Cuido el embalaje al máximo nivel para que nada sufra daños. No obstante, si al recibir tu paquete notas cualquier inconveniente, escribime por WhatsApp o mail adjuntando fotos del paquete para que pueda evaluar la situación de inmediato y brindarte una reposición o solución satisfactoria.",
  },
];

const DEFAULT_TEXTO = `¡Hola! Soy Mili Ferrero. Desde mi taller en Sunchales, Santa Fe, doy vida a objetos de diseño, cerámica artesanal y obras pictóricas originales.

Cada taza, escultura, mural o dibujo nace de un proceso pausado y respetuoso de los tiempos del material: modelado a mano, secado natural, horneadas a 1080°C y pinceladas llenas de calidez botánica y animal.

Creo en el valor de lo auténtico: piezas que no salen de una máquina, sino de manos dedicadas a transformar tus momentos cotidianos en pequeños rituales de disfrute.`;

export default async function SobreMiPage() {
  const config = await getConfiguracionSitio().catch(() => null);

  const titulo = config?.sobre_mi_titulo || "Mili Ferrero";
  const frase = config?.sobre_mi_frase || "Cada pieza tiene alma propia y provoca una sonrisa.";
  const textoBio = config?.sobre_mi_texto || DEFAULT_TEXTO;
  const parrafos = textoBio.split(/\n+/).filter(Boolean);

  const fotoUrl = config?.sobre_mi_foto_url || "/mili-ferrero.jpg";
  const fotoFit = (config?.sobre_mi_foto_fit as any) || "cover";
  const fotoPosX = config?.sobre_mi_foto_pos_x ?? 50;
  const fotoPosY = config?.sobre_mi_foto_pos_y ?? 50;
  const fotoZoom = config?.sobre_mi_foto_zoom ?? 100;

  return (
    <div className="space-y-12 sm:space-y-16 pb-16">
      
      {/* ─── 1. HISTORIA DE LA ARTISTA (Mili Ferrero) ─── */}
      <FadeIn>
        <section className="relative w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-border/60 bg-gradient-to-r from-arena/40 via-surface to-arena/20 p-6 sm:p-12 shadow-xs">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            
            <div className="space-y-4 lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-terracota/25 bg-surface/90 px-3.5 py-1 text-xs font-semibold text-terracota shadow-xs backdrop-blur-md font-sans">
                <span className="h-2 w-2 rounded-full bg-verde-menta animate-pulse" />
                <span>Estudio de Arte & Cerámica · Sunchales, Santa Fe 🇦🇷</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-serif font-medium text-chocolate leading-tight">
                {titulo}
              </h1>

              <blockquote className="font-handwritten text-2xl sm:text-3xl text-terracota italic">
                &quot;{frase}&quot;
              </blockquote>

              <div className="space-y-3 text-xs sm:text-sm text-barro font-sans leading-relaxed">
                {parrafos.map((p, idx) => (
                  <p key={idx}>{p}</p>
                ))}
              </div>

              <div className="pt-3 flex flex-wrap items-center gap-3">
                <a
                  href="https://instagram.com/milideas_arte"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-chocolate text-crema-cruda px-5 py-2.5 text-xs font-semibold hover:bg-chocolate/90 transition-all shadow-xs"
                >
                  <span>Seguir proceso en Instagram @milideas_arte</span>
                  <span className="text-xs">↗</span>
                </a>

                <a
                  href={`https://wa.me/${config?.vendedor_whatsapp || "5493493668308"}?text=Hola%20Mili!%20Te%20escribo%20desde%20la%20secci%C3%B3n%20Sobre%20M%C3%AD%20de%20tu%20web.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2.5 text-xs font-semibold text-chocolate hover:bg-secondary/40 transition-all shadow-2xs"
                >
                  <span>💬 Contactar por WhatsApp</span>
                </a>
              </div>
            </div>

            <div className="lg:col-span-5 flex justify-center">
              <div className="relative rounded-3xl overflow-hidden shadow-xl w-full max-w-[280px] sm:max-w-sm aspect-[3/4] border-2 border-border/80 group bg-stone-100">
                <img
                  src={fotoUrl}
                  alt={`${titulo} en su taller de arte en Sunchales`}
                  loading="eager"
                  className="rounded-3xl w-full h-full transition-transform duration-500"
                  style={{
                    objectFit: fotoFit,
                    objectPosition: `${fotoPosX}% ${fotoPosY}%`,
                    transform: `scale(${fotoZoom / 100})`,
                  }}
                />
                <span className="absolute bottom-3 right-3 rounded-full bg-chocolate/95 backdrop-blur-md px-3.5 py-1 text-xs font-medium text-crema-cruda shadow-lg font-sans">
                  {titulo} · Taller de Autor 🇦🇷
                </span>
              </div>
            </div>

          </div>
        </section>
      </FadeIn>

      {/* ─── 2. SECCIÓN DE PREGUNTAS FRECUENTES (FAQ) ─── */}
      <FadeIn delay={100}>
        <section className="space-y-6">
          <div className="border-b border-border/60 pb-4 text-center flex flex-col items-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-barro font-sans flex items-center justify-center gap-1.5">
              <span className="text-terracota">💡</span> Todo lo que necesitás saber
            </span>
            <h2 className="text-2xl sm:text-3xl font-medium text-chocolate font-serif mt-1">
              Preguntas Frecuentes
            </h2>
            <p className="text-xs sm:text-sm text-barro font-sans mt-0.5 max-w-lg mx-auto">
              Encontrá respuestas sobre formas de pago, envíos protegidos a todo el país, cuidados de las piezas y encargos.
            </p>
          </div>

          <FaqAccordion items={FAQ_ITEMS} />
        </section>
      </FadeIn>

      {/* ─── 3. BANNER DE CONSULTA DIRECTA ─── */}
      <FadeIn delay={150}>
        <section className="rounded-2xl sm:rounded-3xl border border-border/60 bg-gradient-to-br from-surface via-arena/30 to-rosa-buho/10 p-6 sm:p-8 text-center space-y-4">
          <span className="text-3xl">💌</span>
          <h3 className="text-xl sm:text-2xl font-serif font-medium text-chocolate">
            ¿Tenés alguna otra duda o consulta específica?
          </h3>
          <p className="text-xs sm:text-sm text-barro max-w-lg mx-auto font-sans">
            Escribime con total confianza. Estoy a tu disposición para ayudarte a elegir tu pieza o coordinar un encargo especial.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <a
              href="https://wa.me/5493493668308?text=Hola%20Mili!%20Tengo%20una%20consulta%20sobre%20tus%20piezas."
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-terracota text-white px-6 py-2.5 text-xs sm:text-sm font-semibold hover:bg-terracota/90 transition-all shadow-xs"
            >
              Consultar por WhatsApp ↗
            </a>
            <Link href="/ceramica/catalogo">
              <Button variant="outline" className="rounded-full border-border/80 bg-surface text-chocolate hover:bg-arena px-5 py-2.5 text-xs sm:text-sm font-semibold shadow-xs">
                Explorar Catálogo →
              </Button>
            </Link>
          </div>
        </section>
      </FadeIn>

    </div>
  );
}
