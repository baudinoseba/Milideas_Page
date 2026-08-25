import { test, expect } from "@playwright/test";

test.describe("FASE 17: Cabeceras de Seguridad HTTP & Navegador", () => {
  test("SEC-01: Cabeceras de seguridad HTTP están presentes en la respuesta principal", async ({ page }) => {
    const response = await page.goto("/");
    expect(response).not.toBeNull();
    const headers = response!.headers();

    // Anti-Clickjacking
    expect(headers["x-frame-options"]?.toUpperCase()).toBe("DENY");

    // Anti-MIME Sniffing
    expect(headers["x-content-type-options"]?.toLowerCase()).toBe("nosniff");

    // Referrer Policy
    expect(headers["referrer-policy"]?.toLowerCase()).toBe("strict-origin-when-cross-origin");

    // HSTS (Strict-Transport-Security)
    expect(headers["strict-transport-security"]).toBeDefined();
    expect(headers["strict-transport-security"]).toContain("max-age=");

    // Permissions-Policy
    expect(headers["permissions-policy"]).toBeDefined();
  });

  test("SEC-02: Inspección de Storage — No existen secretos o service-role keys en localStorage", async ({ page }) => {
    await page.goto("/");

    const storageDump = await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      const dump: Record<string, string> = {};
      for (const k of keys) {
        dump[k] = localStorage.getItem(k) ?? "";
      }
      return dump;
    });

    const dumpString = JSON.stringify(storageDump);

    // No debe contener service role keys ni secrets
    expect(dumpString).not.toContain("SUPABASE_SECRET_KEY");
    expect(dumpString).not.toContain("sb_secret_");
    expect(dumpString).not.toContain("GEMINI_API_KEY");
  });
});
