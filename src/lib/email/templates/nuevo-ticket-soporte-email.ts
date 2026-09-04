export interface TicketSoporteEmailProps {
  ticketId: string;
  nombre: string;
  email: string;
  telefono?: string;
  tipoProblema: string;
  mensaje: string;
  capturasUrls?: string[];
  fecha: string;
}

export function renderTicketSoporteAdminHtml(props: TicketSoporteEmailProps): string {
  const cleanPhone = props.telefono ? props.telefono.replace(/\D/g, "") : "";
  const waUrl = cleanPhone
    ? `https://wa.me/${cleanPhone.startsWith("54") ? cleanPhone : `549${cleanPhone}`}?text=${encodeURIComponent(
        `¡Hola ${props.nombre}! Te escribo de Soporte Técnico de Milideas Arte por tu ticket #${props.ticketId}.`
      )}`
    : null;

  return `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>Nuevo Ticket de Soporte #${props.ticketId}</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #FAF7F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2C2523;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FAF7F2; padding: 30px 15px;">
      <tr>
        <td align="center">
          <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; border: 1px solid #EAE5DE; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
            
            <!-- Cabecera -->
            <tr>
              <td style="background-color: #3B2E2A; padding: 24px 30px; text-align: left;">
                <table width="100%">
                  <tr>
                    <td>
                      <span style="background-color: #C26D53; color: #FFFFFF; font-size: 11px; font-weight: 700; padding: 4px 10px; rounded: 12px; border-radius: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                        Soporte Técnico Web
                      </span>
                      <h1 style="color: #FFFFFF; font-size: 20px; margin: 8px 0 0 0; font-family: Georgia, serif; font-weight: normal;">
                        Nuevo Ticket #${props.ticketId}
                      </h1>
                    </td>
                    <td align="right" style="color: #FAF7F2; font-size: 12px; opacity: 0.8;">
                      ${props.fecha}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Contenido -->
            <tr>
              <td style="padding: 28px 30px;">
                <p style="font-size: 14px; margin: 0 0 16px 0; color: #6E6259;">
                  Se ha recibido un nuevo reporte o consulta técnica desde la plataforma web:
                </p>

                <!-- Datos del Usuario -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FAF7F2; border-radius: 14px; padding: 16px; margin-bottom: 20px; border: 1px solid #EAE5DE;">
                  <tr>
                    <td style="padding: 4px 0; font-size: 13px; color: #6E6259; width: 120px;">Nombre:</td>
                    <td style="padding: 4px 0; font-size: 13px; font-weight: 600; color: #2C2523;">${props.nombre}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; font-size: 13px; color: #6E6259;">Email:</td>
                    <td style="padding: 4px 0; font-size: 13px; font-weight: 600; color: #2C2523;">
                      <a href="mailto:${props.email}" style="color: #C26D53; text-decoration: none;">${props.email}</a>
                    </td>
                  </tr>
                  ${
                    props.telefono
                      ? `
                  <tr>
                    <td style="padding: 4px 0; font-size: 13px; color: #6E6259;">WhatsApp:</td>
                    <td style="padding: 4px 0; font-size: 13px; font-weight: 600; color: #2C2523;">${props.telefono}</td>
                  </tr>
                  `
                      : ""
                  }
                  <tr>
                    <td style="padding: 4px 0; font-size: 13px; color: #6E6259;">Tipo de Problema:</td>
                    <td style="padding: 4px 0; font-size: 13px; font-weight: 700; color: #8A3826;">${props.tipoProblema}</td>
                  </tr>
                </table>

                <!-- Mensaje del Usuario -->
                <div style="margin-bottom: 24px;">
                  <h3 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #6E6259; margin: 0 0 8px 0;">
                    Detalle del problema reportado:
                  </h3>
                  <div style="background-color: #FFFFFF; border: 1px solid #EAE5DE; border-left: 4px solid #C26D53; border-radius: 8px; padding: 14px 16px; font-size: 14px; line-height: 1.6; color: #2C2523; white-space: pre-wrap;">${props.mensaje}</div>
                </div>

                ${
                  props.capturasUrls && props.capturasUrls.length > 0
                    ? `
                <!-- Capturas Adjuntas del Error -->
                <div style="margin-bottom: 24px; background-color: #FAF7F2; border: 1px solid #EAE5DE; border-radius: 12px; padding: 16px 20px;">
                  <h3 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #6E6259; margin: 0 0 12px 0;">
                    📷 Capturas adjuntas del error (${props.capturasUrls.length}):
                  </h3>
                  <table cellpadding="0" cellspacing="0" width="100%">
                    ${props.capturasUrls
                      .map(
                        (url, idx) => `
                    <tr>
                      <td style="padding: 5px 0;">
                        <a href="${url}" target="_blank" style="display: inline-block; background-color: #FFFFFF; border: 1px solid #D9D2C9; color: #8A3826; font-size: 13px; font-weight: 600; padding: 8px 16px; border-radius: 8px; text-decoration: none;">
                          🔗 Captura del problema técnico #${idx + 1} ↗
                        </a>
                      </td>
                    </tr>
                    `
                      )
                      .join("")}
                  </table>
                </div>
                `
                    : ""
                }

                <!-- Botones de Acción Rápida -->
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td>
                      <a href="mailto:${props.email}?subject=Re:%20Ticket%20%23${props.ticketId}%20-%20Soporte%20T%C3%A9cnico%20Milideas&body=Hola%20${encodeURIComponent(props.nombre)},%0A%0ARecibimos%20tu%20consulta%20técnica%20sobre%20${encodeURIComponent(props.tipoProblema)}.%0A%0A" 
                         style="display: inline-block; background-color: #3B2E2A; color: #FFFFFF; font-size: 13px; font-weight: 600; padding: 10px 20px; border-radius: 50px; text-decoration: none; margin-right: 10px;">
                        ✉️ Responder por Email
                      </a>
                      ${
                        waUrl
                          ? `
                      <a href="${waUrl}" target="_blank" 
                         style="display: inline-block; background-color: #25D366; color: #FFFFFF; font-size: 13px; font-weight: 600; padding: 10px 20px; border-radius: 50px; text-decoration: none;">
                        💬 Abrir WhatsApp
                      </a>
                      `
                          : ""
                      }
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Pie -->
            <tr>
              <td style="background-color: #F7F3EE; padding: 16px 30px; border-top: 1px solid #EAE5DE; text-align: center; font-size: 11px; color: #8A7E75;">
                Milideas Arte · Panel de Soporte y Administración Técnica
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}
