import { describe, expect, it } from "vitest";
import {
  calcularDescuentoMayorista,
  calcularDescuentoTransferencia,
  calcularPrecioUnitario,
  calcularPricing,
  calcularSubtotal,
} from "./index";
import type { LineaCarrito } from "@/types";

const baseItem = (overrides: Partial<LineaCarrito> = {}): LineaCarrito => ({
  productoId: "1",
  slug: "test",
  nombre: "Test",
  imagenUrl: null,
  precioBase: 10000,
  cantidad: 1,
  esPersonalizable: false,
  personalizado: false,
  stockDisponible: 5,
  ...overrides,
});

describe("pricing", () => {
  it("aplica recargo de personalización del 15%", () => {
    expect(calcularPrecioUnitario(10000, true, true)).toBe(11500);
    expect(calcularPrecioUnitario(10000, true, false)).toBe(10000);
  });

  it("aplica descuento mayorista por cantidad", () => {
    expect(calcularDescuentoMayorista(100000, 14)).toBe(0);
    expect(calcularDescuentoMayorista(100000, 15)).toBe(10000);
    expect(calcularDescuentoMayorista(100000, 20)).toBe(15000);
    expect(calcularDescuentoMayorista(100000, 35)).toBe(20000);
  });

  it("aplica descuento transferencia del 20%", () => {
    expect(calcularDescuentoTransferencia(80000, "transferencia")).toBe(16000);
    expect(calcularDescuentoTransferencia(80000, "efectivo")).toBe(0);
  });

  it("calcula pricing completo en orden correcto", () => {
    const items = [baseItem({ cantidad: 20, precioBase: 10000 })];
    const result = calcularPricing(items, "transferencia", 5000);
    expect(calcularSubtotal(items)).toBe(200000);
    expect(result.descuentoMayorista).toBe(30000);
    expect(result.descuentoTransferencia).toBe(34000);
    expect(result.total).toBe(141000);
  });
});
