import { test, expect } from "@playwright/test";

test.describe("FASE 3: Autorización & Control de Acceso (RBAC / IDOR)", () => {
  test("AC-01: Usuario anónimo es bloqueado al intentar acceder al panel de administración", async ({ page }) => {
    const adminRoutes = [
      "/admin",
      "/admin/pedidos",
      "/admin/productos",
      "/admin/categorias",
      "/admin/produccion",
      "/admin/logistica",
      "/admin/personalizacion",
      "/admin/encargos",
    ];

    for (const route of adminRoutes) {
      await page.goto(route);
      // Debe ser redirigido a login
      await expect(page).toHaveURL(/\/login/);
    }
  });

  test("AC-02: API de producción rechaza peticiones no autenticadas con 401", async ({ request }) => {
    const fakeCategoriaId = "a1000000-0000-4000-8000-000000000001";
    const response = await request.get(`/api/produccion/${fakeCategoriaId}/piezas`);
    
    // Debe devolver 401 No autenticado
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error).toMatch(/No autenticado/i);
  });

  test("AC-03: IDOR Prevention — Intento de acceso anónimo a endpoint de piezas con ID arbitrario", async ({ request }) => {
    const randomUuid = "e0000000-0000-4000-8000-000000000099";
    const response = await request.get(`/api/produccion/${randomUuid}/piezas`);
    expect(response.status()).toBe(401);
  });
});
