import { test, expect } from "@playwright/test";

test.describe("Storefront", () => {
  test("home page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("catalogo page loads", async ({ page }) => {
    await page.goto("/catalogo");
    await expect(page).toHaveURL(/\/catalogo/);
  });

  test("navigation to colecciones", async ({ page }) => {
    await page.goto("/colecciones");
    await expect(page).toHaveURL("/colecciones");
  });
});

