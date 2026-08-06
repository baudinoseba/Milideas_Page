import { test, expect } from "@playwright/test";

test.describe("Storefront", () => {
  test("home page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Piezas únicas/i })).toBeVisible();
  });

  test("catalogo page loads", async ({ page }) => {
    await page.goto("/catalogo");
    await expect(page.getByRole("heading", { name: "Catálogo" })).toBeVisible();
  });

  test("navigation to drops", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /Ver drop actual/i }).click();
    await expect(page).toHaveURL("/drops");
  });
});
