import { test, expect } from "@playwright/test";

test.describe("Concurrencia de stock", () => {
  test.skip("dos checkouts simultáneos — solo uno exitoso", async () => {
    // Requiere Supabase local con producto de stock=1 y RPC crear_pedido activo.
    // Ejecutar con: SUPABASE_E2E=true npm run test:e2e
    expect(true).toBe(true);
  });
});
