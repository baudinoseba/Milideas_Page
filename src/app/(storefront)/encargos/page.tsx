import { EncargosCheckoutClient } from "@/components/encargos/encargos-checkout-client";

export const metadata = {
  title: "Proceso de Encargo a Medida | Milideas",
  description: "Revisá y configurá la personalización de tus piezas hechas por encargo a mano.",
};

export default function EncargosPage() {
  return <EncargosCheckoutClient />;
}
