import { getConfiguracionSitio } from "@/lib/supabase/queries";
import { ContactoView } from "@/components/contacto/contacto-view";

export const metadata = {
  title: "Contacto — Milideas Arte",
  description:
    "Escribinos por WhatsApp al 3493664420, por correo a contacto@milideasarte.com.ar o por Instagram @milideas_arte. Taller de cerámica de autor e ilustraciones en Sunchales, Santa Fe.",
};

export default async function ContactoPage() {
  const config = await getConfiguracionSitio().catch(() => null);

  const vendorWhatsapp = config?.vendedor_whatsapp || "5493493664420";

  return (
    <div className="py-6 sm:py-10">
      <ContactoView
        vendorWhatsapp={vendorWhatsapp}
        contactEmail="contacto@milideasarte.com.ar"
        instagramUser="milideas_arte"
      />
    </div>
  );
}
