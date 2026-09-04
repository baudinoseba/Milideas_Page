"use client";

import { create } from "zustand";

export interface StockAlert {
  productoId: string;
  nombre: string;
  nuevoStock: number;
}

interface StockStoreState {
  stocks: Record<string, number>;
  stockAlert: StockAlert | null;
  setStock: (productoId: string, stock: number) => void;
  setStockAlert: (alert: StockAlert | null) => void;
  clearStockAlert: () => void;
}

export const useStockStore = create<StockStoreState>((set) => ({
  stocks: {},
  stockAlert: null,
  setStock: (productoId, stock) =>
    set((state) => ({
      stocks: {
        ...state.stocks,
        [productoId]: stock,
      },
    })),
  setStockAlert: (stockAlert) => set({ stockAlert }),
  clearStockAlert: () => set({ stockAlert: null }),
}));
