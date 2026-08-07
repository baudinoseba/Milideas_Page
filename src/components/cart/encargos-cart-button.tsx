"use client";

import { useEncargosCartStore } from "@/stores/encargos-cart-store";

export function EncargosCartButton() {
  const totalItems = useEncargosCartStore((s) => s.getTotalItems());
  const toggleCart = useEncargosCartStore((s) => s.toggleCart);

  if (totalItems === 0) return null;

  return (
    <button
      type="button"
      onClick={toggleCart}
      className="relative flex h-9 items-center gap-1.5 rounded-full border border-admin-accent/40 bg-admin-accent/10 px-3 text-xs font-bold text-chocolate shadow-xs transition-all hover:bg-admin-accent/20 hover:scale-[1.02] active:scale-95 font-sans"
      aria-label="Ver carrito de encargos"
    >
      <span>🎨</span>
      <span>Encargos</span>
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-admin-accent text-[10px] font-extrabold text-white">
        {totalItems}
      </span>
    </button>
  );
}
