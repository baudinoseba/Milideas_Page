import { describe, expect, it } from "vitest";
import { calcularCostoEnvio } from "./index";

describe("shipping", () => {
  const zona = { precio_agencia: 4500, precio_domicilio: 6500 };

  it("retorna precio de agencia", () => {
    expect(calcularCostoEnvio(zona, "agencia")).toBe(4500);
  });

  it("retorna precio de domicilio", () => {
    expect(calcularCostoEnvio(zona, "domicilio")).toBe(6500);
  });
});
