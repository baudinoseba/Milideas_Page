export interface NuevoEncargoItemData {
  nombre: string;
  tipoCatalogo?: string;
  cantidad: number;
  precioUnitario?: number;
  medidaSeleccionada?: string | null;
  conMarco?: boolean;
  esPersonalizado?: boolean;
  detallePersonalizacion?: string | null;
}

export interface NuevoEncargoEmailProps {
  encargoId: string;
  nombreContacto: string;
  whatsappContacto: string;
  emailContacto?: string | null;
  tipoCatalogo: string;
  items?: NuevoEncargoItemData[];
  esPersonalizado?: boolean;
  detallePersonalizacion?: string | null;
  medidaSeleccionada?: string | null;
  conMarco?: boolean;
  metodoEntrega: string;
  direccionEnvio?: {
    calle?: string;
    numero?: string;
    ciudad?: string;
    codigoPostal?: string;
    referencia?: string;
    provincia?: string;
  } | null;
  totalEstimado: number;
  appUrl: string;
}

export function renderNuevoEncargoHtml(props: NuevoEncargoEmailProps): string {
  const shortId = props.encargoId.slice(0, 8).toUpperCase();
  const cleanPhone = props.whatsappContacto.replace(/\D/g, "");

  const waMessage = encodeURIComponent(
    `¡Hola ${props.nombreContacto}! Te escribo desde Milideas Arte por tu solicitud de encargo especial #${shortId}. Recibí tu propuesta y me gustaría coordinar los tiempos y detalles con vos.`
  );
  const waUrl = `https://wa.me/${cleanPhone}?text=${waMessage}`;
  const adminUrl = `${props.appUrl}/admin/encargos`;

  // Render items if multiple, or single fallback
  let itemsContentHtml = "";
  if (props.items && props.items.length > 0) {
    itemsContentHtml = props.items
      .map((item, idx) => {
        const specs: string[] = [];
        if (item.medidaSeleccionada) specs.push(`Medida: ${item.medidaSeleccionada}`);
        if (item.conMarco) specs.push("Con marco de madera");
        if (item.esPersonalizado) {
          specs.push(
            `Personalizado: ${item.detallePersonalizacion ? `"${item.detallePersonalizacion}"` : "Sí"}`
          );
        }

        return `
        <div style="background-color: #FFFFFF; border: 1px solid #EAE4DC; border-radius: 8px; padding: 12px; margin-bottom: 8px;">
          <p style="margin: 0; font-size: 14px; font-weight: 700; color: #2C2523;">
            ${idx + 1}. ${item.nombre} <span style="font-weight: normal; color: #6E6259;">(x${item.cantidad})</span>
          </p>
          ${
            specs.length > 0
              ? `<ul style="margin: 6px 0 0 0; padding-left: 18px; font-size: 13px; color: #6E6259;">
                  ${specs.map((s) => `<li>${s}</li>`).join("")}
                </ul>`
              : ""
          }
        </div>
      `;
      })
      .join("");
  } else {
    // Single encargo fallback
    const specs: string[] = [];
    if (props.medidaSeleccionada) specs.push(`Medida: ${props.medidaSeleccionada}`);
    if (props.conMarco) specs.push("Con marco de madera");
    if (props.esPersonalizado) {
      specs.push(`Personalizado: ${props.detallePersonalizacion ? `"${props.detallePersonalizacion}"` : "Sí"}`);
    }

    itemsContentHtml = `
      <div style="background-color: #FFFFFF; border: 1px solid #EAE4DC; border-radius: 8px; padding: 12px;">
        <p style="margin: 0; font-size: 14px; font-weight: 700; color: #2C2523;">
          Rubro: ${props.tipoCatalogo.toUpperCase()}
        </p>
        ${
          specs.length > 0
            ? `<ul style="margin: 6px 0 0 0; padding-left: 18px; font-size: 13px; color: #6E6259;">
                ${specs.map((s) => `<li>${s}</li>`).join("")}
              </ul>`
            : ""
        }
      </div>
    `;
  }

  let entregaDetalle = "Retiro en Taller (Florentino Ameghino 1576, Sunchales)";
  if (props.metodoEntrega === "domicilio" && props.direccionEnvio) {
    entregaDetalle = `Envío a Domicilio: ${props.direccionEnvio.calle || ""} ${props.direccionEnvio.numero || ""}, ${props.direccionEnvio.ciudad || ""} (${props.direccionEnvio.provincia || ""})`;
  } else if (props.metodoEntrega === "agencia" && props.direccionEnvio) {
    entregaDetalle = `Envío a Sucursal Vía Cargo: ${props.direccionEnvio.ciudad || ""} (${props.direccionEnvio.provincia || ""})`;
  }

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nuevo Encargo Especial #${shortId}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF7F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2C2523;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FAF7F2; padding: 30px 15px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #EAE4DC; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #C26D53; padding: 24px; text-align: center;">
              <span style="display: inline-block; font-size: 28px; margin-bottom: 6px;">🎨</span>
              <h1 style="margin: 0; color: #FFFFFF; font-size: 20px; font-weight: 700; letter-spacing: 0.5px;">MILIDEAS ARTE</h1>
              <p style="margin: 4px 0 0 0; color: #FCECE8; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Nueva Solicitud de Encargo</p>
            </td>
          </tr>

          <!-- Summary Alert -->
          <tr>
            <td style="padding: 24px 24px 12px 24px;">
              <div style="background-color: #FBF4F0; border-left: 4px solid #C26D53; padding: 14px 16px; border-radius: 6px;">
                <p style="margin: 0; font-size: 15px; line-height: 1.5; color: #2C2523;">
                  <strong>¡Nueva solicitud recibida!</strong> <strong>${props.nombreContacto}</strong> solicitó un encargo personalizado <strong>#${shortId}</strong>.
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
                    <h3 style="margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #6E6259;">👤 Datos del Solicitante</h3>
                    <p style="margin: 4px 0; font-size: 14px;"><strong>Nombre:</strong> ${props.nombreContacto}</p>
                    <p style="margin: 4px 0; font-size: 14px;"><strong>WhatsApp:</strong> <a href="${waUrl}" style="color: #128C7E; text-decoration: none; font-weight: 600;">${props.whatsappContacto}</a></p>
                    ${props.emailContacto ? `<p style="margin: 4px 0; font-size: 14px;"><strong>Email:</strong> ${props.emailContacto}</p>` : ""}
                    <p style="margin: 4px 0; font-size: 14px;"><strong>Entrega solicitada:</strong> ${entregaDetalle}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Custom Order Details -->
          <tr>
            <td style="padding: 12px 24px;">
              <h3 style="margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #6E6259;">✨ Piezas Solicitadas</h3>
              ${itemsContentHtml}

              <!-- Total Estimated -->
              <div style="margin-top: 14px; padding: 12px; background-color: #F8F6F2; border-radius: 8px; text-align: right;">
                <span style="font-size: 14px; color: #6E6259;">Presupuesto Estimado: </span>
                <strong style="font-size: 18px; color: #C26D53;">$${props.totalEstimado.toLocaleString("es-AR")}</strong>
              </div>
            </td>
          </tr>

          <!-- Action Buttons -->
          <tr>
            <td style="padding: 24px; text-align: center; background-color: #FAF7F2; border-top: 1px solid #EAE4DC;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom: 12px;">
                    <a href="${waUrl}" target="_blank" style="display: block; width: 85%; max-width: 320px; background-color: #25D366; color: #FFFFFF; text-decoration: none; padding: 14px 20px; border-radius: 30px; font-size: 15px; font-weight: 700; box-shadow: 0 4px 10px rgba(37,211,102,0.3);">
                      💬 Chatear por WhatsApp
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <a href="${adminUrl}" target="_blank" style="display: block; width: 85%; max-width: 320px; background-color: #2C2523; color: #FFFFFF; text-decoration: none; padding: 13px 20px; border-radius: 30px; font-size: 14px; font-weight: 600;">
                      🎨 Ver Encargos en Panel Admin
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
