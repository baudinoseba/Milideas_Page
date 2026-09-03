"use client";

import { useState } from "react";
import { FadeIn } from "@/components/ui/fade-in";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const MOTIVOS_CONSULTA = [
  "Consulta sobre piezas de cerámica en stock",
  "Encargo de ilustración personalizada a medida",
  "Estado de un pedido o comprobante de pago",
  "Ventas mayoristas o regalos empresariales",
  "Otra consulta general",
];

export function ContactoView({
  vendorWhatsapp = "5493493664420",
  contactEmail = "contacto@milideasarte.com.ar",
  instagramUser = "milideas_arte",
}: {
  vendorWhatsapp?: string;
  contactEmail?: string;
  instagramUser?: string;
}) {
  const [copiado, setCopiado] = useState(false);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [motivo, setMotivo] = useState(MOTIVOS_CONSULTA[0]);
  const [mensaje, setMensaje] = useState("");

  const handleCopiarEmail = async () => {
    try {
      await navigator.clipboard.writeText(contactEmail);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleEnviarWhatsapp = (e: React.FormEvent) => {
    e.preventDefault();
    const texto = `¡Hola Mili! Te escribo desde el formulario de contacto de tu web:
• *Nombre:* ${nombre || "No especificado"}
• *Teléfono:* ${telefono || "No especificado"}
• *Motivo:* ${motivo}
• *Mensaje:* ${mensaje || "Hola! Quería hacerte una consulta."}`;

    const url = `https://wa.me/${vendorWhatsapp}?text=${encodeURIComponent(texto)}`;
    window.open(url, "_blank");
  };

  const handleEnviarEmail = () => {
    const subject = encodeURIComponent(`[Consulta Web] ${motivo} - ${nombre || "Cliente"}`);
    const body = encodeURIComponent(
      `Hola Mili,\n\nTe escribo con la siguiente consulta:\n\nNombre: ${nombre}\nTeléfono/WhatsApp: ${telefono}\nMotivo: ${motivo}\n\nMensaje:\n${mensaje}\n\n¡Muchas gracias!`
    );
    window.open(`mailto:${contactEmail}?subject=${subject}&body=${body}`, "_blank");
  };

  return (
    <div className="mx-auto max-w-5xl space-y-12 pb-16">
      {/* ─── 1. Header Principal ─── */}
      <FadeIn>
        <div className="text-center space-y-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-arena/60 px-3.5 py-1 text-xs font-semibold text-chocolate font-sans">
            <span>💌</span> Atención Directa & Personalizada
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-medium font-serif text-chocolate tracking-tight">
            Contacto & Taller
          </h1>
          <p className="mx-auto max-w-xl text-xs sm:text-sm text-barro font-sans leading-relaxed">
            ¿Tenés alguna duda sobre una pieza, querés encargar una ilustración personalizada o coordinar el retiro de tu compra? Estamos a tu disposición para ayudarte.
          </p>
        </div>
      </FadeIn>

      {/* ─── 2. Tarjetas de Canales Oficiales ─── */}
      <FadeIn delay={100}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Tarjeta WhatsApp */}
          <div className="group relative rounded-3xl border border-emerald-200/80 bg-gradient-to-b from-emerald-50/50 to-white p-5 shadow-xs transition-all hover:shadow-md hover:border-emerald-300 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 shadow-2xs">
                <WhatsAppIcon className="h-6 w-6 text-[#25D366]" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800 font-sans">
                  WhatsApp Oficial
                </p>
                <p className="text-sm font-bold text-chocolate font-mono mt-0.5">
                  +54 9 3493 66-4420
                </p>
                <p className="text-[11px] text-muted mt-1 font-sans leading-snug">
                  Canal principal y más rápido para coordinar piezas, consultas y pagos.
                </p>
              </div>
            </div>
            <div className="pt-4 mt-2 border-t border-emerald-100">
              <a
                href={`https://wa.me/${vendorWhatsapp}?text=Hola%20Mili!%20Te%20escribo%20desde%20la%20p%C3%A1gina%20web%20para%20hacerte%20una%20consulta.`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[#25D366] text-white py-2 text-xs font-bold hover:bg-[#20ba59] transition-all shadow-2xs"
              >
                <span>Chatear ahora</span>
                <span>↗</span>
              </a>
            </div>
          </div>

          {/* Tarjeta Correo */}
          <div className="group relative rounded-3xl border border-border/80 bg-surface p-5 shadow-xs transition-all hover:shadow-md hover:border-border flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-arena/40 text-chocolate shadow-2xs text-lg">
                ✉️
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-chocolate/80 font-sans">
                  Correo Electrónico
                </p>
                <p className="text-xs font-bold text-chocolate font-mono mt-0.5 break-all">
                  {contactEmail}
                </p>
                <p className="text-[11px] text-muted mt-1 font-sans leading-snug">
                  Para consultas formales, presupuestos corporativos y compras mayoristas.
                </p>
              </div>
            </div>
            <div className="pt-4 mt-2 border-t border-border/60 flex items-center gap-1.5">
              <a
                href={`mailto:${contactEmail}`}
                className="inline-flex flex-1 items-center justify-center gap-1 rounded-full bg-chocolate text-crema-cruda py-2 text-xs font-semibold hover:bg-chocolate/90 transition-all shadow-2xs"
              >
                <span>Enviar email</span>
                <span>↗</span>
              </a>
              <button
                type="button"
                onClick={handleCopiarEmail}
                className="rounded-full border border-border bg-white px-2.5 py-2 text-[11px] font-medium text-stone-700 hover:bg-stone-100 transition-all active:scale-95"
                title="Copiar correo al portapapeles"
              >
                {copiado ? "✓" : "Copiar"}
              </button>
            </div>
          </div>

          {/* Tarjeta Instagram */}
          <div className="group relative rounded-3xl border border-border/80 bg-surface p-5 shadow-xs transition-all hover:shadow-md hover:border-border flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 shadow-2xs text-lg">
                📸
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-terracota font-sans">
                  Instagram
                </p>
                <p className="text-sm font-bold text-chocolate font-mono mt-0.5">
                  @{instagramUser}
                </p>
                <p className="text-[11px] text-muted mt-1 font-sans leading-snug">
                  Seguí el proceso diario del taller, fotos de los nuevos lanzamientos e historias.
                </p>
              </div>
            </div>
            <div className="pt-4 mt-2 border-t border-border/60">
              <a
                href={`https://instagram.com/${instagramUser}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-terracota/30 bg-terracota/10 text-chocolate py-2 text-xs font-semibold hover:bg-terracota/20 transition-all shadow-2xs"
              >
                <span>Ver @{instagramUser}</span>
                <span>↗</span>
              </a>
            </div>
          </div>

          {/* Tarjeta Taller & Envíos */}
          <div className="group relative rounded-3xl border border-border/80 bg-surface p-5 shadow-xs transition-all hover:shadow-md hover:border-border flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 shadow-2xs text-lg">
                🏡
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-800 font-sans">
                  Taller & Retiros
                </p>
                <p className="text-sm font-bold text-chocolate font-sans mt-0.5">
                  Sunchales, Santa Fe
                </p>
                <p className="text-[11px] text-muted mt-1 font-sans leading-snug">
                  Retiro de compras sin cargo previa coordinación de horario. Envíos seguros a todo el país.
                </p>
              </div>
            </div>
            <div className="pt-4 mt-2 border-t border-border/60">
              <div className="inline-flex w-full items-center justify-center gap-1 rounded-full bg-stone-100 py-2 text-xs font-medium text-stone-600">
                <span>🇦🇷 Envíos a toda la Argentina</span>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* ─── 3. Formulario Rápido de Mensaje ─── */}
      <FadeIn delay={150}>
        <div className="rounded-3xl border border-border/80 bg-surface/95 p-6 sm:p-8 shadow-sm">
          <div className="max-w-xl mx-auto space-y-6">
            <div className="text-center space-y-1">
              <span className="text-2xl">✍️</span>
              <h2 className="text-xl sm:text-2xl font-medium font-serif text-chocolate">
                Escribinos tu consulta
              </h2>
              <p className="text-xs text-muted font-sans">
                Completá tus datos y envialo directamente por WhatsApp para una respuesta inmediata, o por correo electrónico.
              </p>
            </div>

            <form onSubmit={handleEnviarWhatsapp} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="nombre" className="text-xs font-semibold text-stone-800">
                    Tu Nombre *
                  </Label>
                  <Input
                    id="nombre"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Sofía Gómez"
                    className="rounded-xl text-xs bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="telefono" className="text-xs font-semibold text-stone-800">
                    Tu WhatsApp / Teléfono *
                  </Label>
                  <Input
                    id="telefono"
                    required
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="Ej. 3493664420"
                    className="rounded-xl text-xs bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="motivo" className="text-xs font-semibold text-stone-800">
                  Motivo de Consulta
                </Label>
                <select
                  id="motivo"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-terracota/30 shadow-2xs"
                >
                  {MOTIVOS_CONSULTA.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="mensaje" className="text-xs font-semibold text-stone-800">
                  ¿En qué podemos ayudarte? *
                </Label>
                <Textarea
                  id="mensaje"
                  required
                  rows={4}
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  placeholder="Contanos qué pieza te interesa, medidas, colores o la fecha en que necesitás tu encargo..."
                  className="rounded-2xl text-xs bg-white resize-none"
                />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <Button
                  type="submit"
                  className="w-full sm:flex-1 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs py-2.5 shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <WhatsAppIcon className="w-4 h-4 text-white" />
                  <span>Enviar por WhatsApp</span>
                  <span>↗</span>
                </Button>

                <button
                  type="button"
                  onClick={handleEnviarEmail}
                  className="w-full sm:w-auto rounded-full border border-border/80 bg-white hover:bg-stone-50 text-stone-700 font-semibold text-xs py-2.5 px-5 shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>✉️ Enviar por Email</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </FadeIn>

      {/* ─── 4. Preguntas Frecuentes Rápidas de Contacto ─── */}
      <FadeIn delay={200}>
        <div className="rounded-3xl border border-border/60 bg-arena/20 p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2 text-chocolate font-serif font-medium text-lg">
            <span>💡</span>
            <h3>Información Útil para tu Consulta</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 text-xs font-sans text-stone-700">
            <div className="rounded-2xl bg-white/70 p-4 border border-border/40 space-y-1">
              <p className="font-bold text-chocolate">⏱️ Tiempos de Respuesta</p>
              <p className="text-muted leading-relaxed">
                Respondemos consultas de WhatsApp y email durante el día de lunes a sábados.
              </p>
            </div>
            <div className="rounded-2xl bg-white/70 p-4 border border-border/40 space-y-1">
              <p className="font-bold text-chocolate">📦 Envíos Protegidos</p>
              <p className="text-muted leading-relaxed">
                Despachamos por Vía Cargo u encomiendas a todo el país con embalaje reforzado multicapa.
              </p>
            </div>
            <div className="rounded-2xl bg-white/70 p-4 border border-border/40 space-y-1">
              <p className="font-bold text-chocolate">🎨 Encargos Especiales</p>
              <p className="text-muted leading-relaxed">
                Si querés un cuadro o pieza personalizada, podés enviarnos tu foto de referencia directamente por WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
