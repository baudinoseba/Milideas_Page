import { notFound } from "next/navigation";
import { CheckoutExitoClient } from "@/components/checkout/checkout-exito-client";
import { getPedidoById, getConfiguracionSitio } from "@/lib/supabase/queries";
import type { PedidoConItems } from "@/types";

export const metadata = {
  title: "Pedido confirmado",
};

export default async function CheckoutExitoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [pedido, config] = await Promise.all([
    getPedidoById(id),
    getConfiguracionSitio().catch(() => null),
  ]);
  if (!pedido) notFound();

  return (
    <CheckoutExitoClient
      pedido={pedido as PedidoConItems}
      vendedorWhatsapp={config?.vendedor_whatsapp}
    />
  );
}
