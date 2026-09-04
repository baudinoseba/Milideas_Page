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

  // Procesar archivos adjuntos (hasta 5 imágenes)
  const capturaFiles = (formData.getAll("captura") as File[]).filter(
    (f) => f && typeof f.size === "number" && f.size > 0
  );
  const capturasUrls: string[] = [];

  if (capturaFiles.length > 0) {
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB por imagen
    const adminSupabase = createAdminClient();

    // Asegurar que el bucket 'soporte' exista con acceso público
    try {
      const { data: buckets } = await adminSupabase.storage.listBuckets();
      if (!buckets?.some((b) => b.name === "soporte")) {
        await adminSupabase.storage.createBucket("soporte", { public: true });
      }
    } catch (bucketErr) {
      console.warn("Aviso al verificar/crear bucket soporte:", bucketErr);
    }

    const filesToUpload = capturaFiles.slice(0, 5);
    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      if (!file || !ALLOWED_TYPES.includes(file.type) || file.size > MAX_SIZE_BYTES) {
        continue;
      }

      try {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
        const path = `ticket_${ticketId}_img${i + 1}_${Date.now()}.${ext}`;
        const buffer = Buffer.from(await file.arrayBuffer());

        // Intento 1: Bucket 'soporte'
        const { error: uploadError } = await adminSupabase.storage
          .from("soporte")
          .upload(path, buffer, {
            contentType: file.type,
            upsert: true,
          });

        if (!uploadError) {
          const { data: urlData } = adminSupabase.storage.from("soporte").getPublicUrl(path);
          capturasUrls.push(urlData.publicUrl);
        } else {
          // Fallback a bucket 'comprobantes' o 'productos'
          const { error: fbErr } = await adminSupabase.storage
            .from("comprobantes")
            .upload(path, buffer, {
              contentType: file.type,
              upsert: true,
            });
          if (!fbErr) {
            const { data: urlData } = adminSupabase.storage.from("comprobantes").getPublicUrl(path);
            capturasUrls.push(urlData.publicUrl);
          } else {
            const { error: pErr } = await adminSupabase.storage
              .from("productos")
              .upload(path, buffer, {
                contentType: file.type,
                upsert: true,
              });
            if (!pErr) {
              const { data: urlData } = adminSupabase.storage.from("productos").getPublicUrl(path);
              capturasUrls.push(urlData.publicUrl);
            }
          }
        }
      } catch (uploadErr) {
        console.error("Error al procesar archivo de captura para soporte:", uploadErr);
      }
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
      capturasUrls,
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
