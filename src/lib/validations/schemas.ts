import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

export const registroSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  nombreCompleto: z.string().min(2, "Nombre requerido"),
  whatsapp: z.string().min(8, "WhatsApp requerido"),
});

export const perfilSchema = z.object({
  nombreCompleto: z.string().min(2, "Nombre requerido"),
  whatsapp: z.string().min(8, "WhatsApp requerido"),
});

export const direccionEnvioSchema = z.object({
  calle: z.string().min(2),
  numero: z.string().min(1),
  ciudad: z.string().min(2),
  codigoPostal: z.string().min(4),
  referencia: z.string().optional(),
});

export const checkoutSchema = z.object({
  nombreContacto: z.string().min(2, "Nombre requerido"),
  whatsappContacto: z.string().min(8, "WhatsApp requerido"),
  emailContacto: z.string().email("Email inválido").optional().or(z.literal("")),
  zonaLogisticaId: z.string().uuid("Seleccioná una zona").optional().or(z.literal("")),
  tipoEnvio: z.enum(["agencia", "domicilio", "taller"]),
  metodoPago: z.enum(["transferencia", "mercadopago", "efectivo"]),
  direccionEnvio: direccionEnvioSchema.optional(),
});

export const productoAdminSchema = z.object({
  nombre: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
  descripcion: z.string().optional(),
  categoriaId: z.string().uuid().optional().nullable(),
  precioBase: z.coerce.number().min(0),
  esPersonalizable: z.boolean(),
  stockDisponible: z.coerce.number().int().min(0),
  esEntregaInmediata: z.boolean(),
  fechaLanzamiento: z.string().optional().nullable(),
  activo: z.boolean(),
});

export const categoriaAdminSchema = z.object({
  nombre: z.string().min(2),
});

export const zonaLogisticaSchema = z.object({
  zonaNombre: z.string().min(2),
  precioAgencia: z.coerce.number().min(0),
  precioDomicilio: z.coerce.number().min(0),
  activa: z.boolean(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegistroInput = z.infer<typeof registroSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type ProductoAdminInput = z.infer<typeof productoAdminSchema>;
