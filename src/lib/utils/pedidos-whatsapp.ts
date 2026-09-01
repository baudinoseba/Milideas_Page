import { formatPrecio } from "@/lib/pricing";
import type { ConfiguracionSitio } from "@/types";

export type TipoMensajePedido =
  | "pago_confirmado_envio"
  | "pago_confirmado_retiro"
  | "recordatorio_pago_24h"
  | "pedido_cancelado_stock"
  | "pedido_despachado_tracking"
  | "pedido_listo_retiro";

export interface WhatsAppBankInfo {
  titular?: string;
  cuit?: string;
  banco?: string;
  alias?: string;
  cbu?: string;
}

export function extractBankInfo(configSitio?: ConfiguracionSitio | null): WhatsAppBankInfo {
  return {
    titular: configSitio?.banco_titular || "Milagros Ferrero",
    cuit: configSitio?.banco_cuit || "27-40123456-4",
    banco: configSitio?.banco_nombre || "Banco Santander",
    alias: configSitio?.banco_alias || "MILIDEAS.ARTE",
    cbu: configSitio?.banco_cbu || "0720123456789012345678",
  };
}

export function normalizeArgentinePhone(rawPhone: string): string {
  const digits = rawPhone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("54")) {
    if (digits.startsWith("549")) return digits;
    return `549${digits.slice(2)}`;
  }
  return `549${digits}`;
}

export function buildWhatsAppLink(phone: string, text: string): string {
  const normalized = normalizeArgentinePhone(phone);
  const encoded = encodeURIComponent(text);
  return `https://wa.me/${normalized}?text=${encoded}`;
}

export function getResumenItemsPedido(pedido: any): string {
  if (pedido.items_pedido && pedido.items_pedido.length > 0) {
    return pedido.items_pedido
      .map((it: any) => {
        const prodName = it.productos?.nombre || "Pieza de stock";
        const cant = it.cantidad || 1;
        return `${prodName}${cant > 1 ? ` (x${cant})` : ""}`;
      })
      .join(", ");
  }
  return "Pieza(s) de stock";
}

export function generateMensajePedidoWhatsApp(
  tipo: TipoMensajePedido,
  pedido: any,
  bankInfo?: WhatsAppBankInfo,
  extra?: {
    codigoSeguimiento?: string;
  },
): { titulo: string; texto: string } {
  const nombre = pedido.nombre_contacto || "Cliente";
  const idCorto = (pedido.id || "").slice(0, 8);
  const totalFmt = formatPrecio(pedido.total || 0);
  const piezas = getResumenItemsPedido(pedido);

  switch (tipo) {
    case "pago_confirmado_envio":
      return {
        titulo: "Confirmación de Pago & Envío en Preparación",
        texto:
          `¡Hola ${nombre}! Te confirmo que recibí tu pago de ${totalFmt} por tu compra en la tienda de Milideas (Pedido #${idCorto}).\n\n` +
          `• *Piezas:* ${piezas}\n` +
          `• *Total Abonado:* ${totalFmt}\n` +
          `• *Entrega:* Envío a domicilio/sucursal\n\n` +
          `Ya estoy preparando y embalando tus piezas con mucho cuidado para despacharlas. Te avisaré por acá ni bien tenga el código de seguimiento.\n\n` +
          `¡Muchísimas gracias por apoyar mi arte!`,
      };

    case "pago_confirmado_retiro":
      return {
        titulo: "Confirmación de Pago & Preparación para Retiro",
        texto:
          `¡Hola ${nombre}! Te confirmo que recibí tu pago de ${totalFmt} por tu compra en la tienda de Milideas (Pedido #${idCorto}).\n\n` +
          `• *Piezas:* ${piezas}\n` +
          `• *Total Abonado:* ${totalFmt}\n` +
          `• *Entrega:* Retiro en taller\n\n` +
          `Ya estoy preparando tus piezas en el taller. Ni bien estén listas y embaladas te aviso para que puedas pasar a retirarlas.\n\n` +
          `¡Muchísimas gracias!`,
      };

    case "recordatorio_pago_24h":
      return {
        titulo: "Recordatorio de Pago (24hs de Reserva)",
        texto:
          `¡Hola ${nombre}! Te escribo desde el taller de Milideas para consultarte si pudiste realizar la transferencia de tu compra en la tienda (Pedido #${idCorto}).\n\n` +
          `• *Piezas reservadas:* ${piezas}\n` +
          `• *Monto a transferir:* ${totalFmt}\n\n` +
          `• *Datos bancarios:*\n` +
          `  - Alias: *${bankInfo?.alias || "MILIDEAS.ARTE"}*\n` +
          `  - CBU: ${bankInfo?.cbu || "0720123456789012345678"}\n` +
          `  - Titular: ${bankInfo?.titular || "Milagros Ferrero"}\n\n` +
          `Recordá que guardamos la reserva por 24hs hábiles para que las piezas no queden bloqueadas en la tienda. Si ya hiciste la transferencia, por favor enviame el comprobante por acá para confirmarla. ¡Muchas gracias!`,
      };

    case "pedido_cancelado_stock":
      return {
        titulo: "Aviso de Cancelación y Liberación de Stock",
        texto:
          `¡Hola ${nombre}! Te escribo para avisarte que, al haberse cumplido el plazo de 24hs sin confirmación de transferencia, tuvimos que cancelar la orden #${idCorto} y liberar el stock de las piezas en la tienda online.\n\n` +
          `Si todavía deseás adquirirlas, podés ingresar nuevamente a la web para hacer la compra o avisarme por acá si necesitás que te las vuelva a reservar.\n\n` +
          `¡Que tengas un lindo día!`,
      };

    case "pedido_despachado_tracking":
      const tracking = extra?.codigoSeguimiento || pedido.comprobante_url || "En trámite";
      return {
        titulo: "Notificación de Envío Despachado",
        texto:
          `¡Hola ${nombre}! Te aviso que tu pedido #${idCorto} de la tienda ya fue despachado.\n\n` +
          `• *Piezas:* ${piezas}\n` +
          `• *Código de seguimiento:* *${tracking}*\n\n` +
          `Podés realizar el seguimiento de tu encomienda a través de la empresa de transporte. ¡Espero que disfrutes mucho tus piezas cuando lleguen!\n\n` +
          `Cualquier consulta quedo a disposición.`,
      };

    case "pedido_listo_retiro":
      return {
        titulo: "Aviso de Pedido Listo para Retirar",
        texto:
          `¡Hola ${nombre}! Te aviso que tu pedido #${idCorto} de la tienda ya está listo y embalado para retirar por el taller.\n\n` +
          `• *Piezas:* ${piezas}\n\n` +
          `Avisame qué día y horario te queda más cómodo pasar a buscarlo.\n\n` +
          `¡Muchas gracias!`,
      };

    default:
      return {
        titulo: `Mensaje a ${nombre}`,
        texto: `¡Hola ${nombre}! Te contacto desde Milideas Arte respecto a tu pedido #${idCorto}.`,
      };
  }
}
