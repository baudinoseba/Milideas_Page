import type { Metadata } from "next";
import Link from "next/link";
import { BanderaArgentina } from "@/components/ui/bandera-argentina";

export const metadata: Metadata = {
  title: "Términos y Condiciones Generales",
  description:
    "Términos y condiciones de compra en Milideas Arte®. Plazos de producción artesanal, política de envíos y roturas, garantía legal de 6 meses y derecho de revocación conforme a la Disposición 954/2025.",
};

export default function TerminosPage() {
  return (
    <div className="mx-auto max-w-3xl py-6 sm:py-12 px-4 sm:px-6 space-y-8">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-sans text-barro">
        <Link href="/" className="hover:text-chocolate transition-colors">
          Inicio
        </Link>
        <span>/</span>
        <span className="font-semibold text-chocolate">Términos y Condiciones</span>
      </nav>

      {/* Cabecera */}
      <div className="space-y-3 border-b border-border/70 pb-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-terracota/20 bg-surface px-3 py-1 text-xs font-semibold text-chocolate shadow-2xs font-sans">
          <span>Marco Legal E-commerce</span>
          <BanderaArgentina className="w-3.5 h-2.5 inline-block" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-medium font-serif text-chocolate">
          Términos y Condiciones Generales
        </h1>
        <p className="text-xs sm:text-sm text-barro font-sans leading-relaxed">
          Te doy la bienvenida a la tienda oficial de <strong>Milideas Arte® · Estudio de Arte & Cerámica de Autor</strong>. Como artista y ceramista detrás de este espacio de creación independiente, te invito a leer detenidamente los términos que rigen la adquisición de mis piezas de cerámica de autor, obras pictóricas y encargos a medida, donde cada creación es moldeada, ilustrada y horneada a mano de forma integral, garantizando que no existan dos piezas iguales. Al confirmar tu compra y marcar la casilla de aceptación durante el checkout, estas condiciones forman parte del acuerdo entre ambas partes.
        </p>
      </div>

      {/* Identificación del Emprendimiento */}
      <section className="rounded-2xl border border-border/80 bg-surface p-5 sm:p-6 space-y-3 shadow-2xs font-sans text-xs sm:text-sm">
        <h2 className="text-base font-serif font-medium text-chocolate flex items-center gap-2">
          <span>🏢</span> 1. Identificación de la Artista y Estudio de Arte
        </h2>
        <ul className="space-y-1.5 text-barro">
          <li><strong>Marca y Denominación:</strong> Milideas Arte® · Estudio de Arte & Cerámica de Autor (Marca Registrada)</li>
          <li><strong>Titular responsable:</strong> Milagros Anita Ferrero (Artista & Ceramista)</li>
          <li><strong>Identificación Tributaria (CUIL):</strong> 27-43717260-4 (Estudio de arte y producción artesanal de autor)</li>
          <li><strong>Espacio de producción y taller físico:</strong> Florentino Ameghino 1576, Sunchales, Provincia de Santa Fe, República Argentina (Código Postal S2322)</li>
          <li><strong>Canales de atención directa:</strong> WhatsApp (+54 9 3493 664420) · Email: <a href="mailto:contacto@milideasarte.com.ar" className="text-terracota underline font-medium">contacto@milideasarte.com.ar</a></li>
        </ul>
      </section>

      {/* Cláusulas detalladas */}
      <div className="space-y-6 font-sans text-xs sm:text-sm text-barro leading-relaxed">

        {/* 2. Naturaleza de los Productos */}
        <section className="space-y-2">
          <h2 className="text-base font-serif font-medium text-chocolate flex items-center gap-2">
            <span>🏺</span> 2. Naturaleza de los Productos de Cerámica y Arte
          </h2>
          <p>
            Cada una de las piezas que encontrás en Milideas Arte® es moldeada, horneada e ilustrada a mano por mí de forma 100% artesanal en mi taller. Por su naturaleza de autor, cada pieza posee un carácter único e irrepetible. Pueden presentarse sutiles variaciones en tonalidad, pinceladas, textura o medidas exactas, lo cual constituye el valor distintivo y auténtico de la obra hecha a mano y no un defecto de fabricación.
          </p>
          <p>
            Los esmaltes cerámicos que utilizo son completamente libres de plomo y aptos para uso gastronómico diario (vajilla, tazas, cuencos y mates), así como aptos para microondas y lavavajillas, recomendando siempre evitar choques térmicos extremos (por ejemplo, verter agua hirviendo directamente sobre una pieza fría).
          </p>
        </section>

        {/* 3. Tiempos de Despacho y Producción */}
        <section className="space-y-2">
          <h2 className="text-base font-serif font-medium text-chocolate flex items-center gap-2">
            <span>⏱️</span> 3. Plazos de Despacho y Tiempos de Horneado
          </h2>
          <p>
            • <strong>Piezas en Stock Disponible:</strong> Preparo y despacho cada paquete cuidadosamente dentro de un plazo de <strong>1 a 7 días hábiles</strong> (habitualmente dentro de la semana) tras la acreditación efectiva de la transferencia bancaria.
          </p>
          <p>
            • <strong>Piezas por Encargo / Personalizadas:</strong> Requieren un proceso de elaboración y secado natural pausado para prevenir tensiones o rajaduras, seguido de dos horneadas (bizcocho cerámico a 900°C y horneada final con esmaltes a 1080°C). El tiempo de confección estimado es de aproximadamente <strong>30 días corridos</strong>.
          </p>
        </section>

        {/* 4. Embalaje Antigolpes y Envíos */}
        <section className="space-y-2">
          <h2 className="text-base font-serif font-medium text-chocolate flex items-center gap-2">
            <span>📦</span> 4. Embalaje Reforzado y Política de Roturas en Envíos
          </h2>
          <p>
            Cada pieza se embala individualmente con envoltorios multicapa de alta densidad (pluribol antigolpes, cartón corrugado y material de amortiguación) para asegurar su óptima protección durante el traslado a todo el país mediante empresas de logística (Vía Cargo y transportes habilitados).
          </p>
          <div className="rounded-xl bg-arena/30 border border-border/70 p-3.5 text-xs space-y-1.5">
            <p className="font-semibold text-chocolate">
              ⚠️ Procedimiento en caso de daño durante el transporte:
            </p>
            <p>
              En el improbable caso de que una pieza resulte dañada durante el tránsito por parte de la empresa de encomiendas, a fin de agilizar la verificación con el seguro del transporte te recomiendo comunicarte lo antes posible, idealmente dentro de las <strong>48 horas</strong> de recibido el paquete, adjuntando fotografías nítidas del embalaje exterior y de la pieza afectada a mi WhatsApp o email de contacto.
            </p>
            <p>
              Una vez constatado el daño, coordinaré con celeridad la <strong>reposición sin cargo</strong> de una pieza equivalente o el <strong>reintegro íntegro</strong> del monto abonado.
            </p>
          </div>
        </section>

        {/* 5. Garantía Legal Obligatoria */}
        <section className="space-y-2">
          <h2 className="text-base font-serif font-medium text-chocolate flex items-center gap-2">
            <span>🛡️</span> 5. Garantía Legal de 6 Meses (Art. 11 Ley 24.240)
          </h2>
          <p>
            De conformidad con el artículo 11 de la Ley N° 24.240 de Defensa del Consumidor de la República Argentina, todos los productos no consumibles comercializados en esta tienda cuentan con una <strong>garantía legal de 6 (seis) meses</strong> a partir de su entrega efectiva frente a cualquier vicio o defecto oculto de origen que impida su uso normal y previsible.
          </p>
          <p className="text-muted text-xs">
            Esta garantía no cubre roturas provocadas por golpes, caídas accidentales, choque térmico brusco, abrasión con elementos punzantes o utilización indebida ajena al uso previsto.
          </p>
        </section>

        {/* 6. Derecho de Revocación y Botón de Arrepentimiento */}
        <section className="space-y-2">
          <h2 className="text-base font-serif font-medium text-chocolate flex items-center gap-2">
            <span>🔄</span> 6. Derecho de Revocación (Botón de Arrepentimiento - Disposición 954/2025)
          </h2>
          <p>
            Conforme a lo establecido por el Artículo 34 de la Ley 24.240 y la <strong>Disposición 954/2025</strong> de la Subsecretaría de Defensa del Consumidor y Lealtad Comercial (junto a la Disposición 3/2026), en las compras realizadas a distancia el consumidor tiene derecho a revocar su compra dentro de los <strong>10 (diez) días corridos</strong> contados a partir de la entrega efectiva del producto.
          </p>
          <p>
            Para hacer uso de este derecho, podés acceder en cualquier momento a mi{" "}
            <Link href="/arrepentimiento" className="text-terracota font-bold underline hover:text-chocolate">
              Botón de Arrepentimiento
            </Link>
            , el cual registrará de forma inmediata la solicitud y emitirá un código único de trámite para coordinar la devolución de la pieza y el reintegro de lo abonado sin costos indebidos para el comprador.
          </p>
          <p className="text-muted text-xs">
            <em>Excepción legal para productos a medida (Art. 1116 Código Civil y Comercial de la Nación):</em> El derecho de revocación no resulta aplicable a piezas elaboradas bajo pedido o expresamente personalizadas según indicaciones del comprador (tales como ilustraciones con nombres propios, dedicatorias o medidas especiales), salvo vicio de fabricación o daño en el envío.
          </p>
        </section>

        {/* 7. Modalidad de Pago y Reserva */}
        <section className="space-y-2">
          <h2 className="text-base font-serif font-medium text-chocolate flex items-center gap-2">
            <span>💳</span> 7. Modalidad de Pago y Reserva de Stock
          </h2>
          <p>
            • <strong>Plazo de reserva:</strong> Las piezas adquiridas en el sitio web quedan formalmente reservadas a nombre del comprador por un lapso perentorio de <strong>24 horas</strong> para concretar el pago mediante transferencia bancaria al alias oficial <code>milideasarte</code>. Transcurrido dicho plazo sin acreditación ni envío del comprobante de pago, la reserva expirará de manera automática liberando el stock para otros compradores.
          </p>
          <p>
            • <strong>Precios finales y transparentes:</strong> Los importes exhibidos en el catálogo corresponden al valor final de cada pieza en pesos argentinos ($ ARS).
          </p>
          <p>
            • <strong>Acreditaciones y comprobantes:</strong> En casos de transferencias duplicadas o importes con diferencias, el comprador podrá comunicarse por WhatsApp o correo electrónico para coordinar la imputación de su orden o la devolución inmediata de cualquier excedente.
          </p>
        </section>

        {/* 8. Marca Registrada y Propiedad Intelectual */}
        <section className="space-y-2">
          <h2 className="text-base font-serif font-medium text-chocolate flex items-center gap-2">
            <span>🎨</span> 8. Marca Registrada y Derechos de Autor (Ley 11.723)
          </h2>
          <p>
            • <strong>Marca Registrada:</strong> La denominación y signo distintivo <strong>Milideas Arte®</strong> constituye una marca registrada protegida legalmente.
          </p>
          <p>
            • <strong>Protección Automática de Obras y Diseños:</strong> De conformidad con la Ley N° 11.723 de Propiedad Intelectual de la República Argentina y el Convenio de Berna, todas las ilustraciones, pinturas originales, piezas de cerámica modeladas a mano, fotografías, textos y composiciones visuales creadas por <strong>Milagros Anita Ferrero</strong> gozan de protección legal y derechos de autor de forma automática por el solo hecho de su creación original, sin que sea exigible un trámite de registro individual para cada nuevo diseño, pieza o ilustración.
          </p>
          <p>
            • <strong>Alcance de la compra:</strong> La adquisición de una pieza física u obra otorga el derecho de tenencia y disfrute personal, mas <strong>no transfiere</strong> ningún derecho de reproducción, copia, moldeado industrial ni explotación comercial de la imagen o diseño sin autorización previa y expresa por escrito de la autora.
          </p>
        </section>

        {/* 9. Legislación y Reclamos */}
        <section className="space-y-2">
          <h2 className="text-base font-serif font-medium text-chocolate flex items-center gap-2">
            <span>⚖️</span> 9. Legislación Aplicable y Canales de Reclamo
          </h2>
          <p>
            Los presentes Términos y Condiciones se rigen en su totalidad por la legislación de la República Argentina.
          </p>
          <p>
            Frente a cualquier duda, consulta o reclamo sobre tu compra, te invito a comunicarte en primera instancia a través de mis canales directos de WhatsApp o correo electrónico para brindarte una solución ágil y personalizada. Asimismo, el consumidor cuenta con el derecho de recurrir ante las autoridades de Defensa del Consumidor o a través de la plataforma de la <strong>Ventanilla Federal Única de Reclamos</strong> (defensadelconsumidor.gob.ar), así como a la jurisdicción que legalmente le asista según el régimen protectorio del consumidor.
          </p>
          <p className="text-xs text-muted pt-1">
            <em>Versión 1.3 — Fecha de última actualización: Septiembre de 2026.</em>
          </p>
        </section>

      </div>

      {/* Pie de página con botón de arrepentimiento y contacto */}
      <div className="rounded-2xl border border-border/60 bg-surface p-5 text-center text-xs font-sans text-barro space-y-3 shadow-2xs">
        <p>¿Tenés alguna duda sobre estos términos o tu pedido en curso?</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/arrepentimiento">
            <span className="rounded-full bg-chocolate text-crema-cruda px-4 py-2 font-semibold hover:bg-chocolate/90 transition-all inline-block">
              Ir al Botón de Arrepentimiento →
            </span>
          </Link>
          <Link href="/contacto">
            <span className="rounded-full border border-border bg-surface px-4 py-2 font-semibold text-chocolate hover:bg-arena transition-all inline-block">
              Canales de Contacto
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
