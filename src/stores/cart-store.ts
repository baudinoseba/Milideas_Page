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
  extensionCount: number;
  hydrated: boolean;
  isOpen: boolean;
  lastAddedItem: {
    productoId: string;
    nombre: string;
    imagenUrl: string | null;
    cantidad: number;
    timestamp: number;
  } | null;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  setHydrated: () => void;
  clearLastAddedItem: () => void;
  addItem: (
    item: Omit<LineaCarrito, "cantidad"> & { cantidad?: number },
    openCart?: boolean,
  ) => void;
  removeItem: (productoId: string) => void;
  updateQty: (productoId: string, cantidad: number) => void;
  togglePersonalizacion: (productoId: string) => void;
  clearCart: () => void;
  checkExpiration: () => boolean;
  extendReservation: (minutes?: number) => boolean;
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
      extensionCount: 0,
      hydrated: false,
      isOpen: false,
      lastAddedItem: null,
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      setHydrated: () => set({ hydrated: true }),
      clearLastAddedItem: () => set({ lastAddedItem: null }),

      addItem: (item, openCart = false) => {
        const cantidad = item.cantidad ?? 1;
        const now = Date.now();
        set((state) => {
          const newExpiresAt =
            state.items.length === 0 || !state.expiresAt || now > state.expiresAt
              ? now + CART_RESERVATION_MS
              : state.expiresAt;

          const maxStock = typeof item.stockDisponible === "number" && item.stockDisponible >= 0
            ? item.stockDisponible
            : 999;

          const existing = state.items.find((i) => i.productoId === item.productoId);
          const nextLastAdded = {
            productoId: item.productoId,
            nombre: item.nombre,
            imagenUrl: item.imagenUrl || null,
            cantidad,
            timestamp: now,
          };

          if (existing) {
            const finalQty = Math.min(existing.cantidad + cantidad, maxStock);
            return {
              isOpen: openCart ? true : state.isOpen,
              expiresAt: newExpiresAt,
              lastAddedItem: nextLastAdded,
              items: state.items.map((i) =>
                i.productoId === item.productoId
                  ? { ...i, cantidad: finalQty, stockDisponible: maxStock }
                  : i,
              ),
            };
          }
          const finalQty = Math.min(cantidad, maxStock);
          return {
            isOpen: openCart ? true : state.isOpen,
            expiresAt: newExpiresAt,
            lastAddedItem: nextLastAdded,
            items: [...state.items, { ...item, cantidad: finalQty, stockDisponible: maxStock }],
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
          items: state.items.map((i) => {
            if (i.productoId === productoId) {
              const maxStock = typeof i.stockDisponible === "number" && i.stockDisponible >= 0
                ? i.stockDisponible
                : 999;
              const clampedQty = Math.min(cantidad, maxStock);
              return { ...i, cantidad: clampedQty };
            }
            return i;
          }),
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

      clearCart: () => set({ items: [], expiresAt: null, extensionCount: 0 }),

      checkExpiration: () => {
        const { expiresAt, items } = get();
        if (items.length > 0 && expiresAt && Date.now() > expiresAt) {
          set({ items: [], expiresAt: null, extensionCount: 0 });
          return true; // Expired
        }
        return false;
      },

      extendReservation: (minutes?: number) => {
        const { extensionCount, items, expiresAt } = get();
        if (items.length === 0 || extensionCount >= 2) {
          return false;
        }
        // Primera extensión: 10 min por defecto; Segunda: 5 min
        const addMinutes = minutes ?? (extensionCount === 0 ? 10 : 5);
        const baseTime = expiresAt && expiresAt > Date.now() ? expiresAt : Date.now();
        const newExpiresAt = baseTime + addMinutes * 60 * 1000;
        set({
          expiresAt: newExpiresAt,
          extensionCount: extensionCount + 1,
        });
        return true;
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
      partialize: (state) => ({
        items: state.items,
        expiresAt: state.expiresAt,
        extensionCount: state.extensionCount,
      }),
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
