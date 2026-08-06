"use client";

import Link from "next/link";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart-store";
import { formatPrecio } from "@/lib/pricing";
import { CartLineItem } from "./cart-line-item";
import { CartEmptyState } from "./cart-button";

export function CartDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.getSubtotal());

  return (
    <Drawer open={open} onClose={onClose} title="Carrito">
      {items.length === 0 ? (
        <CartEmptyState />
      ) : (
        <div className="flex h-full flex-col gap-4">
          <ul className="space-y-4">
            {items.map((item) => (
              <CartLineItem key={item.productoId} item={item} compact />
            ))}
          </ul>
          <div className="mt-auto space-y-3 border-t border-border pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Subtotal</span>
              <span>{formatPrecio(subtotal)}</span>
            </div>
            <Link href="/carrito" onClick={onClose}>
              <Button className="w-full">Ver carrito</Button>
            </Link>
          </div>
        </div>
      )}
    </Drawer>
  );
}
