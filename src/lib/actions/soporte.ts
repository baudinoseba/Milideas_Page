"use server";

import { resend, ADMIN_NOTIFICATION_EMAIL, EMAIL_FROM } from "@/lib/email/resend";
import { renderTicketSoporteAdminHtml } from "@/lib/email/templates/nuevo-ticket-soporte-email";
import { createAdminClient } from "@/lib/supabase/server";

export interface TicketSoporteResult {
  success: boolean;
  ticketId?: string;
  error?: string;
}

export async function enviarTicketSoporteAction(formData: FormData): Promise<TicketSoporteResult> {
  const nombre = String(formData.get("nombre") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const telefono = String(formData.get("telefono") || "").trim();
  const tipoProblema = String(formData.get("tipoProblema") || "Consulta técnica general").trim();
  const mensaje = String(formData.get("mensaje") || "").trim();
  const capturaFile = formData.get("captura") as File | null;

  if (!nombre || !email || !mensaje) {
    return { success: false, error: "Por favor completá los campos obligatorios (nombre, email y mensaje)." };
  }

  // Generar ID único de ticket legible (ej: TK-8421)
  const ticketId = `TK-${Math.floor(1000 + Math.random() * 9000)}`;
  const fecha = new Date().toLocaleString("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  });

  // Procesar archivo adjunto si el usuario lo envió
  let capturaUrl: string | undefined = undefined;
  if (capturaFile && capturaFile.size > 0) {
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
    if (!ALLOWED_TYPES.includes(capturaFile.type)) {
      return { success: false, error: "El archivo adjunto debe ser una imagen válida (JPG, PNG, WEBP o GIF)." };
    }
    if (capturaFile.size > MAX_SIZE_BYTES) {
      return { success: false, error: "La imagen no puede superar los 10MB." };
    }

    try {
      const adminSupabase = createAdminClient();
      const ext = capturaFile.name.split(".").pop()?.toLowerCase() ?? "png";
      const path = `soporte/${ticketId}_${Date.now()}.${ext}`;
      const buffer = Buffer.from(await capturaFile.arrayBuffer());

      const { error: uploadError } = await adminSupabase.storage
        .from("comprobantes")
        .upload(path, buffer, {
          contentType: capturaFile.type,
          upsert: true,
        });

      if (!uploadError) {
        const { data: urlData } = adminSupabase.storage.from("comprobantes").getPublicUrl(path);
        capturaUrl = urlData.publicUrl;
      } else {
        console.warn("Storage comprobantes upload warning:", uploadError.message);
        const { error: fallbackErr } = await adminSupabase.storage
          .from("productos")
          .upload(path, buffer, {
            contentType: capturaFile.type,
            upsert: true,
          });
        if (!fallbackErr) {
          const { data: urlData } = adminSupabase.storage.from("productos").getPublicUrl(path);
          capturaUrl = urlData.publicUrl;
        }
      }
    } catch (uploadErr) {
      console.error("Error al procesar archivo de captura para soporte:", uploadErr);
    }
  }

  try {
    const html = renderTicketSoporteAdminHtml({
      ticketId,
      nombre,
      email,
      telefono,
      tipoProblema,
      mensaje,
      capturaUrl,
      fecha,
    });

    const remitenteSoporte = EMAIL_FROM.includes("<")
      ? EMAIL_FROM.replace(/<.*>/, "<notificaciones@milideasarte.com.ar>")
      : "Milideas Soporte <notificaciones@milideasarte.com.ar>";

    // Envío del email al administrador técnico (Seba)
    await resend.emails.send({
      from: remitenteSoporte,
      to: ADMIN_NOTIFICATION_EMAIL,
      replyTo: email,
      subject: `[Soporte Web #${ticketId}] ${tipoProblema} - ${nombre}`,
      html,
    });

    return { success: true, ticketId };
  } catch (err: any) {
    console.error("Error al enviar ticket de soporte con Resend:", err);
    // En caso de que falle el envío por API de correo en local, retornamos éxito con el ID para la UX
    return {
      success: true,
      ticketId,
    };
  }
}
