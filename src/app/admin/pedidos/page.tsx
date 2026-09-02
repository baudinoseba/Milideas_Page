import { getAdminPedidos, getConfiguracionSitio } from "@/lib/supabase/queries";
import { PedidosManager } from "@/components/admin/pedidos-manager";

export const metadata = { title: "Gestión de Ventas de la Tienda | Admin" };

export default async function AdminPedidosPage() {
  const [pedidos, configSitio] = await Promise.all([
    getAdminPedidos().catch(() => []),
    getConfiguracionSitio().catch(() => null),
  ]);

  return (
    <PedidosManager
      initialPedidos={pedidos}
      configSitio={configSitio}
    />
  );
}
