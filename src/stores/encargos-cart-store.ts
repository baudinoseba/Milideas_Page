import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TipoCatalogo } from "@/types";

export interface ItemEncargoCart {
  id: string;
  productoId: string;
  slug: string;
  nombre: string;
  imagenUrl: string | null;
  tipoCatalogo: TipoCatalogo;
  precioBase: number;
  esPersonalizado: boolean;
  detallePersonalizacion: string;
  medidaSeleccionada: string | null;
  adicionalMedida: number;
  conMarco: boolean;
  adicionalMarco: number;
  recargoPersonalizado: number;
  precioUnitarioFinal: number;
  cantidad: number;
}

interface EncargosCartState {
  items: ItemEncargoCart[];
  isOpen: boolean;

  addEncargoItem: (item: Omit<ItemEncargoCart, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, cantidad: number) => void;
  updateItem: (oldId: string, item: Omit<ItemEncargoCart, "id">) => void;
  clearCart: () => void;

  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;

  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useEncargosCartStore = create<EncargosCartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addEncargoItem: (newItem) => {
        const itemKey = `${newItem.productoId}-${newItem.medidaSeleccionada || ""}-${newItem.conMarco ? "marco" : "nomarco"}-${newItem.esPersonalizado ? "custom" : "std"}-${Date.now()}`;

        set((state) => {
          return {
            items: [...state.items, { ...newItem, id: itemKey }],
            isOpen: true,
          };
        });
      },

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),

      updateQuantity: (id, cantidad) =>
        set((state) => ({
          items: cantidad <= 0
            ? state.items.filter((i) => i.id !== id)
            : state.items.map((i) => (i.id === id ? { ...i, cantidad } : i)),
        })),

      updateItem: (id, newItem) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...newItem, id } : i,
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      getTotalItems: () => {
        return get().items.reduce((sum, i) => sum + i.cantidad, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce((sum, i) => sum + i.precioUnitarioFinal * i.cantidad, 0);
      },
    }),
    {
      name: "milideas-encargos-cart",
    },
  ),
);
