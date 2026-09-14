"use client";

import { create } from "zustand";

export interface TiendaStatusState {
  stockCeramicaAbierto: boolean;
  encargosCeramicaAbiertos: boolean;
  stockIlustracionAbierto: boolean;
  encargosIlustracionAbiertos: boolean;
  // Convenience getters
  tiendaStockAbierta: boolean;
  encargosAbiertos: boolean;
  isInitialized: boolean;
  setTiendaStatus: (status: {
    stockCeramicaAbierto?: boolean;
    encargosCeramicaAbiertos?: boolean;
    stockIlustracionAbierto?: boolean;
    encargosIlustracionAbiertos?: boolean;
    tiendaStockAbierta?: boolean;
    encargosAbiertos?: boolean;
  }) => void;
}

export const useTiendaStatusStore = create<TiendaStatusState>((set) => ({
  stockCeramicaAbierto: true,
  encargosCeramicaAbiertos: true,
  stockIlustracionAbierto: true,
  encargosIlustracionAbiertos: true,
  tiendaStockAbierta: true,
  encargosAbiertos: true,
  isInitialized: false,
  setTiendaStatus: (status) =>
    set((state) => {
      const stockCeramica =
        typeof status.stockCeramicaAbierto === "boolean"
          ? status.stockCeramicaAbierto
          : state.stockCeramicaAbierto;

      const encargosCeramica =
        typeof status.encargosCeramicaAbiertos === "boolean"
          ? status.encargosCeramicaAbiertos
          : state.encargosCeramicaAbiertos;

      const stockIlustracion =
        typeof status.stockIlustracionAbierto === "boolean"
          ? status.stockIlustracionAbierto
          : state.stockIlustracionAbierto;

      const encargosIlustracion =
        typeof status.encargosIlustracionAbiertos === "boolean"
          ? status.encargosIlustracionAbiertos
          : state.encargosIlustracionAbiertos;

      return {
        stockCeramicaAbierto: stockCeramica,
        encargosCeramicaAbiertos: encargosCeramica,
        stockIlustracionAbierto: stockIlustracion,
        encargosIlustracionAbiertos: encargosIlustracion,
        tiendaStockAbierta: stockCeramica && stockIlustracion,
        encargosAbiertos: encargosCeramica && encargosIlustracion,
        isInitialized: true,
      };
    }),
}));
