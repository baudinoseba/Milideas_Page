import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  console.warn("⚠️ [Resend] RESEND_API_KEY no está configurada en las variables de entorno.");
}

export const resend = new Resend(apiKey || "missing-api-key");

export const ADMIN_NOTIFICATION_EMAIL =
  process.env.ADMIN_NOTIFICATION_EMAIL || "baudinoseba@gmail.com";

export const EMAIL_FROM =
  process.env.EMAIL_FROM || "Milideas Arte <notificaciones@milideasarte.com.ar>";
