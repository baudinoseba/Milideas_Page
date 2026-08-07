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

interface CartState {
  items: LineaCarrito[];
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
      hydrated: false,
      isOpen: false,
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      setHydrated: () => set({ hydrated: true }),

      addItem: (item) => {
        const cantidad = item.cantidad ?? 1;
        set((state) => {
          const existing = state.items.find((i) => i.productoId === item.productoId);
          if (existing) {
            return {
              isOpen: true,
              items: state.items.map((i) =>
                i.productoId === item.productoId
                  ? { ...i, cantidad: i.cantidad + cantidad }
                  : i,
              ),
            };
          }
          return {
            isOpen: true,
            items: [...state.items, { ...item, cantidad }],
          };
        });
      },

      removeItem: (productoId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productoId !== productoId),
        })),

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

      clearCart: () => set({ items: [] }),

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
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);


export function useCartItemCount() {
  return useCartStore((s) => s.items.reduce((acc, i) => acc + i.cantidad, 0));
}
