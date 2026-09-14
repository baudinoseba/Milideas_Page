import { NuevoPedidoItemData } from "./nuevo-pedido-email";

export interface ConfirmacionCompradorEmailProps {
  pedidoId: string;
  nombreContacto: string;
  whatsappContacto: string;
  items: NuevoPedidoItemData[];
  subtotal: number;
  descuentoAplicado: number;
  costoEnvio: number;
  total: number;
  tipoEnvio: string;
  direccionEnvio?: any;
  appUrl: string;
}

export function renderConfirmacionCompradorHtml(props: ConfirmacionCompradorEmailProps): string {
  const shortId = props.pedidoId.slice(0, 8).toUpperCase();
  const waUrl = `https://wa.me/5493493664420?text=${encodeURIComponent(
    `Hola Mili! Te comparto el comprobante de pago de mi pedido #${shortId} ($${props.total.toLocaleString("es-AR")}).`
  )}`;

  const itemsRows = props.items
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #F0EAE1;">
        <td style="padding: 12px 8px; font-size: 14px; color: #2C2523;">
          <strong>${item.nombre}</strong>
          ${item.esPersonalizado ? '<span style="display:block; font-size:12px; color:#C26D53;">★ Pieza personalizada</span>' : ""}
        </td>
        <td style="padding: 12px 8px; font-size: 14px; color: #6E6259; text-align: center;">x${item.cantidad}</td>
        <td style="padding: 12px 8px; font-size: 14px; color: #2C2523; text-align: right; font-weight: 600;">
          $${(item.precioUnitario * item.cantidad).toLocaleString("es-AR")}
        </td>
      </tr>
    `
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Pedido Reservado #${shortId}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FBF8F4; color: #2C2523; margin: 0; padding: 24px 12px;">
  <div style="max-width: 580px; margin: 0 auto; background: #FFFFFF; border-radius: 20px; border: 1px solid #EFE8DE; overflow: hidden; box-shadow: 0 4px 12px rgba(44, 37, 35, 0.04);">
    
    <!-- Encabezado -->
    <div style="background-color: #2C2523; color: #FBF8F4; padding: 32px 24px; text-align: center;">
      <h1 style="font-family: Georgia, serif; font-size: 24px; font-weight: normal; margin: 0; letter-spacing: 0.5px;">Milideas Arte</h1>
      <p style="margin: 8px 0 0 0; font-size: 13px; color: #D1C7BD;">Estudio de Cerámica de Autor & Ilustración</p>
    </div>

    <div style="padding: 28px 24px;">
      <h2 style="font-family: Georgia, serif; font-size: 20px; color: #2C2523; margin-top: 0;">
        ¡Hola ${props.nombreContacto}! Tus piezas quedaron reservadas ✨
      </h2>
      <p style="font-size: 14px; line-height: 1.6; color: #5C524C;">
        Recibimos tu solicitud para el pedido <strong>#${shortId}</strong>. Tus piezas artesanales están reservadas a tu nombre por un plazo de <strong>24 horas</strong>.
      </p>

      <!-- Caja de Datos de Transferencia -->
      <div style="background: #FDFBF8; border: 1.5px dashed #C26D53; border-radius: 16px; padding: 18px 20px; margin: 24px 0;">
        <h3 style="margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #C26D53;">
          Datos para Transferencia Bancaria (Alias oficial)
        </h3>
        <p style="margin: 4px 0; font-size: 14px;"><strong>Alias:</strong> <span style="font-family: monospace; font-size: 16px; font-weight: bold; background: #F5EEE6; padding: 2px 6px; border-radius: 4px;">milideasarte</span></p>
        <p style="margin: 4px 0; font-size: 14px;"><strong>Titular:</strong> Milagros Anita Ferrero</p>
        <p style="margin: 4px 0; font-size: 14px;"><strong>CUIL:</strong> 27-43717260-4</p>
        <p style="margin: 4px 0; font-size: 14px;"><strong>Banco:</strong> Brubank (Caja de Ahorro $)</p>
        <p style="margin: 10px 0 0 0; font-size: 16px; font-weight: bold; color: #C26D53;">
          Total a transferir: $${props.total.toLocaleString("es-AR")}
        </p>
      </div>

      <!-- Resumen de items -->
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="border-bottom: 2px solid #EFE8DE; color: #6E6259; font-size: 12px; text-transform: uppercase; text-align: left;">
            <th style="padding: 8px;">Pieza</th>
            <th style="padding: 8px; text-align: center;">Cant.</th>
            <th style="padding: 8px; text-align: right;">Precio</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <!-- Totales -->
      <div style="border-top: 1px solid #EFE8DE; padding-top: 12px; font-size: 14px; line-height: 1.8;">
        <div style="display: flex; justify-content: space-between;">
          <span>Subtotal:</span>
          <span>$${props.subtotal.toLocaleString("es-AR")}</span>
        </div>
        ${props.descuentoAplicado > 0 ? `
        <div style="display: flex; justify-content: space-between; color: #2E7D32; font-weight: 600;">
          <span>Descuento aplicado:</span>
          <span>-$${props.descuentoAplicado.toLocaleString("es-AR")}</span>
        </div>` : ""}
        <div style="display: flex; justify-content: space-between;">
          <span>Costo de envío:</span>
          <span>${props.costoEnvio === 0 ? "Gratis ($0)" : `$${props.costoEnvio.toLocaleString("es-AR")}`}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; color: #2C2523; margin-top: 6px; padding-top: 6px; border-top: 1px solid #EFE8DE;">
          <span>Total:</span>
          <span>$${props.total.toLocaleString("es-AR")}</span>
        </div>
      </div>

      <!-- Botón de WhatsApp -->
      <div style="text-align: center; margin: 32px 0 20px 0;">
        <a href="${waUrl}" style="background-color: #25D366; color: #FFFFFF; font-weight: bold; font-size: 14px; text-decoration: none; padding: 14px 28px; border-radius: 50px; display: inline-block; box-shadow: 0 2px 8px rgba(37, 211, 102, 0.3);">
          💬 Enviar comprobante por WhatsApp →
        </a>
      </div>

      <!-- Información sobre Despacho y Marco Legal -->
      <div style="background-color: #F8F5F0; border-radius: 12px; padding: 14px 16px; font-size: 12px; color: #6E6259; line-height: 1.5; margin-top: 24px;">
        <p style="margin: 0 0 6px 0;"><strong>📦 Plazo de Despacho:</strong> El embalaje y despacho de piezas en stock se realiza habitualmente dentro de <strong>1 a 7 días hábiles</strong> posteriores a la acreditación de la transferencia.</p>
        <p style="margin: 0 0 6px 0;"><strong>🛡️ Garantía Legal:</strong> Todas nuestras piezas cuentan con garantía de 6 meses (Ley 24.240).</p>
        <p style="margin: 0;"><strong>🔄 Derecho de Arrepentimiento:</strong> Conforme a la Disposición 954/2025, disponés de 10 días corridos desde la entrega para revocar tu compra de catálogo desde <a href="${props.appUrl}/arrepentimiento" style="color: #C26D53; font-weight: bold;">nuestro Botón de Arrepentimiento</a>.</p>
      </div>

    </div>

    <!-- Pie -->
    <div style="background-color: #F4EFEA; padding: 16px 24px; text-align: center; font-size: 11px; color: #8C7E75;">
      Milideas Arte · Florentino Ameghino 1576, Sunchales, Santa Fe · contacto@milideasarte.com.ar
    </div>
  </div>
</body>
</html>
`;
}
