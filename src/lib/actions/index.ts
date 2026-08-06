"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { checkoutSchema } from "@/lib/validations/schemas";
import type { CrearPedidoItem } from "@/types";

export type CheckoutResult =
  | { success: true; pedidoId: string }
  | { success: false; error: string };

export async function crearPedidoAction(
  formData: FormData,
  items: CrearPedidoItem[],
  pricing: {
    subtotal: number;
    descuentoAplicado: number;
    costoEnvio: number;
    total: number;
  },
): Promise<CheckoutResult> {
  const raw = {
    nombreContacto: formData.get("nombreContacto"),
    whatsappContacto: formData.get("whatsappContacto"),
    emailContacto: formData.get("emailContacto") ?? "",
    zonaLogisticaId: formData.get("zonaLogisticaId"),
    tipoEnvio: formData.get("tipoEnvio"),
    metodoPago: formData.get("metodoPago"),
    direccionEnvio:
      formData.get("tipoEnvio") === "domicilio"
        ? {
            calle: formData.get("calle"),
            numero: formData.get("numero"),
            ciudad: formData.get("ciudad"),
            codigoPostal: formData.get("codigoPostal"),
            referencia: formData.get("referencia") || undefined,
          }
        : undefined,
  };

  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Datos inválidos" };
  }

  if (items.length === 0) {
    return { success: false, error: "El carrito está vacío" };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("crear_pedido", {
    p_items: items,
    p_nombre_contacto: parsed.data.nombreContacto,
    p_whatsapp_contacto: parsed.data.whatsappContacto,
    p_email_contacto: parsed.data.emailContacto || "",
    p_tipo_envio: parsed.data.tipoEnvio,
    p_zona_logistica_id: parsed.data.zonaLogisticaId,
    p_direccion_envio: parsed.data.direccionEnvio ?? null,
    p_metodo_pago: parsed.data.metodoPago,
    p_subtotal: pricing.subtotal,
    p_descuento_aplicado: pricing.descuentoAplicado,
    p_costo_envio: pricing.costoEnvio,
    p_total: pricing.total,
  });

  if (error) {
    if (error.message.includes("STOCK_INSUFICIENTE")) {
      return {
        success: false,
        error:
          "Esta pieza acaba de ser reservada por otro comprador. Revisá tu carrito.",
      };
    }
    return { success: false, error: error.message };
  }

  revalidatePath("/catalogo");
  return { success: true, pedidoId: data };
}

export async function subirComprobanteAction(
  pedidoId: string,
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const file = formData.get("comprobante") as File | null;
  if (!file || file.size === 0) {
    return { success: false, error: "Seleccioná un archivo" };
  }

  const supabase = await createClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${pedidoId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("comprobantes")
    .upload(path, file);

  if (uploadError) {
    return { success: false, error: uploadError.message };
  }

  const { data: urlData } = supabase.storage.from("comprobantes").getPublicUrl(path);

  const { error: rpcError } = await supabase.rpc("actualizar_comprobante", {
    p_pedido_id: pedidoId,
    p_comprobante_url: urlData.publicUrl,
  });

  if (rpcError) {
    return { success: false, error: rpcError.message };
  }

  revalidatePath(`/checkout/exito/${pedidoId}`);
  return { success: true };
}

export async function loginAction(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email")),
    password: String(formData.get("password")),
  });
  if (error) return { error: error.message };
  return { success: true };
}

export async function registroAction(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));
  const nombreCompleto = String(formData.get("nombreCompleto"));
  const whatsapp = String(formData.get("whatsapp"));

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nombre_completo: nombreCompleto },
    },
  });

  if (error) return { error: error.message };

  if (data.user) {
    await supabase
      .from("perfiles")
      .update({ nombre_completo: nombreCompleto, whatsapp })
      .eq("id", data.user.id);
  }

  return { success: true };
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function updatePerfilAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { error } = await supabase
    .from("perfiles")
    .update({
      nombre_completo: String(formData.get("nombreCompleto")),
      whatsapp: String(formData.get("whatsapp")),
    })
    .eq("id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/cuenta/perfil");
  return { success: true };
}

export async function confirmarPagoAction(pedidoId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("confirmar_pago", { p_pedido_id: pedidoId });
  if (error) return { error: error.message };
  revalidatePath("/admin/pedidos");
  return { success: true };
}

export async function cancelarPedidoAction(pedidoId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancelar_pedido", { p_pedido_id: pedidoId });
  if (error) return { error: error.message };
  revalidatePath("/admin/pedidos");
  revalidatePath("/catalogo");
  return { success: true };
}

export async function saveProductoAction(
  formData: FormData,
  productoId?: string,
) {
  const supabase = await createClient();
  const payload = {
    nombre: String(formData.get("nombre")),
    slug: String(formData.get("slug")),
    descripcion: String(formData.get("descripcion") || "") || null,
    categoria_id: (formData.get("categoriaId") as string) || null,
    precio_base: Number(formData.get("precioBase")),
    es_personalizable: formData.get("esPersonalizable") === "on",
    stock_disponible: Number(formData.get("stockDisponible")),
    es_entrega_inmediata: formData.get("esEntregaInmediata") === "on",
    fecha_lanzamiento: (formData.get("fechaLanzamiento") as string) || null,
    activo: formData.get("activo") === "on",
  };

  if (productoId) {
    const { error } = await supabase.from("productos").update(payload).eq("id", productoId);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("productos").insert(payload);
    if (error) return { error: error.message };
  }

  revalidatePath("/admin/productos");
  revalidatePath("/catalogo");
  return { success: true };
}

export async function saveCategoriaAction(formData: FormData, id?: string) {
  const supabase = await createClient();
  const nombre = String(formData.get("nombre"));
  if (id) {
    const { error } = await supabase.from("categorias").update({ nombre }).eq("id", id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("categorias").insert({ nombre });
    if (error) return { error: error.message };
  }
  revalidatePath("/admin/categorias");
  return { success: true };
}

export async function saveZonaAction(formData: FormData, id?: string) {
  const supabase = await createClient();
  const payload = {
    zona_nombre: String(formData.get("zonaNombre")),
    precio_agencia: Number(formData.get("precioAgencia")),
    precio_domicilio: Number(formData.get("precioDomicilio")),
    activa: formData.get("activa") === "on",
  };
  if (id) {
    const { error } = await supabase.from("configuracion_logistica").update(payload).eq("id", id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("configuracion_logistica").insert(payload);
    if (error) return { error: error.message };
  }
  revalidatePath("/admin/logistica");
  return { success: true };
}
