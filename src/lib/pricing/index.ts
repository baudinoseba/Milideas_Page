import {
  PERSONALIZATION_SURCHARGE,
  TRANSFER_DISCOUNT,
  WHOLESALE_TIERS,
} from "@/lib/utils/constants";
import type { LineaCarrito, MetodoPago, PricingBreakdown } from "@/types";

export function calcularPrecioUnitario(
  precioBase: number,
  esPersonalizable: boolean,
  personalizado: boolean,
): number {
  if (esPersonalizable && personalizado) {
    return Math.round(precioBase * (1 + PERSONALIZATION_SURCHARGE));
  }
  return precioBase;
}

export function calcularSubtotal(items: LineaCarrito[]): number {
  return items.reduce((acc, item) => {
    const unitario = calcularPrecioUnitario(
      item.precioBase,
      item.esPersonalizable,
      item.personalizado,
    );
    return acc + unitario * item.cantidad;
  }, 0);
}

export function calcularTotalPiezas(items: LineaCarrito[]): number {
  return items.reduce((acc, item) => acc + item.cantidad, 0);
}

export function calcularDescuentoMayorista(
  subtotal: number,
  totalPiezas: number,
): number {
  const tier = WHOLESALE_TIERS.find((t) => totalPiezas >= t.minPieces);
  if (!tier) return 0;
  return Math.round(subtotal * tier.discount);
}

export function calcularDescuentoTransferencia(
  subtotalConMayorista: number,
  metodoPago: MetodoPago,
): number {
  if (metodoPago !== "transferencia") return 0;
  return Math.round(subtotalConMayorista * TRANSFER_DISCOUNT);
}

/**
 * Orden: subtotal → descuento mayorista → descuento transferencia → + envío
 */
export function calcularPricing(
  items: LineaCarrito[],
  metodoPago: MetodoPago,
  costoEnvio: number,
): PricingBreakdown {
  const subtotal = calcularSubtotal(items);
  const totalPiezas = calcularTotalPiezas(items);
  const descuentoMayorista = calcularDescuentoMayorista(subtotal, totalPiezas);
  const subtotalTrasMayorista = subtotal - descuentoMayorista;
  const descuentoTransferencia = calcularDescuentoTransferencia(
    subtotalTrasMayorista,
    metodoPago,
  );
  const descuentoTotal = descuentoMayorista + descuentoTransferencia;
  const subtotalConDescuentos = subtotal - descuentoTotal;
  const total = subtotalConDescuentos + costoEnvio;

  return {
    subtotal,
    descuentoMayorista,
    descuentoTransferencia,
    descuentoTotal,
    subtotalConDescuentos,
    costoEnvio,
    total,
    totalPiezas,
  };
}

export function formatPrecio(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount);
}
