/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { resend, ADMIN_NOTIFICATION_EMAIL, EMAIL_FROM } from "./resend";
import { renderNuevoPedidoHtml, NuevoPedidoItemData } from "./templates/nuevo-pedido-email";
import { renderNuevoEncargoHtml, NuevoEncargoItemData } from "./templates/nuevo-encargo-email";
import { renderRecordatorioPagoHtml } from "./templates/recordatorio-pago-email";

// Initialize Supabase Admin client for reliable background reads without session constraints
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error("Supabase credentials not configured for email notifications.");
  }
  return createSupabaseClient(supabaseUrl, serviceKey);
}

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

/**
 * CASO 1: Notifica a la administradora cuando se registra un nuevo pedido de stock.
 */
export async function notificarNuevoPedidoAdmin(pedidoId: string): Promise<boolean> {
  try {
    const supabase = getSupabaseAdmin();

    const { data: pedido, error: pedidoErr } = await supabase
      .from("pedidos")
      .select("*, items_pedido(*, productos(nombre))")
      .eq("id", pedidoId)
      .single();

    if (pedidoErr || !pedido) {
      console.error("[Email Notification] Pedido no encontrado para notificar:", pedidoId, pedidoErr);
      return false;
    }

    const items: NuevoPedidoItemData[] = (pedido.items_pedido || []).map((it: any) => ({
      nombre: it.productos?.nombre || "Pieza de autor",
      cantidad: it.cantidad,
      precioUnitario: Number(it.precio_unitario_final),
      esPersonalizado: Boolean(it.es_personalizado),
    }));

    const appUrl = getAppUrl();
    const shortId = pedidoId.slice(0, 8).toUpperCase();

    const html = renderNuevoPedidoHtml({
      pedidoId,
      nombreContacto: pedido.nombre_contacto,
      whatsappContacto: pedido.whatsapp_contacto,
      emailContacto: pedido.email_contacto,
      tipoEnvio: pedido.tipo_envio,
      direccionEnvio: pedido.direccion_envio as any,
      items,
      subtotal: Number(pedido.subtotal),
      descuentoAplicado: Number(pedido.descuento_aplicado),
      costoEnvio: Number(pedido.costo_envio),
      total: Number(pedido.total),
      metodoPago: pedido.metodo_pago,
      appUrl,
    });

    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to: ADMIN_NOTIFICATION_EMAIL,
      subject: `🏺 ¡Nueva venta de stock #${shortId}! ($${Number(pedido.total).toLocaleString("es-AR")})`,
      html,
    });

    if (result.error) {
      console.error("[Email Notification] Error enviando email de nuevo pedido:", result.error);
      return false;
    }

    console.log(`[Email Notification] Email de nuevo pedido #${shortId} enviado con éxito.`);
    return true;
  } catch (err) {
    console.error("[Email Notification] Excepción inesperada en notificarNuevoPedidoAdmin:", err);
    return false;
  }
}

/**
 * CASO 2: Notifica a la administradora cuando un cliente solicita un encargo personalizado.
 */
export async function notificarNuevoEncargoAdmin(encargoId: string): Promise<boolean> {
  try {
    const supabase = getSupabaseAdmin();

    const { data: encargo, error: encargoErr } = await supabase
      .from("encargos")
      .select("*, items_encargo(*)")
      .eq("id", encargoId)
      .single();

    if (encargoErr || !encargo) {
      console.error("[Email Notification] Encargo no encontrado para notificar:", encargoId, encargoErr);
      return false;
    }

    const items: NuevoEncargoItemData[] = (encargo.items_encargo || []).map((it: any) => ({
      nombre: it.nombre_producto || "Pieza encargada",
      tipoCatalogo: it.tipo_catalogo,
      cantidad: it.cantidad,
      precioUnitario: it.precio_unitario ? Number(it.precio_unitario) : undefined,
      medidaSeleccionada: it.medida_seleccionada,
      conMarco: Boolean(it.con_marco),
      esPersonalizado: Boolean(it.es_personalizado),
      detallePersonalizacion: it.detalle_personalizacion,
    }));

    const appUrl = getAppUrl();
    const shortId = encargoId.slice(0, 8).toUpperCase();

    const html = renderNuevoEncargoHtml({
      encargoId,
      nombreContacto: encargo.nombre_contacto,
      whatsappContacto: encargo.whatsapp_contacto,
      emailContacto: encargo.email_contacto,
      tipoCatalogo: encargo.tipo_catalogo,
      items: items.length > 0 ? items : undefined,
      esPersonalizado: encargo.es_personalizado,
      detallePersonalizacion: encargo.detalle_personalizacion,
      medidaSeleccionada: encargo.medida_seleccionada,
      conMarco: encargo.con_marco,
      metodoEntrega: encargo.metodo_entrega,
      direccionEnvio: encargo.direccion_envio as any,
      totalEstimado: Number(encargo.total_estimado),
      appUrl,
    });

    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to: ADMIN_NOTIFICATION_EMAIL,
      subject: `🎨 ¡Nueva solicitud de encargo de ${encargo.nombre_contacto}! (#${shortId})`,
      html,
    });

    if (result.error) {
      console.error("[Email Notification] Error enviando email de nuevo encargo:", result.error);
      return false;
    }

    console.log(`[Email Notification] Email de nuevo encargo #${shortId} enviado con éxito.`);
    return true;
  } catch (err) {
    console.error("[Email Notification] Excepción inesperada en notificarNuevoEncargoAdmin:", err);
    return false;
  }
}

/**
 * CASO 3: Notifica a la administradora cuando un pedido lleva 24 horas sin pago/comprobante.
 */
export async function notificarRecordatorioPagoAdmin(pedido: any): Promise<boolean> {
  try {
    const items = (pedido.items_pedido || []).map((it: any) => ({
      nombre: it.productos?.nombre || "Pieza de autor",
      cantidad: it.cantidad,
      precioUnitario: Number(it.precio_unitario_final),
    }));

    const appUrl = getAppUrl();
    const shortId = pedido.id.slice(0, 8).toUpperCase();

    const html = renderRecordatorioPagoHtml({
      pedidoId: pedido.id,
      nombreContacto: pedido.nombre_contacto,
      whatsappContacto: pedido.whatsapp_contacto,
      emailContacto: pedido.email_contacto,
      items,
      total: Number(pedido.total),
      horasTranscurridas: 24,
      horasRestantes: 24,
      appUrl,
    });

    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to: ADMIN_NOTIFICATION_EMAIL,
      subject: `⏳ Alerta: Pedido #${shortId} lleva 24h sin pago ($${Number(pedido.total).toLocaleString("es-AR")})`,
      html,
    });

    if (result.error) {
      console.error(`[Email Notification] Error enviando recordatorio de 24h para pedido #${shortId}:`, result.error);
      return false;
    }

    console.log(`[Email Notification] Recordatorio 24h para pedido #${shortId} enviado con éxito.`);
    return true;
  } catch (err) {
    console.error("[Email Notification] Excepción inesperada en notificarRecordatorioPagoAdmin:", err);
    return false;
  }
}
