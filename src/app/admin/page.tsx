import Link from "next/link";
import { getAdminStats, getProduccionesEnProgreso } from "@/lib/supabase/queries";
import { formatPrecio } from "@/lib/pricing";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Admin — Dashboard" };

const quickActions = [
  {
    href: "/admin/productos/nuevo",
    icon: "🎨",
    label: "Crear pieza nueva",
    description: "Agregar un producto al catálogo",
  },
  {
    href: "/admin/categorias/nueva",
    icon: "📁",
    label: "Nueva categoría",
    description: "Organizar tus colecciones",
  },
  {
    href: "/admin/produccion/nueva",
    icon: "🎬",
    label: "Nueva producción",
    description: "Crear colección completa inline",
  },
  {
    href: "/admin/pedidos?estado=pendiente_pago",
    icon: "💳",
    label: "Confirmar pagos",
    description: "Pedidos esperando confirmación",
  },
  {
    href: "/admin/pedidos",
    icon: "📦",
    label: "Ver todos los pedidos",
    description: "Seguimiento y gestión",
  },
  {
    href: "/admin/productos",
    icon: "📋",
    label: "Catálogo completo",
    description: "Gestionar todas las piezas",
  },
  {
    href: "/admin/logistica",
    icon: "🚚",
    label: "Zonas de envío",
    description: "Configurar logística",
  },
];

export default async function AdminDashboardPage() {
  const stats = await getAdminStats().catch(() => ({
    pedidosPendientes: 0,
    pedidosConfirmados: 0,
    stockBajo: 0,
    totalProductosActivos: 0,
    ultimosPedidos: [],
  }));
  const produccionesEnProgreso = await getProduccionesEnProgreso().catch(() => []);

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">
          Centro de control de tu tienda. ¿Qué querés hacer hoy?
        </p>
      </div>

      {/* Quick actions */}
      <section>
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted">
          Acciones rápidas
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="admin-action-card"
            >
              <span className="action-icon">{action.icon}</span>
              <span className="text-sm font-medium text-center leading-tight">
                {action.label}
              </span>
              <span className="text-[11px] text-muted text-center leading-tight hidden sm:block">
                {action.description}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section>
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted">
          Resumen
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="admin-stat">
            <p className="text-xs text-muted">Pedidos pendientes de pago</p>
            <p className="stat-value text-admin-accent">{stats.pedidosPendientes}</p>
          </div>
          <div className="admin-stat">
            <p className="text-xs text-muted">Pedidos confirmados</p>
            <p className="stat-value text-admin-success">{stats.pedidosConfirmados}</p>
          </div>
          <div className="admin-stat">
            <p className="text-xs text-muted">Productos con stock bajo</p>
            <p className="stat-value" style={{ color: stats.stockBajo > 0 ? "var(--admin-danger)" : "var(--foreground)" }}>
              {stats.stockBajo}
            </p>
          </div>
          <div className="admin-stat">
            <p className="text-xs text-muted">Piezas activas en catálogo</p>
            <p className="stat-value">{stats.totalProductosActivos}</p>
          </div>
        </div>
      </section>

      {/* Producciones en progreso */}
      {produccionesEnProgreso.length > 0 && (
        <section>
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted">
            Producciones en progreso
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {produccionesEnProgreso.map((prod) => (
              <div
                key={prod.id}
                className="flex items-center justify-between rounded-lg border border-border p-4 bg-surface"
              >
                <div>
                  <h3 className="font-medium text-sm">{prod.nombre}</h3>
                  <p className="mt-1 text-xs text-muted">
                    {prod.piezas_borrador} {prod.piezas_borrador === 1 ? "pieza" : "piezas"} en borrador
                  </p>
                </div>
                <Link
                  href={`/admin/produccion/${prod.id}`}
                  className="rounded bg-admin-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-admin-accent-hover transition-colors"
                >
                  Retomar →
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent orders */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted">
            Últimos pedidos
          </h2>
          <Link
            href="/admin/pedidos"
            className="text-xs text-admin-accent hover:text-admin-accent-hover transition-colors"
          >
            Ver todos →
          </Link>
        </div>
        {stats.ultimosPedidos.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted">
              Todavía no hay pedidos. ¡Cuando un cliente compre, lo vas a ver acá!
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted">
                    Cliente
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted">
                    Fecha
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stats.ultimosPedidos.map((pedido) => (
                  <tr key={pedido.id} className="hover:bg-surface/50 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      {pedido.nombre_contacto}
                    </td>
                    <td className="px-4 py-3">{formatPrecio(pedido.total)}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          pedido.estado === "pendiente_pago"
                            ? "warning"
                            : pedido.estado === "confirmado"
                              ? "success"
                              : pedido.estado === "cancelado"
                                ? "muted"
                                : "default"
                        }
                      >
                        {pedido.estado.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {new Date(pedido.created_at).toLocaleDateString("es-AR")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/pedidos/${pedido.id}`}
                        className="text-xs text-admin-accent hover:text-admin-accent-hover"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
