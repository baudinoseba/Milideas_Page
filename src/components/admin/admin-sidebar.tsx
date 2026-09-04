"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: "📊",
    exact: true,
  },
  {
    href: "/admin/ceramica",
    label: "Cerámica",
    icon: "🏺",
  },
  {
    href: "/admin/ilustracion",
    label: "Ilustración",
    icon: "🎨",
  },
  {
    href: "/admin/obras",
    label: "Obras y Proyectos",
    icon: "🌟",
  },
  {
    href: "/admin/pedidos",
    label: "Ventas",
    icon: "📦",
  },
  {
    href: "/admin/encargos",
    label: "Encargos",
    icon: "📝",
  },
  {
    href: "/admin/logistica",
    label: "Logística",
    icon: "🚚",
  },
  {
    href: "/admin/personalizacion",
    label: "Portada & Sitio",
    icon: "⚙️",
  },
];

export function AdminSidebar({
  nombreAdmin,
  pedidosPendientes,
}: {
  nombreAdmin: string;
  pedidosPendientes: number;
}) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  };

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    window.location.href = "/auth/logout";
  };

  return (
    <>
      {/* Mobile top bar */}
      <header className="flex items-center justify-between border-b border-border bg-admin-sidebar px-4 py-3 lg:hidden">
        <MobileMenu
          isActive={isActive}
          pedidosPendientes={pedidosPendientes}
          handleLogout={handleLogout}
        />
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-admin-sidebar">
        <div className="flex flex-1 flex-col overflow-y-auto pt-4">
          
          {/* Navigation - Inicia directamente arriba */}
          <nav className="flex-1 px-3 space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-admin-sidebar-hover text-admin-sidebar-active font-semibold"
                      : "text-admin-sidebar-text hover:bg-admin-sidebar-hover hover:text-admin-sidebar-active"
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {item.label === "Pedidos" && pedidosPendientes > 0 && (
                    <span className="rounded-full bg-admin-accent px-2 py-0.5 text-[10px] font-bold text-white">
                      {pedidosPendientes}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom section: Ver tienda y Perfil con Logout */}
          <div className="border-t border-white/10 px-3 py-4 space-y-2">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-3 rounded-xl px-3.5 py-2 text-sm text-admin-sidebar-text hover:bg-admin-sidebar-hover hover:text-admin-sidebar-active transition-colors"
            >
              <span className="text-base">🏪</span>
              <span>Ver tienda online</span>
              <span className="text-xs text-admin-sidebar-text/70 ml-auto">↗</span>
            </Link>

            <div className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-admin-accent text-xs font-bold text-white shrink-0">
                  {nombreAdmin.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-xs font-semibold text-admin-sidebar-active">{nombreAdmin}</p>
                  <p className="text-[10px] text-admin-sidebar-text truncate">Administrador</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="text-xs text-rose-300 hover:text-rose-100 hover:bg-rose-900/40 p-1.5 rounded-lg transition-colors cursor-pointer"
                title="Cerrar sesión"
              >
                <span>🚪</span>
              </button>
            </div>
          </div>

        </div>
      </aside>
    </>
  );
}

/* ─── Mobile hamburger menu ─── */
function MobileMenu({
  isActive,
  pedidosPendientes,
  handleLogout,
}: {
  isActive: (href: string, exact?: boolean) => boolean;
  pedidosPendientes: number;
  handleLogout: () => void;
}) {
  return (
    <nav className="flex items-center gap-1 overflow-x-auto w-full justify-between">
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? "bg-admin-sidebar-hover text-admin-sidebar-active"
                  : "text-admin-sidebar-text hover:text-admin-sidebar-active"
              }`}
            >
              <span className="mr-1">{item.icon}</span>
              {item.label}
              {item.label === "Pedidos" && pedidosPendientes > 0 && (
                <span className="ml-1 rounded-full bg-admin-accent px-1.5 py-0.5 text-[9px] font-bold text-white">
                  {pedidosPendientes}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handleLogout}
        className="shrink-0 rounded-lg px-2 py-1 text-xs text-rose-300 hover:text-rose-100"
        title="Cerrar sesión"
      >
        🚪
      </button>
    </nav>
  );
}
