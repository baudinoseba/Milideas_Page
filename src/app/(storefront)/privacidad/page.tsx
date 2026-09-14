import type { Metadata } from "next";
import Link from "next/link";
import { BanderaArgentina } from "@/components/ui/bandera-argentina";

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description:
    "Política de Privacidad y Tratamiento de Datos Personales de Milideas Arte® en cumplimiento con la Ley N° 25.326 de la República Argentina.",
};

export default function PrivacidadPage() {
  return (
    <div className="mx-auto max-w-3xl py-6 sm:py-12 px-4 sm:px-6 space-y-8">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-sans text-barro">
        <Link href="/" className="hover:text-chocolate transition-colors">
          Inicio
        </Link>
        <span>/</span>
        <span className="font-semibold text-chocolate">Política de Privacidad</span>
      </nav>

      {/* Cabecera */}
      <div className="space-y-3 border-b border-border/70 pb-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-terracota/20 bg-surface px-3 py-1 text-xs font-semibold text-chocolate shadow-2xs font-sans">
          <span>Ley N° 25.326 de Protección de Datos Personales</span>
          <BanderaArgentina className="w-3.5 h-2.5 inline-block" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-medium font-serif text-chocolate">
          Política de Privacidad y Protección de Datos
        </h1>
        <p className="text-xs sm:text-sm text-barro font-sans leading-relaxed">
          En <strong>Milideas Arte® · Estudio de Arte & Cerámica de Autor</strong>, a cargo de Milagros Anita Ferrero, valoro y respeto profundamente tu derecho a la privacidad. Esta política detalla con total transparencia qué datos personales te solicito para gestionar tus compras de piezas de cerámica de autor y obras únicas, con qué finalidad exclusiva los utilizo y cómo podés ejercer tus derechos conforme a la legislación argentina vigente.
        </p>
      </div>

      {/* 1. Responsable del Tratamiento */}
      <section className="rounded-2xl border border-border/80 bg-surface p-5 sm:p-6 space-y-2.5 shadow-2xs font-sans text-xs sm:text-sm">
        <h2 className="text-base font-serif font-medium text-chocolate flex items-center gap-2">
          <span>🛡️</span> 1. Responsable del Tratamiento de los Datos
        </h2>
        <ul className="space-y-1.5 text-barro">
          <li><strong>Titular Responsable:</strong> Milagros Anita Ferrero (Artista & Ceramista · Titular de la marca registrada Milideas Arte®)</li>
          <li><strong>CUIL:</strong> 27-43717260-4 (Estudio de arte y producción artesanal de autor)</li>
          <li><strong>Espacio de trabajo y taller físico:</strong> Florentino Ameghino 1576, Sunchales, Santa Fe (CP S2322)</li>
          <li><strong>Canal de contacto y privacidad:</strong> <a href="mailto:contacto@milideasarte.com.ar" className="text-terracota underline">contacto@milideasarte.com.ar</a> · WhatsApp: +54 9 3493 664420</li>
        </ul>
      </section>

      {/* Secciones detalladas */}
      <div className="space-y-6 font-sans text-xs sm:text-sm text-barro leading-relaxed">
        
        {/* 2. Datos recopilados */}
        <section className="space-y-2">
          <h2 className="text-base font-serif font-medium text-chocolate flex items-center gap-2">
            <span>📋</span> 2. Qué Datos Personales Solicito
          </h2>
          <p>
            Al navegar, registrarte o realizar un pedido en la tienda, solicito los siguientes datos estrictamente necesarios:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-muted">
            <li>Nombre y apellido del comprador o destinatario.</li>
            <li>Documento Nacional de Identidad (DNI), indispensable para la elaboración de remitos de entrega y despacho mediante empresas de logística y encomiendas.</li>
            <li>Número de teléfono o WhatsApp para coordinar directamente contigo los envíos y la confirmación de reservas.</li>
            <li>Dirección de correo electrónico para enviarte las notificaciones del pedido, comprobantes y estado de cuenta.</li>
            <li>Dirección postal completa (calle, número, código postal, localidad y provincia) para el despacho a domicilio o a sucursal de encomienda.</li>
            <li>Fecha de nacimiento (campo de carga voluntario en el perfil de usuario para atenciones personalizadas).</li>
            <li>Comprobante bancario voluntariamente provisto para verificar tu transferencia.</li>
            <li>Identificadores técnicos y cookies esenciales necesarios para el correcto funcionamiento del carrito de compras y la seguridad de tu sesión.</li>
          </ul>
        </section>

        {/* 3. Finalidad del tratamiento */}
        <section className="space-y-2">
          <h2 className="text-base font-serif font-medium text-chocolate flex items-center gap-2">
            <span>🎯</span> 3. Finalidad del Tratamiento
          </h2>
          <p>Los datos recopilados se destinan exclusivamente a:</p>
          <ul className="list-disc pl-5 space-y-1 text-muted">
            <li>Procesar, preparar, embalar y despachar los pedidos de piezas de cerámica y arte que me solicites.</li>
            <li>Coordinar el retiro en mi taller o la logística de envío a través de las empresas de encomienda autorizadas (por ejemplo, Vía Cargo).</li>
            <li>Brindarte atención directa, responder tus dudas y gestionar garantías o solicitudes de arrepentimiento.</li>
            <li>Cumplir con las obligaciones legales correspondientes a la actividad del taller.</li>
          </ul>
          <p className="font-medium text-chocolate">
            Milideas Arte® no vende, alquila ni comparte tus datos personales con terceros para fines comerciales o publicitarios bajo ninguna circunstancia.
          </p>
        </section>

        {/* 4. Transferencia a Terceros */}
        <section className="space-y-2">
          <h2 className="text-base font-serif font-medium text-chocolate flex items-center gap-2">
            <span>🚚</span> 4. Comunicación de Datos a Prestadores de Logística
          </h2>
          <p>
            Para hacer posible la entrega física de tus piezas a domicilio o sucursal, los datos indispensables de despacho (nombre, DNI si lo requiere la empresa de transporte, dirección de destino y teléfono) son provistos a la empresa de transporte contratada con el único fin de materializar la entrega.
          </p>
        </section>

        {/* 5. Derechos del Titular (Ley 25.326) */}
        <section className="space-y-2">
          <h2 className="text-base font-serif font-medium text-chocolate flex items-center gap-2">
            <span>⚖️</span> 5. Derechos de Acceso, Rectificación y Supresión
          </h2>
          <p>
            El titular de los datos personales tiene la facultad de ejercer el derecho de acceso a los mismos en forma gratuita a intervalos no inferiores a seis meses, salvo que se acredite un interés legítimo al efecto conforme lo establecido en el artículo 14, inciso 3 de la Ley Nº 25.326.
          </p>
          <p>
            Asimismo, podés solicitar en cualquier momento la actualización, rectificación o eliminación de tus datos de mis registros enviando un correo electrónico a <strong>contacto@milideasarte.com.ar</strong> con el asunto &quot;Protección de Datos Personales&quot;.
          </p>
          <div className="rounded-xl bg-arena/30 border border-border/70 p-3.5 text-xs text-barro">
            <p>
              <strong>Órgano de Control:</strong> La AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA, en su carácter de Órgano de Control de la Ley N° 25.326, tiene la atribución de atender las denuncias y reclamos que se interpongan con relación al incumplimiento de las normas sobre protección de datos personales.
            </p>
          </div>
        </section>

        {/* 6. Seguridad de la Información */}
        <section className="space-y-2">
          <h2 className="text-base font-serif font-medium text-chocolate flex items-center gap-2">
            <span>🔒</span> 6. Seguridad y Confidencialidad
          </h2>
          <p>
            Implemento medidas técnicas y organizativas de seguridad (conexiones cifradas SSL/HTTPS, autenticación segura y políticas de control de acceso a bases de datos) para proteger tus datos personales contra pérdidas, usos indebidos o accesos no autorizados.
          </p>
        </section>

      </div>

      {/* Enlaces de pie */}
      <div className="border-t border-border/60 pt-6 text-center text-xs font-sans text-muted space-x-4">
        <Link href="/terminos" className="text-terracota underline hover:text-chocolate">
          Términos y Condiciones
        </Link>
        <span>·</span>
        <Link href="/arrepentimiento" className="text-terracota underline hover:text-chocolate">
          Botón de Arrepentimiento
        </Link>
        <span>·</span>
        <Link href="/contacto" className="text-terracota underline hover:text-chocolate">
          Contacto
        </Link>
      </div>
    </div>
  );
}
