"use client";

import { useState } from "react";
import Link from "next/link";
import { FadeIn } from "@/components/ui/fade-in";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { enviarTicketSoporteAction } from "@/lib/actions/soporte";

const TIPOS_PROBLEMA = [
  "Problema al iniciar sesión o con mi cuenta",
  "No puedo restablecer o recuperar mi contraseña",
  "Inconveniente durante el proceso de encargo o compra",
  "Reporte de error o falla visual en la web",
  "Otra consulta técnica sobre la plataforma",
];

const MAX_CAPTURAS = 4;

interface CapturaItem {
  id: string;
  file: File;
  previewUrl: string;
}

export function SoporteView() {
  const [copiado, setCopiado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [ticketEnviado, setTicketEnviado] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [capturas, setCapturas] = useState<CapturaItem[]>([]);

  const handleArchivosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const nuevasCapturas: CapturaItem[] = [];
    let errorAlerta: string | null = null;

    for (const file of files) {
      if (capturas.length + nuevasCapturas.length >= MAX_CAPTURAS) {
        errorAlerta = `Podés adjuntar hasta un máximo de ${MAX_CAPTURAS} capturas.`;
        break;
      }
      if (file.size > 10 * 1024 * 1024) {
        errorAlerta = `El archivo "${file.name}" supera los 10MB permitidos.`;
        continue;
      }
      nuevasCapturas.push({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    if (errorAlerta) setErrorMsg(errorAlerta);
    if (nuevasCapturas.length) {
      setCapturas((prev) => [...prev, ...nuevasCapturas]);
    }
    e.target.value = "";
  };

  const removerCaptura = (id: string) => {
    setCapturas((prev) => {
      const item = prev.find((c) => c.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((c) => c.id !== id);
    });
  };

  const limpiarTodasCapturas = () => {
    capturas.forEach((c) => URL.revokeObjectURL(c.previewUrl));
    setCapturas([]);
  };

  const handleCopiar = async () => {
    try {
      await navigator.clipboard.writeText("soporte@milideasarte.com.ar");
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCargando(true);
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);
    formData.delete("captura");
    capturas.forEach((c) => {
      formData.append("captura", c.file);
    });
    const res = await enviarTicketSoporteAction(formData);

    setCargando(false);
    if (res.success && res.ticketId) {
      setTicketEnviado(res.ticketId);
      limpiarTodasCapturas();
    } else {
      setErrorMsg(res.error || "Ocurrió un error al enviar tu consulta. Por favor reintentá.");
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-12 pb-16">
      {/* ─── 1. Header Principal ─── */}
      <FadeIn>
        <div className="text-center space-y-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-arena/60 px-3.5 py-1 text-xs font-semibold text-chocolate font-sans">
            <span>🛠️</span> Mesa de Ayuda Técnica
          </span>
          <h1 className="text-3xl sm:text-4xl font-medium font-serif text-chocolate tracking-tight">
            Soporte & Ayuda con la Web
          </h1>
          <p className="mx-auto max-w-xl text-xs sm:text-sm text-barro font-sans leading-relaxed">
            Si tenés algún inconveniente técnico con tu cuenta, inicio de sesión, confirmación de pagos o el funcionamiento del sitio, podés abrir un ticket directo con el equipo técnico.
          </p>
        </div>
      </FadeIn>

      {/* ─── Aclaración Clave entre Taller y Soporte ─── */}
      <FadeIn delay={50}>
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/60 p-4 sm:p-5 text-xs text-amber-900 font-sans flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <span className="text-lg">💡</span>
            <div>
              <p className="font-bold text-chocolate">¿Tu consulta es sobre cerámicas, cuadros o encargos?</p>
              <p className="text-stone-600 mt-0.5">
                Para coordinar piezas, consultar stock o hablar sobre proyectos artísticos, podés escribirle a Mili directamente.
              </p>
            </div>
          </div>
          <Link
            href="/contacto"
            className="shrink-0 rounded-full bg-chocolate text-white px-4 py-1.5 text-xs font-semibold hover:bg-chocolate/90 transition-all"
          >
            Ir a Contacto de Mili →
          </Link>
        </div>
      </FadeIn>

      {/* ─── 2. Tarjetas Informativas de Soporte ─── */}
      <FadeIn delay={100}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-border/80 bg-surface p-5 shadow-xs space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-arena/50 text-chocolate text-base mb-2">
                ✉️
              </div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 font-sans">
                Correo Técnico Oficial
              </h3>
              <p className="text-sm font-bold text-chocolate font-mono mt-0.5">
                soporte@milideasarte.com.ar
              </p>
              <p className="text-xs text-muted mt-1 font-sans">
                Canal directo administrado por el equipo técnico del sitio para atención de incidencias.
              </p>
            </div>
            <div className="pt-3 border-t border-border/60">
              <button
                type="button"
                onClick={handleCopiar}
                className="w-full rounded-full border border-border/80 bg-white hover:bg-stone-50 text-stone-700 py-2 text-xs font-semibold transition-all cursor-pointer"
              >
                {copiado ? "✓ Correo copiado" : "📋 Copiar dirección"}
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-border/80 bg-surface p-5 shadow-xs space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 text-base mb-2">
                ⏱️
              </div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 font-sans">
                Tiempo de Respuesta
              </h3>
              <p className="text-sm font-bold text-chocolate font-sans mt-0.5">
                Respuesta en el día
              </p>
              <p className="text-xs text-muted mt-1 font-sans">
                Cada ticket recibido es revisado por el administrador técnico y respondido directamente a tu casilla de correo electrónico.
              </p>
            </div>
            <div className="pt-3 border-t border-border/60">
              <div className="inline-flex w-full items-center justify-center rounded-full bg-stone-100 py-2 text-xs font-medium text-stone-600">
                <span>🛡️ Soporte activo</span>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* ─── 3. Formulario de Ticket / Confirmación ─── */}
      <FadeIn delay={150}>
        <div className="rounded-3xl border border-border/80 bg-surface p-6 sm:p-8 shadow-sm">
          {ticketEnviado ? (
            <div className="text-center py-8 space-y-4 max-w-md mx-auto animate-in fade-in zoom-in-95 duration-200">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 mx-auto text-3xl">
                ✓
              </div>
              <div className="space-y-1">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Ticket #{ticketEnviado}
                </span>
                <h2 className="text-2xl font-serif font-medium text-chocolate">
                  ¡Ticket recibido con éxito!
                </h2>
                <p className="text-xs sm:text-sm text-stone-600 font-sans leading-relaxed">
                  Tu reporte técnico ya fue enviado al administrador del sitio. Te responderemos a tu correo a la brevedad para ayudarte a resolverlo.
                </p>
              </div>

              <div className="pt-4 flex flex-wrap justify-center gap-3">
                <Button
                  onClick={() => setTicketEnviado(null)}
                  variant="outline"
                  className="rounded-full text-xs"
                >
                  Enviar otra consulta técnica
                </Button>
                <Link href="/">
                  <Button className="rounded-full text-xs bg-chocolate hover:bg-chocolate/90 text-white">
                    Volver a la tienda
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="max-w-xl mx-auto space-y-6">
              <div className="text-center space-y-1">
                <span className="text-2xl">🎫</span>
                <h2 className="text-xl sm:text-2xl font-serif font-medium text-chocolate">
                  Abrir Ticket de Soporte
                </h2>
                <p className="text-xs text-muted font-sans">
                  Completá los detalles del inconveniente para que podamos asistirte.
                </p>
              </div>

              {errorMsg && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-medium text-center">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="nombre" className="text-xs font-semibold text-stone-800">
                      Tu Nombre *
                    </Label>
                    <Input
                      id="nombre"
                      name="nombre"
                      required
                      placeholder="Ej. Martín Pérez"
                      className="rounded-xl text-xs bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-semibold text-stone-800">
                      Tu Correo Electrónico *
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="tuemail@ejemplo.com"
                      className="rounded-xl text-xs bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="telefono" className="text-xs font-semibold text-stone-800">
                    Teléfono / WhatsApp (Opcional)
                  </Label>
                  <Input
                    id="telefono"
                    name="telefono"
                    placeholder="Ej. 3493444000"
                    className="rounded-xl text-xs bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="tipoProblema" className="text-xs font-semibold text-stone-800">
                    Tipo de Inconveniente *
                  </Label>
                  <select
                    id="tipoProblema"
                    name="tipoProblema"
                    defaultValue={TIPOS_PROBLEMA[0]}
                    className="w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-terracota/30 shadow-2xs"
                  >
                    {TIPOS_PROBLEMA.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="mensaje" className="text-xs font-semibold text-stone-800">
                    Descripción del Problema *
                  </Label>
                  <Textarea
                    id="mensaje"
                    name="mensaje"
                    required
                    rows={4}
                    placeholder="Detallanos qué estabas intentando hacer, qué mensaje de error apareció o cómo podemos ayudarte..."
                    className="rounded-2xl text-xs bg-white resize-none"
                  />
                </div>

                {/* 📸 Campo para adjuntar hasta 4 capturas de pantalla */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="capturas-input" className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
                      <span>📸</span> Capturas de pantalla o fotos del error ({capturas.length}/{MAX_CAPTURAS})
                    </Label>
                    {capturas.length > 0 && (
                      <button
                        type="button"
                        onClick={limpiarTodasCapturas}
                        className="text-[11px] text-rose-600 hover:underline font-medium cursor-pointer"
                      >
                        Quitar todas
                      </button>
                    )}
                  </div>

                  {/* Lista de capturas seleccionadas */}
                  {capturas.length > 0 && (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {capturas.map((item, idx) => (
                        <div
                          key={item.id}
                          className="relative rounded-2xl border border-stone-200 bg-white p-2.5 flex items-center gap-3 shadow-2xs"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.previewUrl}
                            alt={`Captura #${idx + 1}`}
                            className="h-14 w-14 rounded-xl object-cover border border-stone-200 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-stone-800 truncate">
                              #{idx + 1} {item.file.name}
                            </p>
                            <p className="text-[10px] text-stone-400">
                              {(item.file.size / 1024 / 1024).toFixed(2)} MB · Lista para enviar
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removerCaptura(item.id)}
                            className="p-1 text-stone-400 hover:text-rose-600 rounded-full hover:bg-stone-100 transition-colors cursor-pointer shrink-0"
                            title="Eliminar esta captura"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Dropzone para agregar capturas */}
                  {capturas.length < MAX_CAPTURAS && (
                    <label
                      htmlFor="capturas-input"
                      className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/70 hover:bg-stone-100/70 p-4 transition-colors cursor-pointer text-center group"
                    >
                      <span className="text-xl mb-1 group-hover:scale-110 transition-transform">📷</span>
                      <span className="text-xs font-medium text-stone-700">
                        {capturas.length === 0
                          ? "Hacé clic para seleccionar o subir capturas (podés elegir más de una)"
                          : "+ Agregar otra captura de pantalla"}
                      </span>
                      <span className="text-[10px] text-stone-400 mt-0.5">
                        JPG, PNG, WEBP (hasta {MAX_CAPTURAS} imágenes, máx. 10MB c/u)
                      </span>
                      <input
                        id="capturas-input"
                        type="file"
                        multiple
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        onChange={handleArchivosChange}
                        className="sr-only"
                      />
                    </label>
                  )}
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={cargando}
                    className="w-full rounded-full bg-chocolate hover:bg-chocolate/90 text-white font-bold text-xs sm:text-sm py-3 shadow-xs cursor-pointer transition-all"
                  >
                    {cargando ? "Enviando ticket..." : "Enviar Ticket de Soporte →"}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </FadeIn>
    </div>
  );
}
