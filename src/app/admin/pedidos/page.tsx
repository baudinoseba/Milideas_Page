import Link from "next/link";
import { getAdminPedidos } from "@/lib/supabase/queries";
import { DashboardPedidosList } from "@/components/admin/dashboard-pedidos-list";

export const metadata = { title: "Admin — Gestión de Pedidos" };

export default async function AdminPedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const { estado } = await searchParams;
  const pedidos = await getAdminPedidos(estado).catch(() => []);

  const tabs = [
    { id: "", label: "Todos los pedidos" },
    { id: "pendiente_pago", label: "💳 Pagos por revisar" },
    { id: "confirmado", label: "📦 Listos para despacho / retiro" },
    { id: "enviado", label: "✓ Entregados / Despachados" },
    { id: "cancelado", label: "✕ Cancelados" },
  ];

  return (
    <div className="space-y-6 pb-12">
      
      {/* ─── Header & Volver ─── */}
      <div className="border-b border-border/60 pb-4 space-y-2">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-chocolate font-sans"
        >
          <span>← Volver al Dashboard</span>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-serif font-semibold text-chocolate">
              Gestión de Pedidos de la Tienda
            </h1>
            <p className="text-xs text-muted font-sans mt-0.5">
              Confirmá pagos de transferencias bancarias y coordiná envíos o retiros en el taller.
            </p>
          </div>
        </div>

        {/* ─── Pestañas de Filtro Rápido ─── */}
        <div className="flex gap-2 pt-2 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const isActive = (!estado && tab.id === "") || estado === tab.id;
            return (
              <Link
                key={tab.id}
                href={tab.id ? `/admin/pedidos?estado=${tab.id}` : "/admin/pedidos"}
                className={`rounded-2xl px-4 py-2 text-xs sm:text-sm font-semibold font-sans transition-all shrink-0 cursor-pointer shadow-2xs ${
                  isActive
                    ? "bg-chocolate text-crema-cruda shadow-xs font-bold"
                    : "bg-surface text-chocolate border border-border/70 hover:bg-secondary/40"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* ─── Lista Interactiva de Pedidos ─── */}
      <DashboardPedidosList pedidos={pedidos} />

    </div>
  );
}
