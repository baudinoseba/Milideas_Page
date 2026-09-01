export interface RecordatorioPagoEmailProps {
  pedidoId: string;
  nombreContacto: string;
  whatsappContacto: string;
  emailContacto?: string | null;
  items: {
    nombre: string;
    cantidad: number;
    precioUnitario: number;
  }[];
  total: number;
  horasTranscurridas?: number;
  appUrl: string;
}

export function renderRecordatorioPagoHtml(props: RecordatorioPagoEmailProps): string {
  const shortId = props.pedidoId.slice(0, 8).toUpperCase();
  const cleanPhone = props.whatsappContacto.replace(/\D/g, "");
  const horasTranscurridas = props.horasTranscurridas ?? 24;

  const waMessage = encodeURIComponent(
    `¡Hola ${props.nombreContacto}! Te escribo de Milideas Arte sobre tu reserva del pedido #${shortId} por $${props.total.toLocaleString("es-AR")}. Quería consultarte si tuviste alguna duda con la transferencia o si necesitás los datos bancarios nuevamente. ¡Muchas gracias!`
  );
  const waUrl = `https://wa.me/${cleanPhone}?text=${waMessage}`;
  const adminUrl = `${props.appUrl}/admin/pedidos`;

  const itemsList = props.items
    .map(
      (item) => `
      <li style="margin-bottom: 4px; font-size: 14px; color: #2C2523;">
        <strong>${item.nombre}</strong> (x${item.cantidad}) — $${(item.precioUnitario * item.cantidad).toLocaleString("es-AR")}
      </li>
    `
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alerta: Pedido #${shortId} sin pago (24h)</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF7F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2C2523;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FAF7F2; padding: 30px 15px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #EAE4DC; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #8C4A32; padding: 24px; text-align: center;">
              <span style="display: inline-block; font-size: 28px; margin-bottom: 6px;">⏳</span>
              <h1 style="margin: 0; color: #FFFFFF; font-size: 20px; font-weight: 700; letter-spacing: 0.5px;">MILIDEAS ARTE</h1>
              <p style="margin: 4px 0 0 0; color: #F5DDD4; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Alerta de Pago Pendiente (24 Horas)</p>
            </td>
          </tr>

          <!-- Summary Alert -->
          <tr>
            <td style="padding: 24px 24px 12px 24px;">
              <div style="background-color: #FFF9E6; border-left: 4px solid #D97706; padding: 14px 16px; border-radius: 6px;">
                <p style="margin: 0; font-size: 15px; line-height: 1.5; color: #78350F;">
                  <strong>Atención:</strong> El pedido <strong>#${shortId}</strong> de <strong>${props.nombreContacto}</strong> fue reservado hace <strong>${horasTranscurridas} horas</strong> y aún no se registró el comprobante de pago.
                </p>
                <p style="margin: 6px 0 0 0; font-size: 13px; color: #92400E;">
                  Podés enviarle un recordatorio por WhatsApp o gestionar/liberar el stock manualmente desde el panel de administración.
                </p>
              </div>
            </td>
          </tr>

          <!-- Customer Details -->
          <tr>
            <td style="padding: 12px 24px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8F6F2; border-radius: 10px; padding: 16px;">
                <tr>
                  <td>
                    <h3 style="margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #6E6259;">👤 Datos del Comprador</h3>
                    <p style="margin: 4px 0; font-size: 14px;"><strong>Nombre:</strong> ${props.nombreContacto}</p>
                    <p style="margin: 4px 0; font-size: 14px;"><strong>WhatsApp:</strong> <a href="${waUrl}" style="color: #128C7E; text-decoration: none; font-weight: 600;">${props.whatsappContacto}</a></p>
                    ${props.emailContacto ? `<p style="margin: 4px 0; font-size: 14px;"><strong>Email:</strong> ${props.emailContacto}</p>` : ""}
                    <p style="margin: 4px 0; font-size: 14px;"><strong>Monto pendiente:</strong> <strong style="color: #8C4A32;">$${props.total.toLocaleString("es-AR")}</strong></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Retained Items -->
          <tr>
            <td style="padding: 12px 24px;">
              <h3 style="margin: 0 0 8px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #6E6259;">📦 Piezas Retenidas en Stock</h3>
              <ul style="margin: 0; padding-left: 20px;">
                ${itemsList}
              </ul>
            </td>
          </tr>

          <!-- Action Buttons -->
          <tr>
            <td style="padding: 24px; text-align: center; background-color: #FAF7F2; border-top: 1px solid #EAE4DC;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom: 12px;">
                    <a href="${waUrl}" target="_blank" style="display: block; width: 85%; max-width: 320px; background-color: #25D366; color: #FFFFFF; text-decoration: none; padding: 14px 20px; border-radius: 30px; font-size: 15px; font-weight: 700; box-shadow: 0 4px 10px rgba(37,211,102,0.3);">
                      💬 Enviar Recordatorio por WhatsApp
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <a href="${adminUrl}" target="_blank" style="display: block; width: 85%; max-width: 320px; background-color: #2C2523; color: #FFFFFF; text-decoration: none; padding: 13px 20px; border-radius: 30px; font-size: 14px; font-weight: 600;">
                      🔍 Gestionar en Panel Admin
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 16px 24px; text-align: center; font-size: 12px; color: #8F8278; background-color: #F4EFEA;">
              Milideas Arte — Sistema Automático de Notificaciones
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
