"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CartLineItem } from "@/components/cart/cart-line-item";
import { CartEmptyState } from "@/components/cart/cart-button";
import { formatPrecio, calcularSubtotal, calcularPricing } from "@/lib/pricing";
import { CheckoutSteps } from "@/components/checkout/checkout-steps";
import { CartReservationTimer } from "@/components/cart/cart-reservation-timer";
import { useCartStore } from "@/stores/cart-store";

const subscribeEmpty = () => () => {};

export default function CarritoPage() {
  const items = useCartStore((s) => s.items);
  const isClient = useSyncExternalStore(
    subscribeEmpty,
    () => true,
    () => false
  );

  const subtotal = calcularSubtotal(items);
  const pricing = calcularPricing(items, "transferencia", 0);

  if (!isClient) {
    return null;
  }

  if (items.length === 0) {
    return (
      <div className="py-6 space-y-6">
        <CheckoutSteps currentStep={1} />
        <h1 className="text-3xl font-medium text-chocolate font-serif">Tu Carrito del Taller</h1>
        <CartEmptyState />
      </div>
    );
  }

  return (
    <div className="py-4 space-y-8">
      <CheckoutSteps currentStep={1} />
      
      <div className="flex items-baseline justify-between border-b border-border/60 pb-4">
        <h1 className="text-3xl font-medium text-chocolate font-serif">
          Tu Carrito ({items.length} {items.length === 1 ? "pieza" : "piezas"})
        </h1>
        <span className="font-handwritten text-xl text-terracota">
          &quot;Piezas elegidas para iluminar tu hogar&quot;
        </span>
      </div>

      <CartReservationTimer />

      <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
        <div className="lg:col-span-7">
          <ul className="divide-y divide-border/60 space-y-4">
            {items.map((item) => (
              <CartLineItem key={item.productoId} item={item} />
            ))}
          </ul>
        </div>

        <aside className="lg:col-span-5 sticky top-24">
          <Card className="space-y-6 p-6 rounded-2xl border-border/60 bg-surface shadow-piece">
            <h2 className="text-xl font-medium font-serif text-chocolate border-b border-border/60 pb-3">
              Resumen de tu compra
            </h2>
            <div className="space-y-3 text-sm font-sans">
              <div className="flex justify-between text-chocolate">
                <span className="text-barro">Subtotal de piezas</span>
                <span className="font-semibold">{formatPrecio(subtotal)}</span>
              </div>
              {pricing.descuentoMayorista > 0 && (
                <div className="flex justify-between text-verde-menta font-semibold bg-verde-menta/10 p-2.5 rounded-lg">
                  <span>Descuento de colección</span>
                  <span>-{formatPrecio(pricing.descuentoMayorista)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border/60 pt-4 text-lg font-semibold text-chocolate">
                <span>Total a abonar</span>
                <span className="text-terracota font-serif text-xl">{formatPrecio(pricing.subtotalConDescuentos)}</span>
              </div>
            </div>

            <Link href="/checkout" className="block pt-2">
              <Button className="w-full py-3.5 text-base font-semibold rounded-full bg-terracota text-white hover:bg-terracota/90 shadow-sm transition-all hover:-translate-y-0.5">
                Iniciar Compra Segura →
              </Button>
            </Link>

            <div className="space-y-2 pt-2 border-t border-border/40 text-center">
              <Link href="/catalogo" className="inline-block text-xs font-semibold text-barro hover:text-chocolate transition-colors">
                ← Seguir explorando el catálogo
              </Link>
              <p className="text-[11px] text-barro/80">
                🔒 Embalaje especial antigolpes incluido en tu envío
              </p>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

