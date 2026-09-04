import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  console.warn("⚠️ [Resend] RESEND_API_KEY no está configurada en las variables de entorno.");
}

export const resend = new Resend(apiKey || "missing-api-key");

// Destinatario de pedidos y encargos (Milagros / Artista)
export const ARTISTA_NOTIFICATION_EMAIL =
  process.env.ARTISTA_NOTIFICATION_EMAIL || "ferreromilagros1576@gmail.com";

// Destinatario de reportes de soporte técnico web (Sebastián / Soporte)
export const SOPORTE_NOTIFICATION_EMAIL =
  process.env.SOPORTE_NOTIFICATION_EMAIL || "baudinoseba@gmail.com";

// Alias de compatibilidad previa
export const ADMIN_NOTIFICATION_EMAIL = ARTISTA_NOTIFICATION_EMAIL;

// Remitentes oficiales con dominio verificado milideasarte.com.ar
// Si en Vercel quedó configurado 'onboarding@resend.dev', se ignora y se fuerza el dominio verificado
const rawEmailFrom = process.env.EMAIL_FROM;
export const EMAIL_FROM =
  rawEmailFrom && !rawEmailFrom.includes("resend.dev")
    ? rawEmailFrom
    : "Milideas Arte <notificaciones@milideasarte.com.ar>";

const rawEmailFromSoporte = process.env.EMAIL_FROM_SOPORTE;
export const EMAIL_FROM_SOPORTE =
  rawEmailFromSoporte && !rawEmailFromSoporte.includes("resend.dev")
    ? rawEmailFromSoporte
    : "Milideas Soporte <soporte@milideasarte.com.ar>";

