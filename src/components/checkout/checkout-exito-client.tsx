"use client";

import { useState, useTransition, useEffect } from "react";
import { formatPrecio } from "@/lib/pricing";
import { subirComprobanteAction } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { PAYMENT_GRACE_HOURS } from "@/lib/utils/constants";
import type { PedidoConItems } from "@/types";

import Link from "next/link";

import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";

import { useEncargosCartStore } from "@/stores/encargos-cart-store";

export function CheckoutExitoClient({ pedido }: { pedido: PedidoConItems }) {
  const limite = new Date(pedido.fecha_limite_pago);
  const [whatsappUrl, setWhatsappUrl] = useState<string>("#");

  const encargoItems = useEncargosCartStore((s) => s.items);
  const totalEncargosCount = useEncargosCartStore((s) => s.getTotalItems());

  useEffect(() => {
    let dir: any = pedido.direccion_envio;
    if (typeof dir === "string") {
      try {
        dir = JSON.parse(dir);
      } catch (e) {}
    }

    const dateFormatted = new Date(pedido.created_at).toLocaleDateString("es-AR", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });

    const isTaller =
      pedido.tipo_envio === "taller" ||
      (dir && (
        dir.taller === true ||
        dir.taller === "true" ||
        dir.tipo === "taller" ||
        String(dir.retiro || "").toLowerCase().includes("ameghino") ||
        String(dir.retiro || "").toLowerCase().includes("taller")
      ));

    const itemsText = pedido.items_pedido
      .map((item) => {
        const prodName = item.productos?.nombre ?? "Producto";
        const personalizationText = item.es_personalizado ? " (Personalizado)" : "";
        const totalItemPrice = item.precio_unitario_final * item.cantidad;
        return `- *${prodName.trim()}${personalizationText}* x ${item.cantidad} => ${formatPrecio(totalItemPrice)}`;
      })
      .join("\n");

    const statusTranslations: Record<string, string> = {
      reservado: "Reservado (48h)",
      pendiente_pago: "Pendiente de Pago",
      confirmado: "Confirmado",
      enviado: "Enviado",
      cancelado: "Cancelado"
    };

    const getAddressText = () => {
      if (isTaller) {
        return `*Método de Entrega:* Retiro en Taller (Sin Cargo)\n*Dirección de Retiro:* Florentino Ameghino 1576, Sunchales, Santa Fe\n*Teléfono:* ${pedido.whatsapp_contacto}`;
      }
      if (pedido.tipo_envio === "agencia") {
        return `*Método de Entrega:* Sucursal Vía Cargo\n*Localidad:* ${dir?.ciudad || ""}, ${dir?.provincia || ""}\n*Teléfono:* ${pedido.whatsapp_contacto}`;
      }
      return `*Método de Entrega:* A Domicilio (Vía Cargo)\n*Dirección:* ${dir?.calle || ""} ${dir?.numero || ""}${dir?.piso ? ` Piso ${dir.piso}` : ""}${dir?.depto ? ` Depto ${dir.depto}` : ""}\n*Ubicación:* ${dir?.ciudad || ""}, ${dir?.provincia || ""} (CP ${dir?.codigoPostal || ""})\n${dir?.referencia ? `*Indicaciones:* ${dir.referencia}\n` : ""}*Teléfono:* ${pedido.whatsapp_contacto}`;
    };

    const text = `*MILIDEAS ARTE - NUEVO PEDIDO*

--------------------------------
*Nº Pedido:* #${pedido.id.slice(0, 8).toUpperCase()}
*Estado:* ${statusTranslations[pedido.estado] || pedido.estado}
*Fecha:* ${dateFormatted}
*Email:* ${pedido.email_contacto || "No especificado"}

*DETALLES DE LAS PIEZAS:*
${itemsText}

--------------------------------
*Subtotal:* ${formatPrecio(pedido.subtotal)}
*Descuento:* -${formatPrecio(pedido.descuento_aplicado)}
*Envío:* ${formatPrecio(pedido.costo_envio)}
*TOTAL:* ${formatPrecio(pedido.total)}

--------------------------------
*DATOS DEL COMPRADOR Y ENTREGA:*
*Comprador:* ${pedido.nombre_contacto}
${getAddressText()}

--------------------------------
*Ver pedido en la web:*
${window.location.origin}/checkout/exito/${pedido.id}`;

    const vendorWhatsapp = process.env.NEXT_PUBLIC_VENDOR_WHATSAPP || "5493493668308";
    const generatedUrl = `https://wa.me/${vendorWhatsapp}?text=${encodeURIComponent(text)}`;
    setWhatsappUrl(generatedUrl);

    // Auto open WhatsApp in a new tab if coming directly from checkout submit
    const params = new URLSearchParams(window.location.search);
    if (params.get("autoOpen") === "true") {
      try {
        window.open(generatedUrl, "_blank");
      } catch (err) {
        console.warn("Popup blocked by browser:", err);
      }
    }
  }, [pedido]);

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

      {/* Continuation Banner for Encargos if items exist in Encargos Cart */}
      {encargoItems.length > 0 && (
        <Card className="border-terracota/40 bg-gradient-to-r from-arena/40 to-arena/10 p-5 space-y-3 shadow-md">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎨</span>
            <div className="space-y-0.5">
              <h3 className="font-serif font-semibold text-chocolate text-base">
                ¡Aún tenés {totalEncargosCount} {totalEncargosCount === 1 ? "pieza" : "piezas"} en tu Bolsa de Encargos!
              </h3>
              <p className="text-xs text-barro font-sans">
                Tu reserva de piezas en stock ya fue procesada. ¿Querés coordinar ahora tus encargos a medida con Mili por WhatsApp?
              </p>
            </div>
          </div>
          <Link href="/encargos" className="block pt-1">
            <Button className="w-full bg-terracota text-white hover:bg-terracota/90 rounded-full text-xs font-semibold py-3 shadow-xs">
              🎨 Continuar y Solicitar Encargos por WhatsApp →
            </Button>
          </Link>
        </Card>
      )}

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

      <Card className="space-y-3 bg-arena/20 border-border/80 p-5">
        <h2 className="font-semibold text-chocolate text-sm flex items-center gap-2">
          <span>🏦 Datos de Transferencia Bancaria</span>
        </h2>
        <div className="space-y-1.5 text-xs text-muted font-sans">
          <p><span className="font-medium text-foreground">Titular:</span> Milagros Anita Ferrero</p>
          <p><span className="font-medium text-foreground">CUIT:</span> 27-43717260-4</p>
          <p><span className="font-medium text-foreground">Banco:</span> Brubank</p>
          <p><span className="font-medium text-foreground">Alias:</span> <code className="bg-arena/60 px-2 py-0.5 rounded font-mono font-bold text-chocolate text-xs">milideasarte</code></p>
        </div>
        <p className="text-[11px] text-barro pt-1 leading-relaxed border-t border-border/40 mt-2">
          💡 Podés realizar la transferencia por el total de <strong>{formatPrecio(pedido.total)}</strong> a este alias y enviarle la foto del comprobante a Mili por WhatsApp.
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
