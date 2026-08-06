import { Card } from "@/components/ui/card";
import { getAdminStats } from "@/lib/supabase/queries";

export const metadata = { title: "Admin" };

export default async function AdminDashboardPage() {
  const stats = await getAdminStats().catch(() => ({
    pedidosPendientes: 0,
    stockBajo: 0,
  }));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-medium">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <p className="text-sm text-muted">Pedidos pendientes de pago</p>
          <p className="mt-2 text-3xl font-medium">{stats.pedidosPendientes}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Productos con stock bajo</p>
          <p className="mt-2 text-3xl font-medium">{stats.stockBajo}</p>
        </Card>
      </div>
    </div>
  );
}
