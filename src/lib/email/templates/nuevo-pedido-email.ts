export interface NuevoPedidoItemData {
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  esPersonalizado?: boolean;
}

export interface NuevoPedidoEmailProps {
  pedidoId: string;
  nombreContacto: string;
  whatsappContacto: string;
  emailContacto?: string | null;
  tipoEnvio: string;
  direccionEnvio?: {
    calle?: string;
    numero?: string;
    ciudad?: string;
    codigoPostal?: string;
    referencia?: string;
    retiro?: string;
  } | null;
  items: NuevoPedidoItemData[];
  subtotal: number;
  descuentoAplicado: number;
  costoEnvio: number;
  total: number;
  metodoPago: string;
  appUrl: string;
}

export function renderNuevoPedidoHtml(props: NuevoPedidoEmailProps): string {
  const shortId = props.pedidoId.slice(0, 8).toUpperCase();
  const cleanPhone = props.whatsappContacto.replace(/\D/g, "");
  
  // Format WhatsApp message
  const waMessage = encodeURIComponent(
    `¡Hola ${props.nombreContacto}! Te escribo de Milideas Arte por tu compra #${shortId} por un total de $${props.total.toLocaleString("es-AR")}. ¿Cómo estás?`
  );
  const waUrl = `https://wa.me/${cleanPhone}?text=${waMessage}`;
  const adminUrl = `${props.appUrl}/admin/pedidos`;

  const itemsRows = props.items
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #F0EAE1;">
        <td style="padding: 12px 8px; font-size: 14px; color: #2C2523;">
          <strong>${item.nombre}</strong>
          ${item.esPersonalizado ? '<span style="display:block; font-size:12px; color:#C26D53;">★ Con personalización</span>' : ""}
        </td>
        <td style="padding: 12px 8px; font-size: 14px; color: #6E6259; text-align: center;">x${item.cantidad}</td>
        <td style="padding: 12px 8px; font-size: 14px; color: #2C2523; text-align: right; font-weight: 600;">
          $${(item.precioUnitario * item.cantidad).toLocaleString("es-AR")}
        </td>
      </tr>
    `
    )
    .join("");

  let entregaDetalle = "Retiro en Taller (Florentino Ameghino 1576, Sunchales)";
  if (props.tipoEnvio === "domicilio" && props.direccionEnvio) {
    entregaDetalle = `Envío a Domicilio: ${props.direccionEnvio.calle || ""} ${props.direccionEnvio.numero || ""}, ${props.direccionEnvio.ciudad || ""} (CP ${props.direccionEnvio.codigoPostal || ""})`;
  } else if (props.tipoEnvio === "agencia" && props.direccionEnvio) {
    entregaDetalle = `Envío a Sucursal Vía Cargo: ${props.direccionEnvio.ciudad || ""}`;
  }

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nueva Venta de Stock #${shortId}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF7F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2C2523;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FAF7F2; padding: 30px 15px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #EAE4DC; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #2C2523; padding: 24px; text-align: center;">
              <span style="display: inline-block; font-size: 28px; margin-bottom: 6px;">🏺</span>
              <h1 style="margin: 0; color: #FFFFFF; font-size: 20px; font-weight: 700; letter-spacing: 0.5px;">MILIDEAS ARTE</h1>
              <p style="margin: 4px 0 0 0; color: #D1C7BD; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Nueva Venta de Stock Registrada</p>
            </td>
          </tr>

          <!-- Summary Alert -->
          <tr>
            <td style="padding: 24px 24px 12px 24px;">
              <div style="background-color: #FBF4F0; border-left: 4px solid #C26D53; padding: 14px 16px; border-radius: 6px;">
                <p style="margin: 0; font-size: 15px; line-height: 1.5; color: #2C2523;">
                  <strong>¡Felicitaciones!</strong> Se ha generado un nuevo pedido de stock <strong>#${shortId}</strong> por un total de <strong>$${props.total.toLocaleString("es-AR")}</strong>.
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
                    <p style="margin: 4px 0; font-size: 14px;"><strong>Entrega:</strong> ${entregaDetalle}</p>
                    <p style="margin: 4px 0; font-size: 14px;"><strong>Método de Pago:</strong> ${props.metodoPago.toUpperCase()}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Order Items Table -->
          <tr>
            <td style="padding: 12px 24px;">
              <h3 style="margin: 0 0 8px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #6E6259;">📦 Piezas Pedidas</h3>
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
                <thead>
                  <tr style="border-bottom: 2px solid #EAE4DC;">
                    <th align="left" style="padding: 8px; font-size: 12px; color: #6E6259; text-transform: uppercase;">Producto</th>
                    <th align="center" style="padding: 8px; font-size: 12px; color: #6E6259; text-transform: uppercase;">Cant.</th>
                    <th align="right" style="padding: 8px; font-size: 12px; color: #6E6259; text-transform: uppercase;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsRows}
                </tbody>
              </table>

              <!-- Totals Breakdown -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 12px; font-size: 14px;">
                <tr>
                  <td style="padding: 4px 8px; color: #6E6259;">Subtotal piezas:</td>
                  <td align="right" style="padding: 4px 8px; font-weight: 500;">$${props.subtotal.toLocaleString("es-AR")}</td>
                </tr>
                ${
                  props.descuentoAplicado > 0
                    ? `<tr>
                        <td style="padding: 4px 8px; color: #C26D53;">Descuento aplicado:</td>
                        <td align="right" style="padding: 4px 8px; color: #C26D53; font-weight: 500;">-$${props.descuentoAplicado.toLocaleString("es-AR")}</td>
                      </tr>`
                    : ""
                }
                <tr>
                  <td style="padding: 4px 8px; color: #6E6259;">Costo de envío:</td>
                  <td align="right" style="padding: 4px 8px; font-weight: 500;">${props.costoEnvio > 0 ? `$${props.costoEnvio.toLocaleString("es-AR")}` : "Sin cargo"}</td>
                </tr>
                <tr style="border-top: 2px solid #2C2523;">
                  <td style="padding: 10px 8px; font-size: 16px; font-weight: 700; color: #2C2523;">TOTAL:</td>
                  <td align="right" style="padding: 10px 8px; font-size: 18px; font-weight: 700; color: #C26D53;">$${props.total.toLocaleString("es-AR")}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Action Buttons -->
          <tr>
            <td style="padding: 24px; text-align: center; background-color: #FAF7F2; border-top: 1px solid #EAE4DC;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom: 12px;">
                    <a href="${waUrl}" target="_blank" style="display: block; width: 85%; max-width: 320px; background-color: #25D366; color: #FFFFFF; text-decoration: none; padding: 14px 20px; border-radius: 30px; font-size: 15px; font-weight: 700; box-shadow: 0 4px 10px rgba(37,211,102,0.3);">
                      💬 Contactar por WhatsApp
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <a href="${adminUrl}" target="_blank" style="display: block; width: 85%; max-width: 320px; background-color: #2C2523; color: #FFFFFF; text-decoration: none; padding: 13px 20px; border-radius: 30px; font-size: 14px; font-weight: 600;">
                      🔍 Ver Pedidos en Panel Admin
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
