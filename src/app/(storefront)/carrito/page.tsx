"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CartLineItem } from "@/components/cart/cart-line-item";
import { CartEmptyState } from "@/components/cart/cart-button";
import { formatPrecio } from "@/lib/pricing";
import { useCartStore } from "@/stores/cart-store";

export default function CarritoPage() {
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.getSubtotal());
  const pricing = useCartStore((s) => s.getPricing("transferencia", 0));

  if (items.length === 0) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-medium">Carrito</h1>
        <CartEmptyState />
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h1 className="mb-6 text-2xl font-medium">Carrito</h1>
        <ul className="space-y-4">
          {items.map((item) => (
            <CartLineItem key={item.productoId} item={item} />
          ))}
        </ul>
      </div>
      <aside className="h-fit space-y-4 rounded-sm border border-border p-6">
        <h2 className="font-medium">Resumen</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Subtotal</span>
            <span>{formatPrecio(subtotal)}</span>
          </div>
          {pricing.descuentoMayorista > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>Descuento mayorista</span>
              <span>-{formatPrecio(pricing.descuentoMayorista)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-border pt-2 font-medium">
            <span>Total estimado</span>
            <span>{formatPrecio(pricing.subtotalConDescuentos)}</span>
          </div>
          <p className="text-xs text-muted">
            Descuento por transferencia (-20%) se aplica en checkout
          </p>
        </div>
        <Link href="/checkout">
          <Button className="w-full">Ir al checkout</Button>
        </Link>
      </aside>
    </div>
  );
}
