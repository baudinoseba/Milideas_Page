export interface ArrepentimientoEmailProps {
  codigoTramite: string;
  nombre: string;
  contacto: string;
  email?: string | null;
  pedidoNumero?: string | null;
  producto: string;
  motivo?: string | null;
  appUrl: string;
}

export function renderArrepentimientoEmailHtml(props: ArrepentimientoEmailProps): string {
  const cleanPhone = props.contacto.replace(/\D/g, "");
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    `Hola ${props.nombre}! Nos comunicamos de Milideas Arte en respuesta a tu solicitud de revocación con código ${props.codigoTramite}.`
  )}`;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Solicitud de Arrepentimiento - ${props.codigoTramite}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FBF8F4; color: #2C2523; margin: 0; padding: 24px 12px;">
  <div style="max-width: 580px; margin: 0 auto; background: #FFFFFF; border-radius: 20px; border: 1px solid #EFE8DE; overflow: hidden; box-shadow: 0 4px 12px rgba(44, 37, 35, 0.04);">
    <div style="background-color: #C26D53; color: #FFFFFF; padding: 28px 24px; text-align: center;">
      <h1 style="font-family: Georgia, serif; font-size: 22px; font-weight: normal; margin: 0;">
        🔄 Solicitud de Revocación Recibida
      </h1>
      <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">
        Botón de Arrepentimiento (Disposición 954/2025)
      </p>
    </div>

    <div style="padding: 24px;">
      <div style="background: #FDFBF8; border: 1px solid #EFE8DE; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
        <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Código de trámite emitido:</strong> <span style="font-family: monospace; font-size: 16px; font-weight: bold; color: #C26D53;">${props.codigoTramite}</span></p>
        <p style="margin: 0 0 6px 0; font-size: 14px;"><strong>Solicitante:</strong> ${props.nombre}</p>
        <p style="margin: 0 0 6px 0; font-size: 14px;"><strong>Contacto / WhatsApp:</strong> ${props.contacto}</p>
        <p style="margin: 0 0 6px 0; font-size: 14px;"><strong>Email:</strong> ${props.email || "No provisto"}</p>
        <p style="margin: 0 0 6px 0; font-size: 14px;"><strong>N° Pedido referenciado:</strong> ${props.pedidoNumero || "No especificado"}</p>
        <p style="margin: 0 0 6px 0; font-size: 14px;"><strong>Pieza o producto:</strong> ${props.producto}</p>
        ${props.motivo ? `<p style="margin: 0; font-size: 14px;"><strong>Motivo o comentario:</strong> ${props.motivo}</p>` : ""}
      </div>

      <div style="text-align: center; margin-top: 24px;">
        <a href="${waUrl}" style="background-color: #25D366; color: #FFFFFF; font-weight: bold; font-size: 13px; text-decoration: none; padding: 12px 24px; border-radius: 50px; display: inline-block;">
          💬 Contactar al cliente por WhatsApp →
        </a>
      </div>
    </div>
  </div>
</body>
</html>
`;
}
