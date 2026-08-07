"use client";

import { useState, useTransition } from "react";
import { formatPrecio } from "@/lib/pricing";
import { subirComprobanteAction } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { PAYMENT_GRACE_HOURS } from "@/lib/utils/constants";
import type { PedidoConItems } from "@/types";

import Link from "next/link";

import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";

export function CheckoutExitoClient({ pedido }: { pedido: PedidoConItems }) {
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

    const getAddressText = () => {
      if (pedido.tipo_envio === "taller") {
        return `Método de entrega: Retiro en Taller (Sin Cargo)\nDirección de Retiro: Florentino Ameghino 1576, Sunchales, Santa Fe\nTeléfono: ${pedido.whatsapp_contacto}`;
      }
      if (pedido.tipo_envio === "agencia") {
        return `Método de entrega: Retiro en Sucursal Vía Cargo\nTeléfono: ${pedido.whatsapp_contacto}`;
      }
      return `Calle: ${dir?.calle || ""} ${dir?.numero || ""}\n${dir?.referencia ? `Detalles: ${dir.referencia}\n` : ""}${dir?.ciudad || ""}, ${dir?.provincia || ""}\nCódigo Postal: ${dir?.codigoPostal || ""}\nTeléfono: ${pedido.whatsapp_contacto}`;
    };

    const text = `👉 Mi Pedido @ Milideas

--------------------------------

#️⃣ Numero    : ${pedido.id.slice(0, 8).toUpperCase()}
🔆 Estado    : ${statusTranslations[pedido.estado] || pedido.estado}
🗓️ Fecha     : ${dateFormatted}
📧 Email     : ${pedido.email_contacto || "No especificado"}
💰 Total     : ${formatPrecio(pedido.total)}

🔍 Detalles del Pedido: 

${itemsText}

--------------------------------

Subtotal: ${formatPrecio(pedido.subtotal)}
Descuento: -${formatPrecio(pedido.descuento_aplicado)}
Envío: ${formatPrecio(pedido.costo_envio)}
Total: ${formatPrecio(pedido.total)}

--------------------------------

🗒️ Datos del comprador y entrega:

${pedido.nombre_contacto}
${getAddressText()}

--------------------------------

👁️ Ver Pedido
${window.location.origin}/checkout/exito/${pedido.id}`;

    const vendorWhatsapp = process.env.NEXT_PUBLIC_VENDOR_WHATSAPP || "5493493668308";
    return `https://wa.me/${vendorWhatsapp}?text=${encodeURIComponent(text)}`;
  })() : "";

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
        <div className="w-12 h-12 rounded-full bg-[#25D366]/10 flex items-center justify-center">
          <WhatsAppIcon className="w-7 h-7 text-[#25D366]" />
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
          <WhatsAppIcon className="w-5 h-5 text-white" />
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
        <h2 className="mb-2 font-semibold text-foreground text-sm">Coordinación de Pago y Datos Bancarios</h2>
        <p className="text-xs text-muted leading-relaxed">
          {process.env.NEXT_PUBLIC_BANK_ACCOUNT_INFO ??
            "El alias bancario para realizar la transferencia o la coordinación en efectivo se enviará directamente por WhatsApp al enviar tu pedido."}
        </p>
      </Card>

      <div className="flex justify-center pt-4">
        <Link href="/catalogo">
          <Button variant="outline" className="w-full sm:w-auto">
            Volver a la tienda
          </Button>
        </Link>
      </div>
    </div>
  );
}
