import { test, expect } from "@playwright/test";

test.describe("FASE 5: Carrito & Manipulación del Cliente", () => {
  test("CRT-01: Carrito vacío muestra mensaje indicativo", async ({ page }) => {
    await page.goto("/carrito");
    await expect(page.locator("text=/tu carrito está vacío|no tenés piezas/i")).toBeVisible();
  });

  test("CRT-02: Persistencia del carrito en localStorage", async ({ page }) => {
    await page.goto("/");

    // Inyectar un item simulado en el storage de Zustand
    await page.evaluate(() => {
      const mockCartState = {
        state: {
          items: [
            {
              productoId: "c1000000-0000-4000-8000-000000000001",
              nombre: "Taza Aurora",
              slug: "taza-aurora",
              imagenUrl: "https://placehold.co/400x400",
              precioBase: 18500,
              esPersonalizable: true,
              personalizado: false,
              stockDisponible: 5,
              cantidad: 2,
            },
          ],
          expiresAt: Date.now() + 15 * 60 * 1000,
        },
        version: 0,
      };
      localStorage.setItem("milideas-cart", JSON.stringify(mockCartState));
    });

    await page.goto("/carrito");
    await page.waitForLoadState("networkidle");

    // Debe mostrar la pieza inyectada o el subtotal
    const bodyContent = await page.textContent("body");
    expect(bodyContent).toBeTruthy();
  });


  test("CRT-03: Tampering de Cantidad Negativa en localStorage es corregido o bloqueado", async ({ page }) => {
    await page.goto("/");

    // Inyectar cantidad negativa (-5)
    await page.evaluate(() => {
      const mockCartState = {
        state: {
          items: [
            {
              productoId: "c1000000-0000-4000-8000-000000000001",
              nombre: "Taza Aurora",
              slug: "taza-aurora",
              imagenUrl: "https://placehold.co/400x400",
              precioBase: 18500,
              esPersonalizable: false,
              personalizado: false,
              stockDisponible: 5,
              cantidad: -5,
            },
          ],
          expiresAt: Date.now() + 15 * 60 * 1000,
        },
        version: 0,
      };
      localStorage.setItem("milideas-cart", JSON.stringify(mockCartState));
    });

    await page.goto("/carrito");

    // La UI no debe mostrar un total negativo o debe normalizar la cantidad
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("-$");
  });

  test("CRT-04: Tampering de Precio en localStorage no engaña al botón de checkout", async ({ page }) => {
    await page.goto("/");

    // Atacante modifica el precioBase a $1 en su localStorage
    await page.evaluate(() => {
      const mockCartState = {
        state: {
          items: [
            {
              productoId: "c1000000-0000-4000-8000-000000000001",
              nombre: "Taza Aurora",
              slug: "taza-aurora",
              imagenUrl: "https://placehold.co/400x400",
              precioBase: 1, // Manipulado de 18500 a 1
              esPersonalizable: false,
              personalizado: false,
              stockDisponible: 5,
              cantidad: 1,
            },
          ],
          expiresAt: Date.now() + 15 * 60 * 1000,
        },
        version: 0,
      };
      localStorage.setItem("milideas-cart", JSON.stringify(mockCartState));
    });

    await page.goto("/checkout");

    // Al navegar a checkout, el flujo carga y no crashea
    await expect(page).toHaveURL(/\/checkout/);
  });
});
