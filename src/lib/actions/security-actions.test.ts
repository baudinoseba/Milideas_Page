import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase server client
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-123", email: "admin@milideas.local" } },
        error: null,
      }),
      updateUser: vi.fn().mockResolvedValue({ error: null }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({
        data: [
          {
            id: "c1000000-0000-4000-8000-000000000001",
            precio_base: 18500,
            es_personalizable: true,
            stock_disponible: 5,
            activo: true,
          },
        ],
        error: null,
      }),
      single: vi.fn().mockResolvedValue({
        data: {
          id: "order-123",
          usuario_id: "user-123",
          es_admin: true,
        },
        error: null,
      }),
      limit: vi.fn().mockReturnThis(),
      or: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    rpc: vi.fn().mockResolvedValue({ data: "fake-order-uuid", error: null }),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: "https://mock.url/file.jpg" } })),
      })),
    },
  })),
}));

// Mock queries helper for isUserAdmin
vi.mock("@/lib/supabase/queries", () => ({
  isUserAdmin: vi.fn().mockResolvedValue(true),
}));

// Mock next/cache and next/navigation
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

import {
  crearPedidoAction,
  makeMeAdminAction,
  subirComprobanteAction,
  updatePasswordAction,
  updateEmailAction,
  deleteProduccionCompletaAction,
} from "./index";

describe("FASE 8 & 13: Seguridad de Server Actions & Lógica de Negocio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("VULN-01 Defense: makeMeAdminAction es rechazada sin el ADMIN_SETUP_SECRET configurado", async () => {
    delete process.env.ADMIN_SETUP_SECRET;
    const result = await makeMeAdminAction("clave_intento");
    expect(result).toEqual({ error: "Esta función está deshabilitada en este entorno." });
  });

  it("VULN-01 Defense: makeMeAdminAction es rechazada con un secreto incorrecto", async () => {
    process.env.ADMIN_SETUP_SECRET = "super_secret_token_12345";
    const result = await makeMeAdminAction("wrong_secret");
    expect(result).toEqual({ error: "Secreto de configuración inválido." });
  });

  it("VULN-02 Defense: crearPedidoAction rechaza carritos vacíos", async () => {
    const formData = new FormData();
    formData.set("nombreContacto", "Juan Pérez");
    formData.set("whatsappContacto", "5491122334455");
    formData.set("tipoEnvio", "taller");
    formData.set("metodoPago", "transferencia");

    const result = await crearPedidoAction(formData, [], {
      subtotal: 0,
      descuentoAplicado: 0,
      costoEnvio: 0,
      total: 0,
    });

    expect(result).toEqual({ success: false, error: "El carrito está vacío" });
  });

  it("VULN-02 Defense: crearPedidoAction rechaza datos de contacto incompletos (Zod)", async () => {
    const formData = new FormData();
    formData.set("nombreContacto", "J"); // muy corto (< 2 chars)
    formData.set("whatsappContacto", ""); // vacío
    formData.set("tipoEnvio", "taller");
    formData.set("metodoPago", "transferencia");

    const items = [
      {
        producto_id: "c1000000-0000-4000-8000-000000000001",
        cantidad: 1,
        es_personalizado: false,
        precio_unitario_final: 18500,
      },
    ];

    const result = await crearPedidoAction(formData, items);
    expect(result.success).toBe(false);
  });

  it("VULN-04 & VULN-12 Defense: subirComprobanteAction rechaza tipos MIME peligrosos (.exe, .sh, .php)", async () => {
    const formData = new FormData();
    const maliciousFile = new File(["malicious payload"], "exploit.exe", {
      type: "application/x-msdownload",
    });
    formData.set("comprobante", maliciousFile);

    const result = await subirComprobanteAction("order-123", formData);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Tipo de archivo no permitido/i);
  });

  it("VULN-15 Defense: updatePasswordAction rechaza contraseñas de menos de 6 caracteres", async () => {
    const result = await updatePasswordAction("123");
    expect(result).toEqual({ error: "La contraseña debe tener al menos 6 caracteres" });
  });

  it("VULN-14 Defense: updateEmailAction rechaza emails con formato inválido", async () => {
    const result = await updateEmailAction("email_invalido_sin_arroba");
    expect(result).toEqual({ error: "Formato de email inválido" });
  });

  it("VULN-20 Defense: deleteProduccionCompletaAction rechaza IDs que no son UUIDs (evita inyección en query)", async () => {
    // Inyección de SQL/PostgREST sintaxis en targetId
    const maliciousTargetId = "123' OR '1'='1";
    const result = await deleteProduccionCompletaAction(maliciousTargetId);
    expect(result.success).toBe(false);
    expect(result.error).toBe("Identificador inválido.");
  });
});
