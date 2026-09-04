import { describe, it, expect } from "vitest";
import { cleanPhoneNumber, formatVendorWhatsapp, VENDOR_WHATSAPP_DEFAULT } from "./encargos-whatsapp";

describe("WhatsApp Utilities", () => {
  it("VENDOR_WHATSAPP_DEFAULT debe ser el número oficial de atención", () => {
    expect(VENDOR_WHATSAPP_DEFAULT).toBe("5493493664420");
  });

  it("cleanPhoneNumber limpia espacios, guiones y signos", () => {
    expect(cleanPhoneNumber("+54 9 3493 66-4420")).toBe("5493493664420");
    expect(cleanPhoneNumber("3493-664420")).toBe("5493493664420");
    expect(cleanPhoneNumber("")).toBe("");
  });

  it("formatVendorWhatsapp formatea con código de país 549 y usa fallback oficial", () => {
    // Si se pasa número local sin 54
    expect(formatVendorWhatsapp("3493664420")).toBe("5493493664420");
    // Si ya tiene 549
    expect(formatVendorWhatsapp("5493493664420")).toBe("5493493664420");
    // Si es null o vacío, usa el default oficial
    expect(formatVendorWhatsapp(null)).toBe("5493493664420");
    expect(formatVendorWhatsapp("")).toBe("5493493664420");
    expect(formatVendorWhatsapp(undefined)).toBe("5493493664420");
  });
});
