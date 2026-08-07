"use client";

import { useState, useTransition } from "react";
import { formatPrecio } from "@/lib/pricing";
import { subirComprobanteAction } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Toast } from "@/components/ui/modal";
import { PAYMENT_GRACE_HOURS } from "@/lib/utils/constants";
import type { PedidoConItems } from "@/types";

import Link from "next/link";

export function CheckoutExitoClient({ pedido }: { pedido: PedidoConItems }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);

  const limite = new Date(pedido.fecha_limite_pago);

  const whatsappUrl = typeof window !== "undefined" ? (() => {
    const dir = pedido.direccion_envio as any;
    const dateFormatted = new Date(pedido.created_at).toLocaleDateString("es-AR", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });

    const itemsText = pedido.items_pedido
      .map((item) => {
        const prodName = item.productos?.nombre ?? "Producto";
        const personalizationText = item.es_personalizado ? " (Personalizado)" : "";
        const totalItemPrice = item.precio_unitario_final * item.cantidad;
        return `⭐ ${prodName}${personalizationText} x ${item.cantidad} => ${formatPrecio(totalItemPrice)}`;
      })
      .join("\n");

    const statusTranslations: Record<string, string> = {
      reservado: "reservado (48h)",
      pendiente_pago: "pendiente",
      confirmado: "confirmado",
      enviado: "enviado",
      cancelado: "cancelado"
    };

    const addressText = pedido.tipo_envio === "domicilio" && dir
      ? `Calle: ${dir.calle || ""} ${dir.numero || ""}
${dir.referencia ? `Detalles: ${dir.referencia}\n` : ""}${dir.ciudad || ""}, ${dir.provincia || ""}
Código Postal: ${dir.codigoPostal || ""}
Teléfono: ${pedido.whatsapp_contacto}`
      : `Método de entrega: Retiro en Agencia/Sucursal\nTeléfono: ${pedido.whatsapp_contacto}`;

    const text = `👉 Mi Pedido @ Milideas

--------------------------------

#️⃣ Numero    : ${pedido.id.slice(0, 8).toUpperCase()}
🔆 Order Status    : ${statusTranslations[pedido.estado] || pedido.estado}
🗓️ Fecha            : ${dateFormatted}
📧 Email           : ${pedido.email_contacto || "No especificado"}
💰 Importe Total    : ${formatPrecio(pedido.total)}

🔍 Detalles del Pedido: 

${itemsText}

--------------------------------

Subtotal: ${formatPrecio(pedido.subtotal)}
Descuento: -${formatPrecio(pedido.descuento_aplicado)}
Envío: ${formatPrecio(pedido.costo_envio)}
Total: ${formatPrecio(pedido.total)}

--------------------------------

🗒️ Dirección de facturación:

${pedido.nombre_contacto}
${addressText}

--------------------------------
Is Vat Exempt : no

👁️ Ver Pedido
${window.location.origin}/checkout/exito/${pedido.id}`;

    const vendorWhatsapp = process.env.NEXT_PUBLIC_VENDOR_WHATSAPP || "5493493668308";
    return `https://wa.me/${vendorWhatsapp}?text=${encodeURIComponent(text)}`;
  })() : "";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileType(file.type);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
      setFileType(null);
    }
  };

  const handleClearFile = () => {
    setPreviewUrl(null);
    setFileType(null);
    const input = document.getElementById("comprobante") as HTMLInputElement | null;
    if (input) input.value = "";
  };

  const handleUpload = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await subirComprobanteAction(pedido.id, formData);
      if (result.success) {
        setMessage("Comprobante subido correctamente");
        // Clear object URL memory
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setFileType(null);
      } else {
        setError(result.error ?? "Error al subir");
      }
    });
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-medium font-serif text-chocolate">¡Piezas reservadas con éxito!</h1>
        <p className="mt-2 text-xs text-muted leading-relaxed">
          Tus piezas fueron reservadas temporalmente a tu nombre por 48 horas. Coordiná el pago enviando el pedido a la vendedora por WhatsApp.
        </p>
      </div>

      {/* WhatsApp Send Card */}
      <Card className="border-[#25D366]/30 bg-[#25D366]/5 space-y-4 p-6 flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-full bg-[#25D366]/10 flex items-center justify-center text-[#25D366]">
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.5-5.729-1.452L0 24zm6.59-4.846c1.6.95 3.197 1.451 4.811 1.452 5.518 0 10.006-4.486 10.01-10.002.002-2.673-1.03-5.184-2.906-7.06C16.634 1.66 14.12 1.61 11.45 1.61 6.435 1.61 1.95 6.096 1.947 11.61c0 1.696.442 3.352 1.28 4.8l-.996 3.636 3.823-.992zm11.084-7.472c-.3-.149-1.772-.875-2.046-.975-.276-.1-.476-.15-.676.15-.2.3-.775.975-.95 1.174-.175.2-.35.225-.65.075-3.037-1.512-4.662-2.686-5.88-4.781-.313-.537-.038-.828.188-1.127.202-.27.45-.525.675-.787.225-.262.3-.45.45-.75.15-.3.075-.562-.037-.812-.113-.25-.95-2.288-1.3-3.125-.342-.826-.688-.713-.95-.713-.244-.006-.525-.006-.806-.006-.28 0-.737.106-1.125.525-.387.419-1.475 1.438-1.475 3.506 0 2.069 1.506 4.069 1.712 4.344.207.275 2.969 4.532 7.194 6.356 1.006.431 1.794.688 2.406.881 1.013.325 1.931.281 2.656.175.806-.119 1.775-.725 2.025-1.388.25-.662.25-1.238.175-1.387-.075-.15-.275-.25-.575-.4z" />
          </svg>
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-foreground">Enviar detalles por WhatsApp</h2>
          <p className="text-xs text-muted max-w-sm">
            Tocá abajo para enviarle la lista del pedido a la artista por WhatsApp. Te responderá enviándote el alias para la transferencia.
          </p>
        </div>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.98] text-white transition-all duration-200 w-full sm:w-auto shadow-sm"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.5-5.729-1.452L0 24zm6.59-4.846c1.6.95 3.197 1.451 4.811 1.452 5.518 0 10.006-4.486 10.01-10.002.002-2.673-1.03-5.184-2.906-7.06C16.634 1.66 14.12 1.61 11.45 1.61 6.435 1.61 1.95 6.096 1.947 11.61c0 1.696.442 3.352 1.28 4.8l-.996 3.636 3.823-.992zm11.084-7.472c-.3-.149-1.772-.875-2.046-.975-.276-.1-.476-.15-.676.15-.2.3-.775.975-.95 1.174-.175.2-.35.225-.65.075-3.037-1.512-4.662-2.686-5.88-4.781-.313-.537-.038-.828.188-1.127.202-.27.45-.525.675-.787.225-.262.3-.45.45-.75.15-.3.075-.562-.037-.812-.113-.25-.95-2.288-1.3-3.125-.342-.826-.688-.713-.95-.713-.244-.006-.525-.006-.806-.006-.28 0-.737.106-1.125.525-.387.419-1.475 1.438-1.475 3.506 0 2.069 1.506 4.069 1.712 4.344.207.275 2.969 4.532 7.194 6.356 1.006.431 1.794.688 2.406.881 1.013.325 1.931.281 2.656.175.806-.119 1.775-.725 2.025-1.388.25-.662.25-1.238.175-1.387-.075-.15-.275-.25-.575-.4z" />
          </svg>
          Enviar Pedido por WhatsApp
        </a>
      </Card>

      <Card className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted">Nº de pedido</span>
          <span className="font-mono text-xs">{pedido.id.slice(0, 8)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Total</span>
          <span className="font-medium">{formatPrecio(pedido.total)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Reserva vence</span>
          <span className="font-medium text-terracota">{limite.toLocaleString("es-AR")}</span>
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 font-medium">Datos para transferencia</h2>
        <p className="text-sm text-muted">
          {process.env.NEXT_PUBLIC_BANK_ACCOUNT_INFO ??
            "Los datos bancarios serán enviados por WhatsApp."}
        </p>
      </Card>

      {!pedido.comprobante_url && (
        <Card>
          <h2 className="mb-3 font-medium">Subir comprobante</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="comprobante">Seleccioná la imagen o PDF del comprobante</Label>
              <input
                id="comprobante"
                name="comprobante"
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                required
                className="mt-1 block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-secondary file:text-secondary-foreground hover:file:bg-secondary-hover file:cursor-pointer cursor-pointer"
              />
            </div>

            {/* File Preview Container */}
            {previewUrl && (
              <div className="relative border border-border rounded-lg p-3 bg-secondary/10 flex flex-col items-center">
                <button
                  type="button"
                  onClick={handleClearFile}
                  className="absolute right-2 top-2 bg-foreground/10 hover:bg-foreground/20 text-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors"
                  title="Quitar archivo"
                >
                  ✕
                </button>

                {fileType?.startsWith("image/") ? (
                  <div className="w-full max-h-64 flex justify-center overflow-hidden rounded-md border border-border bg-surface">
                    <img
                      src={previewUrl}
                      alt="Vista previa del comprobante"
                      className="max-h-60 object-contain w-auto p-1"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-6">
                    <svg className="w-12 h-12 text-primary/80 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-xs font-semibold text-foreground">Comprobante PDF seleccionado</span>
                  </div>
                )}
              </div>
            )}

            <Button type="submit" className="w-full" isLoading={pending}>
              Subir comprobante
            </Button>
          </form>
        </Card>
      )}

      {pedido.comprobante_url && (
        <Card className="flex flex-col items-center text-center space-y-3 p-6 border-emerald-100 bg-emerald-50/20">
          <svg className="w-12 h-12 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="space-y-1">
            <h2 className="text-lg font-medium text-emerald-800">Comprobante recibido</h2>
            <p className="text-xs text-emerald-700/80">
              Hemos recibido tu comprobante de pago correctamente. Nos pondremos en contacto pronto por WhatsApp.
            </p>
          </div>
        </Card>
      )}

      <div className="flex justify-center pt-4">
        <Link href="/catalogo">
          <Button variant="outline" className="w-full sm:w-auto">
            Volver a la tienda
          </Button>
        </Link>
      </div>

      {message && <Toast message={message} type="success" />}
      {error && <Toast message={error} type="error" onClose={() => setError(null)} />}
    </div>
  );
}
