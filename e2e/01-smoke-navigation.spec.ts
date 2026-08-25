import { test, expect } from "@playwright/test";

test.describe("FASE 1: Smoke & Navegación Base", () => {
  test("SMK-01: Home page carga con status 200 y elementos clave", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);

    // Verificar presencia de header y logo/título
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();
  });

  test("SMK-02: Catálogo general y secciones por disciplina cargan correctamente", async ({ page }) => {
    await page.goto("/catalogo");
    await expect(page).toHaveURL(/\/catalogo/);

    // Debe contener el contenedor de productos o mensaje de catálogo
    const bodyText = await page.textContent("body");
    expect(bodyText).toBeTruthy();
  });

  test("SMK-03: Colecciones carga correctamente", async ({ page }) => {
    await page.goto("/colecciones");
    await expect(page).toHaveURL(/\/colecciones/);
  });

  test("SMK-04: Rutas administrativas protegidas redirigen a login", async ({ page }) => {
    await page.goto("/admin");
    // Debe redirigir a /login?redirect=/admin o similar
    await expect(page).toHaveURL(/\/login/);
  });

  test("SMK-05: Rutas de cuenta protegidas redirigen a login", async ({ page }) => {
    await page.goto("/cuenta/perfil");
    await expect(page).toHaveURL(/\/login/);
  });
});
