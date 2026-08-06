"use client";

import { useEffect } from "react";
import { useCartStore } from "@/stores/cart-store";

/** Mantiene el carrito local al autenticarse (merge implícito vía persist). */
export function CartHydration() {
  const setHydrated = useCartStore((s) => s.setHydrated);

  useEffect(() => {
    setHydrated();
  }, [setHydrated]);

  return null;
}
