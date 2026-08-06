import type { StockStatus } from "@/types";

export function getStockStatus(
  stockDisponible: number,
  tieneReservaActiva = false,
): StockStatus {
  if (stockDisponible > 0) return "disponible";
  if (tieneReservaActiva) return "no_disponible";
  return "bajo_pedido";
}

export function puedeComprar(status: StockStatus): boolean {
  return status === "disponible" || status === "bajo_pedido";
}

export function getStockLabel(status: StockStatus): string {
  switch (status) {
    case "disponible":
      return "Disponible";
    case "bajo_pedido":
      return "Bajo pedido";
    case "no_disponible":
      return "No disponible";
  }
}
