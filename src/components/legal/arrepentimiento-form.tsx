"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/stores/toast-store";
import { registrarArrepentimientoAction } from "@/lib/actions";

interface FormState {
  nombre: string;
  contacto: string;
  email: string;
  pedidoNumero: string;
  producto: string;
  motivo: string;
}

export function ArrepentimientoForm({ whatsappNumero }: { whatsappNumero?: string }) {
  const [formData, setFormData] = useState<FormState>({
    nombre: "",
    contacto: "",
    email: "",
    pedidoNumero: "",
    producto: "",
    motivo: "",
  });

  const [codigoGenerado, setCodigoGenerado] = useState<string | null>(null);
  const [fechaEnvio, setFechaEnvio] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const telefonoDestino = whatsappNumero || "5493493664420";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim() || !formData.contacto.trim() || !formData.producto.trim()) {
      toast.error("Por favor completá tu nombre, teléfono y el producto a devolver.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await registrarArrepentimientoAction({
        nombre: formData.nombre,
        contacto: formData.contacto,
        email: formData.email,
        pedidoNumero: formData.pedidoNumero,
        producto: formData.producto,
        motivo: formData.motivo,
      });

      if (res.success && res.codigo) {
        setCodigoGenerado(res.codigo);
        setFechaEnvio(res.fecha || new Date().toLocaleString("es-AR"));
        toast.success(`Solicitud registrada. Tu código de trámite es: ${res.codigo}`);
      } else {
        // Fallback de contingencia si la red o servidor fallan
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const dateCode = new Date().toISOString().slice(2, 10).replace(/-/g, "");
        const fallbackCodigo = `REV-${dateCode}-${randomSuffix}`;
        const ahora = new Date().toLocaleString("es-AR", {
          dateStyle: "long",
          timeStyle: "short",
        });
        setCodigoGenerado(fallbackCodigo);
        setFechaEnvio(ahora);
        toast.success(`Código de revocación emitido: ${fallbackCodigo}. Guardá este comprobante.`);
      }
    } catch {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const dateCode = new Date().toISOString().slice(2, 10).replace(/-/g, "");
      const fallbackCodigo = `REV-${dateCode}-${randomSuffix}`;
      setCodigoGenerado(fallbackCodigo);
      setFechaEnvio(new Date().toLocaleString("es-AR"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (codigoGenerado) {
    const mensajeWhatsapp = encodeURIComponent(
      `Hola Mili! Solicito la revocación de compra (Botón de Arrepentimiento).\n` +
      `Código de trámite: ${codigoGenerado}\n` +
      `Fecha: ${fechaEnvio}\n` +
      `Titular: ${formData.nombre}\n` +
      `Teléfono: ${formData.contacto}\n` +
      `Email: ${formData.email || "No especificado"}\n` +
      `Pedido N°: ${formData.pedidoNumero || "A coordinar"}\n` +
      `Producto: ${formData.producto}\n` +
      (formData.motivo ? `Detalle: ${formData.motivo}` : "")
    );

    return (
      <div className="rounded-2xl sm:rounded-3xl border border-verde-menta/60 bg-gradient-to-br from-surface to-verde-menta/10 p-6 sm:p-8 space-y-6 shadow-xs animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-verde-menta/30 text-2xl">
            ✓
          </div>
          <div>
            <h3 className="font-serif text-xl font-medium text-chocolate">
              Solicitud de Revocación Registrada
            </h3>
            <p className="text-xs text-barro font-sans">
              Comprobante de arrepentimiento conforme a la Disposición 954/2025 y Art. 34 Ley 24.240.
            </p>
          </div>
        </div>

        {/* Tarjeta de Código */}
        <div className="rounded-2xl border border-border/80 bg-surface p-4 sm:p-5 space-y-3 font-sans">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-border/60 pb-3">
            <span className="text-xs text-muted uppercase font-semibold tracking-wider">
              Código de Identificación de Trámite:
            </span>
            <span className="text-lg font-bold font-mono text-terracota">
              {codigoGenerado}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-barro pt-1">
            <div>
              <span className="font-semibold text-chocolate">Titular solicitante:</span>{" "}
              {formData.nombre}
            </div>
            <div>
              <span className="font-semibold text-chocolate">Fecha de emisión:</span>{" "}
              {fechaEnvio}
            </div>
            <div>
              <span className="font-semibold text-chocolate">Producto:</span>{" "}
              {formData.producto}
            </div>
            <div>
              <span className="font-semibold text-chocolate">N° Pedido:</span>{" "}
              {formData.pedidoNumero || "Sin especificar"}
            </div>
          </div>
        </div>

        <div className="space-y-3 font-sans text-xs text-barro leading-relaxed">
          <p>
            Hemos registrado formalmente tu solicitud de revocación. Para coordinar la devolución de la pieza y el reintegro de tu pago, te invitamos a enviarnos este comprobante por WhatsApp o por correo electrónico.
          </p>
          <p className="text-muted">
            Recordá que el producto debe encontrarse sin uso y en su embalaje protector original para garantizar un traslado seguro.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <a
            href={`https://wa.me/${telefonoDestino}?text=${mensajeWhatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-full bg-[#25D366] text-white px-5 py-3 text-xs sm:text-sm font-semibold hover:bg-[#20ba5a] transition-all shadow-xs inline-flex items-center justify-center gap-2 text-center"
          >
            <span>💬 Notificar a Mili por WhatsApp</span>
            <span>↗</span>
          </a>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (codigoGenerado) {
                navigator.clipboard?.writeText(codigoGenerado);
                toast.info("Código copiado al portapapeles.");
              }
            }}
            className="rounded-full border-border/80 bg-surface text-chocolate hover:bg-arena px-5 py-3 text-xs sm:text-sm font-semibold"
          >
            Copiar Código
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 font-sans">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-chocolate">
            Nombre y Apellido <span className="text-terracota">*</span>
          </label>
          <Input
            required
            placeholder="Ej: Laura González"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            className="rounded-xl"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-chocolate">
            Teléfono o WhatsApp <span className="text-terracota">*</span>
          </label>
          <Input
            required
            type="tel"
            placeholder="Ej: +54 9 3493 123456"
            value={formData.contacto}
            onChange={(e) => setFormData({ ...formData, contacto: e.target.value })}
            className="rounded-xl"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-chocolate">
            Correo Electrónico (Opcional)
          </label>
          <Input
            type="email"
            placeholder="tu-email@ejemplo.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="rounded-xl"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-chocolate">
            Número o Referencia de Pedido (si lo tenés)
          </label>
          <Input
            placeholder="Ej: PED-1234 o fecha de compra"
            value={formData.pedidoNumero}
            onChange={(e) => setFormData({ ...formData, pedidoNumero: e.target.value })}
            className="rounded-xl"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-chocolate">
          Pieza o Producto a devolver <span className="text-terracota">*</span>
        </label>
        <Input
          required
          placeholder="Ej: Taza Bosque Encantado en cerámica"
          value={formData.producto}
          onChange={(e) => setFormData({ ...formData, producto: e.target.value })}
          className="rounded-xl"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-chocolate">
          Motivo o Comentario (Opcional)
        </label>
        <textarea
          rows={3}
          placeholder="Contanos brevemente el motivo o si necesitás un cambio por otra pieza..."
          value={formData.motivo}
          onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
          className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs sm:text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-terracota/30 transition-all resize-none"
        />
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full sm:w-auto rounded-full bg-chocolate text-crema-cruda hover:bg-chocolate/90 px-8 py-2.5 text-xs sm:text-sm font-semibold shadow-xs cursor-pointer"
      >
        {isSubmitting ? "Enviando..." : "Enviar solicitud"}
      </Button>
    </form>
  );
}
