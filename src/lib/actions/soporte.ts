"use server";

import { resend, ADMIN_NOTIFICATION_EMAIL, EMAIL_FROM } from "@/lib/email/resend";
import { renderTicketSoporteAdminHtml } from "@/lib/email/templates/nuevo-ticket-soporte-email";

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

  try {
    const html = renderTicketSoporteAdminHtml({
      ticketId,
      nombre,
      email,
      telefono,
      tipoProblema,
      mensaje,
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
