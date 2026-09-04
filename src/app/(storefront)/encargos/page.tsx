import { EncargosCheckoutClient } from "@/components/encargos/encargos-checkout-client";
import { getPerfil, getConfiguracionSitio } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Proceso de Encargo a Medida | Milideas",
  description: "Revisá y configurá la personalización de tus piezas hechas por encargo a mano.",
};

export default async function EncargosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [perfil, config] = await Promise.all([
    user ? getPerfil(user.id).catch(() => null) : null,
    getConfiguracionSitio().catch(() => null),
  ]);

  return (
    <EncargosCheckoutClient
      perfil={perfil}
      userEmail={user?.email}
      vendedorWhatsapp={config?.vendedor_whatsapp}
    />
  );
}
