"use client";

import Link from "next/link";
import { useEffect, useRef, useSyncExternalStore, useState } from "react";
import { useCartItemCount, useCartStore } from "@/stores/cart-store";
import { useEncargosCartStore } from "@/stores/encargos-cart-store";

function IconBag({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  );
}

const subscribeEmpty = () => () => {};

import { cn } from "@/lib/utils/cn";

export function CartButton({ className }: { className?: string } = {}) {
  const stockCount = useCartItemCount();
  const encargosCount = useEncargosCartStore((s) => s.getTotalItems());
  const count = stockCount + encargosCount;

  const openCart = useCartStore((s) => s.openCart);
  const isClient = useSyncExternalStore(
    subscribeEmpty,
    () => true,
    () => false
  );
  const [bounce, setBounce] = useState(false);
  const prevCount = useRef(count);

  useEffect(() => {
    if (isClient && count > prevCount.current) {
      setBounce(true);
      const timer = setTimeout(() => setBounce(false), 300);
      return () => clearTimeout(timer);
    }
    prevCount.current = count;
  }, [count, isClient]);

  return (
    <button
      type="button"
      onClick={openCart}
      className={cn(
        "relative flex items-center justify-center rounded-full p-2 text-stone-700 transition-colors hover:bg-stone-100 hover:text-chocolate cursor-pointer",
        className
      )}
      aria-label={`Carrito, ${isClient ? count : 0} items`}
    >
      <IconBag />
      {isClient && count > 0 && (
        <span
          className={`absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-terracota px-1 text-[10px] font-semibold text-white ${bounce ? "badge-pop" : ""}`}
        >
          {count}
        </span>
      )}
    </button>
  );
}


export function CartEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-border/30">
        <IconBag className="h-7 w-7 text-muted" />
      </div>
      <p className="mb-1 font-medium text-foreground">Tu carrito está vacío</p>
      <p className="mb-6 text-sm text-muted">
        Explorá las piezas disponibles y encontrá tu favorita.
      </p>
      <Link
        href="/ceramica"
        className="inline-flex items-center gap-1 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all duration-200 hover:bg-primary-hover active:scale-[0.98] shadow-sm"
      >
        Explorar catálogo
      </Link>
    </div>
  );
}
