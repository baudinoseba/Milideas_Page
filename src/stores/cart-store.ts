"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  calcularPrecioUnitario,
  calcularPricing,
  calcularSubtotal,
  calcularTotalPiezas,
} from "@/lib/pricing";
import type { LineaCarrito, MetodoPago } from "@/types";

export const CART_RESERVATION_MINUTES = 15;
export const CART_RESERVATION_MS = CART_RESERVATION_MINUTES * 60 * 1000;

interface CartState {
  items: LineaCarrito[];
  expiresAt: number | null;
  hydrated: boolean;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  setHydrated: () => void;
  addItem: (item: Omit<LineaCarrito, "cantidad"> & { cantidad?: number }) => void;
  removeItem: (productoId: string) => void;
  updateQty: (productoId: string, cantidad: number) => void;
  togglePersonalizacion: (productoId: string) => void;
  clearCart: () => void;
  checkExpiration: () => boolean;
  getSubtotal: () => number;
  getTotalPiezas: () => number;
  getPricing: (metodoPago: MetodoPago, costoEnvio: number) => ReturnType<typeof calcularPricing>;
  toRpcItems: () => Array<{
    producto_id: string;
    cantidad: number;
    es_personalizado: boolean;
    precio_unitario_final: number;
  }>;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      expiresAt: null,
      hydrated: false,
      isOpen: false,
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      setHydrated: () => set({ hydrated: true }),

      addItem: (item) => {
        const cantidad = item.cantidad ?? 1;
        const now = Date.now();
        set((state) => {
          const newExpiresAt =
            state.items.length === 0 || !state.expiresAt || now > state.expiresAt
              ? now + CART_RESERVATION_MS
              : state.expiresAt;

          const existing = state.items.find((i) => i.productoId === item.productoId);
          if (existing) {
            return {
              isOpen: true,
              expiresAt: newExpiresAt,
              items: state.items.map((i) =>
                i.productoId === item.productoId
                  ? { ...i, cantidad: i.cantidad + cantidad }
                  : i,
              ),
            };
          }
          return {
            isOpen: true,
            expiresAt: newExpiresAt,
            items: [...state.items, { ...item, cantidad }],
          };
        });
      },

      removeItem: (productoId) =>
        set((state) => {
          const nextItems = state.items.filter((i) => i.productoId !== productoId);
          return {
            items: nextItems,
            expiresAt: nextItems.length === 0 ? null : state.expiresAt,
          };
        }),

      updateQty: (productoId, cantidad) => {
        if (cantidad < 1) {
          get().removeItem(productoId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.productoId === productoId ? { ...i, cantidad } : i,
          ),
        }));
      },

      togglePersonalizacion: (productoId) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.productoId === productoId && i.esPersonalizable
              ? { ...i, personalizado: !i.personalizado }
              : i,
          ),
        })),

      clearCart: () => set({ items: [], expiresAt: null }),

      checkExpiration: () => {
        const { expiresAt, items } = get();
        if (items.length > 0 && expiresAt && Date.now() > expiresAt) {
          set({ items: [], expiresAt: null });
          return true; // Expired
        }
        return false;
      },

      getSubtotal: () => calcularSubtotal(get().items),
      getTotalPiezas: () => calcularTotalPiezas(get().items),
      getPricing: (metodoPago, costoEnvio) =>
        calcularPricing(get().items, metodoPago, costoEnvio),

      toRpcItems: () =>
        get().items.map((item) => ({
          producto_id: item.productoId,
          cantidad: item.cantidad,
          es_personalizado: item.personalizado,
          precio_unitario_final: calcularPrecioUnitario(
            item.precioBase,
            item.esPersonalizable,
            item.personalizado,
          ),
        })),
    }),
    {
      name: "milideas-cart",
      partialize: (state) => ({ items: state.items, expiresAt: state.expiresAt }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
        // Check expiration on rehydration
        if (state) {
          state.checkExpiration();
        }
      },
    },
  ),
);

export function useCartItemCount() {
  return useCartStore((s) => s.items.reduce((acc, i) => acc + i.cantidad, 0));
}
