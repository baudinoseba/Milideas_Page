"use client";

import Link from "next/link";
import { useState } from "react";
import { useCartItemCount } from "@/stores/cart-store";
import { CartDrawer } from "./cart-drawer";

export function CartButton() {
  const count = useCartItemCount();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative text-sm text-muted hover:text-foreground"
        aria-label={`Carrito, ${count} items`}
      >
        Carrito
        {count > 0 && (
          <span className="absolute -right-3 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[10px] text-background">
            {count}
          </span>
        )}
      </button>
      <CartDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export function CartEmptyState() {
  return (
    <div className="py-12 text-center">
      <p className="mb-4 text-muted">Tu carrito está vacío</p>
      <Link href="/catalogo" className="text-sm underline">
        Seguir comprando
      </Link>
    </div>
  );
}
