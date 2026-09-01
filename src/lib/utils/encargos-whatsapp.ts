import { formatPrecio } from "@/lib/pricing";
import type { Encargo, ConfiguracionSitio } from "@/types";

export interface WhatsAppBankInfo {
  titular?: string | null;
  cuit?: string | null;
  banco?: string | null;
  alias?: string | null;
  cbu?: string | null;
}

export function extractBankInfo(config?: ConfiguracionSitio | null): WhatsAppBankInfo {
  return {
    titular: config?.banco_titular || "Milagros Anita Ferrero",
    cuit: config?.banco_cuit || "27-43717260-4",
    banco: config?.banco_nombre || "Brubank",
    alias: config?.banco_alias || "milideasarte",
    cbu: config?.banco_cbu || "",
  };
}

export function formatBankDetailsText(bank: WhatsAppBankInfo): string {
  const lines: string[] = [];
  if (bank.banco) lines.push(`• *Banco:* ${bank.banco}`);
  if (bank.alias) lines.push(`• *Alias:* ${bank.alias}`);
  if (bank.cbu) lines.push(`• *CBU:* ${bank.cbu}`);
  if (bank.titular) lines.push(`• *Titular:* ${bank.titular}`);
  if (bank.cuit) lines.push(`• *CUIT/CUIL:* ${bank.cuit}`);

  if (lines.length === 0) return "";
  return `\n*Datos para la transferencia:*\n${lines.join("\n")}`;
}

export function getResumenPiezas(encargo: Encargo): string {
  if (encargo.items_encargo && encargo.items_encargo.length > 0) {
    const items = encargo.items_encargo.map((itRaw) => {
      const it = itRaw as Record<string, unknown>;
      const nombre = String(it.nombre_producto ?? "Pieza");
      const cant = Number(it.cantidad ?? 1);
      const medida = it.medida_seleccionada ? ` (${it.medida_seleccionada})` : "";
      const marco = it.con_marco ? " con marco" : "";
      const pers = it.es_personalizado ? " [Personalizado]" : "";
      return `${nombre}${medida}${marco}${pers}${cant > 1 ? ` x${cant}` : ""}`;
    });
    return items.join(", ");
  }

  const base = encargo.productos?.nombre || "Pieza a medida";
  const med = encargo.medida_seleccionada ? ` (${encargo.medida_seleccionada})` : "";
  const marco = encargo.con_marco ? " con marco de madera" : "";
  const pers = encargo.es_personalizado ? " [Personalizado]" : "";
  return `${base}${med}${marco}${pers}`;
}

export function cleanPhoneNumber(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, "");
  if (!digits) return "";
  // Argentina normalizer: if starts with 549, keep; if starts with 54 (no 9) and 10 digits, add 9; if local 10 digits (e.g. 351xxxxxxx), prepend 549
  if (digits.startsWith("549")) return digits;
  if (digits.startsWith("54") && digits.length >= 12) return `549${digits.slice(2)}`;
  if (digits.length === 10) return `549${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) return `549${digits.slice(1)}`;
  return digits;
}

export function buildWhatsAppLink(phone: string, message: string): string {
  const cleaned = cleanPhoneNumber(phone);
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
}

export type TipoMensajeEncargo =
  | "solicitud_aceptada"
  | "recordatorio_sena"
  | "sena_confirmada"
  | "en_proceso"
  | "saldo_pendiente"
  | "pago_final_retiro"
  | "pago_final_envio"
  | "rechazado";

export function generateMensajeWhatsApp(
  tipo: TipoMensajeEncargo,
  encargo: Encargo,
  bankInfo?: WhatsAppBankInfo,
  options?: {
    diasDemora?: number;
    codigoSeguimiento?: string;
    porcentajeSena?: number;
  },
): { titulo: string; texto: string } {
  const bank = bankInfo || extractBankInfo();
  const nombre = encargo.nombre_contacto || "Cliente";
  const resumenPiezas = getResumenPiezas(encargo);
  const total = encargo.total_estimado || 0;
  const pctSena = options?.porcentajeSena || 20;
  const montoSena = Math.round(total * (pctSena / 100));
  const montoSaldo = total - montoSena;
  const dias = options?.diasDemora || encargo.demora_estimada_dias || 30;
  const bankText = formatBankDetailsText(bank);
  const isEnvio =
    encargo.metodo_entrega?.toLowerCase().includes("envio") ||
    encargo.metodo_entrega?.toLowerCase().includes("domicilio") ||
    encargo.metodo_entrega?.toLowerCase().includes("sucursal");

  switch (tipo) {
    case "solicitud_aceptada":
      return {
        titulo: `1. Notificar Aceptación & Solicitar Seña (${pctSena}%)`,
        texto: `*MILIDEAS ARTE - ENCARGO ACEPTADO*

¡Hola ${nombre}! Espero que te encuentres muy bien.

Te confirmo que *acepté tu encargo* de:
• *${resumenPiezas}*

- *Demora estimada de producción:* ${dias} días aproximadamente.
- *Total estimado:* ${formatPrecio(total)}

Para agendar tu turno e iniciar con la confección en el taller, solicito una *seña del ${pctSena}%:* *${formatPrecio(montoSena)}*.
El saldo restante (${formatPrecio(montoSaldo)}) se abonará una vez terminada la pieza, antes de la entrega o envío.
${bankText}

Por favor, enviame el comprobante por este medio una vez realizada la transferencia. ¡Muchas gracias!`,
      };

    case "recordatorio_sena":
      return {
        titulo: `2. Recordatorio de Seña (${pctSena}%)`,
        texto: `*MILIDEAS ARTE - RECORDATORIO DE SEÑA*

¡Hola ${nombre}! Te escribo para recordarte que para iniciar la producción de tu encargo de *"${resumenPiezas}"*, estoy a la espera del ${pctSena}% de seña (*${formatPrecio(montoSena)}*).

- *Total del encargo:* ${formatPrecio(total)}
- *Monto de la seña (${pctSena}%):* ${formatPrecio(montoSena)}
${bankText}

¡Avisame cuando puedas realizar la transferencia para reservar los materiales en el taller! Muchas gracias.`,
      };

    case "sena_confirmada":
      return {
        titulo: "2. Confirmación de Seña Recibida",
        texto: `*MILIDEAS ARTE - SEÑA RECIBIDA*

¡Hola ${nombre}! Te confirmo que *recibí correctamente tu transferencia* por la seña de *${formatPrecio(montoSena)}*.

Tu encargo de *"${resumenPiezas}"* ya quedó formalmente señado y registrado en mi lista de trabajo del taller.

Te avisaré apenas inicie con la etapa de elaboración y modelado de tu pieza. ¡Muchísimas gracias por tu confianza!`,
      };

    case "en_proceso":
      return {
        titulo: `3. Aviso: En Proceso en Taller (~${dias} días)`,
        texto: `*MILIDEAS ARTE - ENCARGO EN ELABORACIÓN*

¡Hola ${nombre}! Te cuento una linda novedad: tu encargo de *"${resumenPiezas}"* *ya se encuentra en proceso de elaboración en mi taller*.

- *Tiempo estimado de trabajo artesanal:* aproximadamente ${dias} días.

Estoy cuidando cada detalle para que tu pieza quede hermosa. Te notificaré apenas esté terminada. ¡Muchas gracias por tu paciencia!`,
      };

    case "saldo_pendiente":
      return {
        titulo: `4. Pieza Terminada & Solicitud de Saldo (${100 - pctSena}%)`,
        texto: `*MILIDEAS ARTE - ¡TU ENCARGO ESTÁ LISTO!*

¡Hola ${nombre}! Tengo la alegría de contarte que *tu encargo de "${resumenPiezas}" ya está completamente terminado* y quedó hermoso.

Para coordinar la ${isEnvio ? "preparación del envío" : "entrega / retiro"}, por favor necesito que abones el saldo restante:
- *Saldo a abonar:* *${formatPrecio(montoSaldo)}* (Total: ${formatPrecio(total)})
${bankText}

Por favor, enviame el comprobante por acá una vez efectuada la transferencia para ultimar los detalles. ¡Muchas gracias!`,
      };

    case "pago_final_retiro":
      return {
        titulo: "4. Pago Confirmado - Retiro en Local/Taller",
        texto: `*MILIDEAS ARTE - PAGO CONFIRMADO & RETIRO*

¡Hola ${nombre}! Recibí con éxito el pago total de tu encargo.

Tu pedido ya está listo para retirar por el taller / local.
• Te avisaré los días y horarios disponibles para que puedas pasar a buscarlo cuando te quede cómodo.

¡Espero que disfrutes muchísimo tu nueva pieza hecha a mano!`,
      };

    case "pago_final_envio":
      return {
        titulo: "4. Pago Confirmado - Envío en Preparación",
        texto: `*MILIDEAS ARTE - PAGO CONFIRMADO & ENVÍO*

¡Hola ${nombre}! Recibí con éxito el pago total de tu encargo.

Ya estoy embalando y preparando cuidadosamente tu paquete para despacharlo de forma segura.
${options?.codigoSeguimiento ? `\n• *Código de seguimiento de envío:* *${options.codigoSeguimiento}*\n` : `\n• En estos días te estaré compartiendo el número de guía / código de seguimiento para que puedas rastrearlo en tiempo real.\n`}
¡Muchísimas gracias por confiar en Milideas Arte!`,
      };

    case "rechazado":
      return {
        titulo: "Encargo Rechazado / No Disponible",
        texto: `*MILIDEAS ARTE - CONSULTA DE ENCARGO*

¡Hola ${nombre}! Muchas gracias por tu interés en mi trabajo artesanal.

Lamentablemente en este momento no cuento con disponibilidad en el taller para tomar este encargo especial. Espero poder crear una pieza para vos en una próxima oportunidad.

¡Que tengas un excelente día!`,
      };
  }
}
