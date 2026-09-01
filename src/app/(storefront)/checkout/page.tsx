import { CheckoutForm } from "@/components/checkout/checkout-form";
import { getZonasLogisticas, getPerfil } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { BackButton } from "@/components/ui/back-button";

export const metadata = {
  title: "Checkout",
  description: "Completá tu compra en Milideas.",
};

export default async function CheckoutPage() {
  const zonas = await getZonasLogisticas().catch(() => []);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const perfil = user ? await getPerfil(user.id) : null;

  return (
    <div>
      <div className="mb-6">
        <BackButton fallbackHref="/ceramica">Volver a la tienda</BackButton>
      </div>
      <h1 className="mb-8 text-2xl font-medium">Checkout</h1>
      {zonas.length === 0 ? (
        <p className="text-muted">
          No hay zonas de envío configuradas. Contactá al administrador.
        </p>
      ) : (
        <CheckoutForm zonas={zonas} perfil={perfil} userEmail={user?.email} />
      )}
    </div>
  );
}
