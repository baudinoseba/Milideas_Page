"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatPrecio } from "@/lib/pricing";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { useEncargosCartStore } from "@/stores/encargos-cart-store";
import { useVendedorWhatsapp } from "@/lib/hooks/use-vendedor-whatsapp";
import type { PedidoConItems } from "@/types";

export function CheckoutExitoClient({
  pedido,
  vendedorWhatsapp: propVendedorWhatsapp,
}: {
  pedido: PedidoConItems;
  vendedorWhatsapp?: string | null;
}) {
  const limite = new Date(new Date(pedido.created_at).getTime() + 24 * 60 * 60 * 1000);
  const vendorWhatsapp = useVendedorWhatsapp(propVendedorWhatsapp);
  const [whatsappUrl, setWhatsappUrl] = useState<string>("#");
  const [aliasCopiado, setAliasCopiado] = useState(false);

  const encargoItems = useEncargosCartStore((s) => s.items);
  const totalEncargosCount = useEncargosCartStore((s) => s.getTotalItems());

  const copiarAlias = () => {
    navigator.clipboard.writeText("milideasarte");
    setAliasCopiado(true);
    setTimeout(() => setAliasCopiado(false), 2000);
  };

  useEffect(() => {
    let dir: Record<string, any> = (pedido.direccion_envio as Record<string, any>) || {};
    if (typeof pedido.direccion_envio === "string") {
      try {
        dir = JSON.parse(pedido.direccion_envio);
      } catch {}
    }

    const dateFormatted = new Date(pedido.created_at).toLocaleDateString("es-AR", {
      day: "numeric",
      month: "long",
      year: "numeric",
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
        return `• *${prodName.trim()}${personalizationText}* x ${item.cantidad} => ${formatPrecio(totalItemPrice)}`;
      })
      .join("\n");

    const getAddressText = () => {
      if (isTaller) {
        return `*Entrega:* Retiro en Taller (Florentino Ameghino 1576, Sunchales)`;
      }
      if (pedido.tipo_envio === "agencia") {
        return `*Entrega:* Retiro en Sucursal Vía Cargo (${dir?.ciudad || ""}, ${dir?.provincia || ""})`;
      }
      return `*Entrega:* A Domicilio Vía Cargo (${dir?.calle || ""} ${dir?.numero || ""}, ${dir?.ciudad || ""}, ${dir?.provincia || ""})`;
    };

    const text = `*MILIDEAS ARTE - NUEVO PEDIDO RESERVADO*

--------------------------------
*Nº de Pedido:* #${pedido.id.slice(0, 8).toUpperCase()}
*Fecha:* ${dateFormatted}
*Cliente:* ${pedido.nombre_contacto}
*WhatsApp:* ${pedido.whatsapp_contacto}
${getAddressText()}

--------------------------------
*PIEZAS RESERVADAS:*
${itemsText}

--------------------------------
*Subtotal:* ${formatPrecio(pedido.subtotal)}
${pedido.descuento_aplicado > 0 ? `*Descuento:* -${formatPrecio(pedido.descuento_aplicado)}\n` : ""}*Envío:* ${pedido.costo_envio === 0 ? "Gratis ($0)" : formatPrecio(pedido.costo_envio)}
*TOTAL A ABONAR:* ${formatPrecio(pedido.total)}

--------------------------------
*PAGO:* Transferencia bancaria a alias *milideasarte* (adjunto comprobante a continuación).`;

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
  }, [pedido, vendorWhatsapp]);

  return (
    <div className="mx-auto max-w-xl space-y-5 pb-12">
      
      {/* ─── Encabezado Principal de Éxito ─── */}
      <div className="text-center space-y-1.5 pt-2">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3.5 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300">
          <span>✨</span>
          <span>¡Piezas Reservadas con Éxito!</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-medium text-chocolate">
          Pedido #{pedido.id.slice(0, 8).toUpperCase()}
        </h1>
        <p className="text-xs text-barro font-sans max-w-md mx-auto leading-relaxed">
          Tus piezas artesanales quedaron reservadas a tu nombre por <strong>24 horas</strong> (hasta el {limite.toLocaleDateString("es-AR")} a las {limite.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })} hs). Si no se acredita la transferencia en 24 horas, las piezas volverán automáticamente al stock disponible.
        </p>
      </div>

      {/* ─── PASO 1: DATOS BANCARIOS PARA TRANSFERIR (AL PRINCIPIO) ─── */}
      <Card className="border-terracota/30 bg-gradient-to-br from-surface via-arena/30 to-arena/10 p-5 sm:p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-terracota text-white font-bold text-xs">
              1
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-serif font-bold text-chocolate">
                Realizá la Transferencia Bancaria
              </h2>
              <p className="text-[11px] text-muted font-sans">
                Transferí el importe total para confirmar tu pedido
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-semibold text-muted tracking-wider block font-sans">Total</span>
            <span className="text-base sm:text-lg font-bold font-mono text-terracota">
              {formatPrecio(pedido.total)}
            </span>
          </div>
        </div>

        {/* Caja de Alias Clickeable con Copiado Rápido */}
        <div className="rounded-2xl bg-surface border-2 border-dashed border-terracota/40 p-4 space-y-3 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <span className="text-[10px] font-semibold uppercase text-barro tracking-wider block font-sans">
                Alias de Transferencia:
              </span>
              <span className="font-mono text-lg sm:text-xl font-black text-chocolate tracking-wide select-all">
                milideasarte
              </span>
            </div>

            <button
              type="button"
              onClick={copiarAlias}
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-terracota hover:bg-terracota/90 active:scale-95 text-white px-4 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
            >
              {aliasCopiado ? (
                <>
                  <span>✓</span>
                  <span>¡Alias Copiado!</span>
                </>
              ) : (
                <>
                  <span>📋</span>
                  <span>Copiar Alias</span>
                </>
              )}
            </button>
          </div>

          {/* Detalles del Titular */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40 text-xs font-sans text-muted">
            <p>
              <span className="font-medium text-foreground block text-[11px]">Titular:</span>
              <span className="text-chocolate font-semibold">Milagros Anita Ferrero</span>
            </p>
            <p>
              <span className="font-medium text-foreground block text-[11px]">Banco:</span>
              <span className="text-chocolate font-semibold">Brubank</span>
            </p>
            <p>
              <span className="font-medium text-foreground block text-[11px]">CUIT:</span>
              <span className="font-mono text-chocolate font-semibold">27-43717260-4</span>
            </p>
            <p>
              <span className="font-medium text-foreground block text-[11px]">Tipo de Cuenta:</span>
              <span className="text-chocolate font-semibold">Caja de Ahorro $</span>
            </p>
          </div>
        </div>
      </Card>

      {/* ─── PASO 2: ENVIAR COMPROBANTE POR WHATSAPP ─── */}
      <Card className="border-[#25D366]/40 bg-[#25D366]/5 p-5 sm:p-6 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 border-b border-border/60 pb-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#25D366] text-white font-bold text-xs">
            2
          </span>
          <div>
            <h2 className="text-sm sm:text-base font-serif font-bold text-chocolate flex items-center gap-1.5">
              <span>Enviá tu Pedido y Comprobante por WhatsApp</span>
            </h2>
            <p className="text-[11px] text-muted font-sans">
              Hacé clic abajo para abrir el chat con Mili y adjuntarle la foto de la transferencia
            </p>
          </div>
        </div>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-full px-6 py-3.5 text-xs sm:text-sm font-bold bg-[#25D366] hover:bg-[#20ba59] active:scale-98 text-white transition-all duration-200 w-full shadow-md cursor-pointer"
        >
          <WhatsAppIcon className="w-5 h-5 text-white" />
          <span>Enviar Pedido y Comprobante por WhatsApp →</span>
        </a>

        <p className="text-[11px] text-barro font-sans text-center leading-relaxed">
          💬 Al presionar el botón se abrirá WhatsApp con el resumen de tu pedido cargado automáticamente. Solo tenés que enviarlo y adjuntar la captura del comprobante.
        </p>
      </Card>

      {/* ─── Banner de Continuación si hay Encargos en la Bolsa ─── */}
      {encargoItems.length > 0 && (
        <Card className="border-terracota/40 bg-gradient-to-r from-arena/40 to-arena/10 p-4 sm:p-5 space-y-3 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎨</span>
            <div className="space-y-0.5">
              <h3 className="font-serif font-semibold text-chocolate text-sm sm:text-base">
                ¡Aún tenés {totalEncargosCount} {totalEncargosCount === 1 ? "pieza" : "piezas"} en tu Bolsa de Encargos!
              </h3>
              <p className="text-xs text-barro font-sans">
                Tu compra de stock ya fue registrada. ¿Querés coordinar tus pedidos a medida con Mili?
              </p>
            </div>
          </div>
          <Link href="/encargos" className="block pt-1">
            <Button className="w-full bg-terracota text-white hover:bg-terracota/90 rounded-full text-xs font-semibold py-2.5 shadow-xs cursor-pointer">
              🎨 Continuar con mis Encargos a Medida →
            </Button>
          </Link>
        </Card>
      )}

      {/* ─── Resumen Compacto de Piezas y Entrega ─── */}
      <Card className="p-4 sm:p-5 space-y-3 text-xs bg-surface border-border/70">
        <h3 className="font-semibold text-chocolate text-xs uppercase tracking-wider font-sans border-b border-border/40 pb-2">
          Detalle del Pedido
        </h3>

        <ul className="divide-y divide-border/40 space-y-1">
          {pedido.items_pedido.map((it) => (
            <li key={it.id} className="pt-2 pb-1 flex justify-between items-start">
              <div>
                <p className="font-semibold text-foreground">{it.productos?.nombre || "Pieza de autor"}</p>
                <p className="text-[11px] text-muted">Cantidad: {it.cantidad}</p>
              </div>
              <span className="font-mono font-bold text-chocolate">
                {formatPrecio(it.precio_unitario_final * it.cantidad)}
              </span>
            </li>
          ))}
        </ul>

        <div className="pt-2 border-t border-border/60 space-y-1.5 text-muted font-sans">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-mono text-foreground font-semibold">{formatPrecio(pedido.subtotal)}</span>
          </div>
          {pedido.descuento_aplicado > 0 && (
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span>Descuento aplicado</span>
              <span>-{formatPrecio(pedido.descuento_aplicado)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Costo de envío</span>
            <span className="font-mono text-foreground font-semibold">
              {pedido.costo_envio === 0 ? "Gratis ($0)" : formatPrecio(pedido.costo_envio)}
            </span>
          </div>
          <div className="flex justify-between pt-2 border-t border-border/40 text-sm font-bold text-chocolate">
            <span>Total</span>
            <span className="font-mono text-terracota">{formatPrecio(pedido.total)}</span>
          </div>
        </div>
      </Card>

      {/* ─── Botón Volver a la Tienda ─── */}
      <div className="flex justify-center pt-2">
        <Link href="/ceramica/stock">
          <Button variant="outline" className="rounded-full px-6 py-2.5 text-xs font-semibold cursor-pointer">
            ← Volver a la Tienda
          </Button>
        </Link>
      </div>

    </div>
  );
}
