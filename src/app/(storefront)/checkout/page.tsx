import { CheckoutForm } from "@/components/checkout/checkout-form";
import { getZonasLogisticas } from "@/lib/supabase/queries";

export const metadata = {
  title: "Checkout",
  description: "Completá tu compra en Milideas.",
};

export default async function CheckoutPage() {
  const zonas = await getZonasLogisticas().catch(() => []);

  return (
    <div>
      <h1 className="mb-8 text-2xl font-medium">Checkout</h1>
      {zonas.length === 0 ? (
        <p className="text-muted">
          No hay zonas de envío configuradas. Contactá al administrador.
        </p>
      ) : (
        <CheckoutForm zonas={zonas} />
      )}
    </div>
  );
}
