"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const navItems = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: "📊",
    exact: true,
  },
  {
    href: "/admin/produccion",
    label: "Producciones",
    icon: "🎬",
  },
  {
    href: "/admin/personalizacion",
    label: "Portada & Sitio",
    icon: "🎨",
  },
  {
    href: "/admin/productos",
    label: "Productos",
    icon: "🏺",
  },
  {
    href: "/admin/pedidos",
    label: "Pedidos",
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

  return (
    <>
      {/* Mobile top bar */}
      <header className="flex items-center justify-between border-b border-border bg-admin-sidebar px-4 py-3 lg:hidden">
        <Link href="/admin" className="text-lg font-medium text-admin-sidebar-active">
          Milideas Admin
        </Link>
        <MobileMenu
          pathname={pathname}
          isActive={isActive}
          pedidosPendientes={pedidosPendientes}
        />
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-admin-sidebar">
        <div className="flex flex-1 flex-col overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center gap-2 px-6 py-5 border-b border-white/10">
            <span className="text-lg font-semibold text-admin-sidebar-active">
              Milideas
            </span>
            <span className="rounded bg-admin-accent px-1.5 py-0.5 text-[10px] font-bold uppercase text-white tracking-wider">
              Admin
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-admin-sidebar-hover text-admin-sidebar-active"
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

          {/* Bottom section */}
          <div className="border-t border-white/10 px-3 py-4 space-y-2">
            <div className="px-3 py-1">
              <ThemeToggle />
            </div>
            <Link
              href="/"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-admin-sidebar-text hover:bg-admin-sidebar-hover hover:text-admin-sidebar-active transition-colors"
            >
              <span className="text-base">🏪</span>
              <span>Ver tienda</span>
            </Link>
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-admin-accent text-xs font-bold text-white">
                {nombreAdmin.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm text-admin-sidebar-active">{nombreAdmin}</p>
                <p className="text-[11px] text-admin-sidebar-text">Administrador</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

/* ─── Mobile hamburger menu ─── */
function MobileMenu({
  _pathname,
  isActive,
  pedidosPendientes,
}: {
  _pathname?: string;
  isActive: (href: string, exact?: boolean) => boolean;
  pedidosPendientes: number;
}) {
  return (
    <nav className="flex items-center gap-1 overflow-x-auto">
      {navItems.map((item) => {
        const active = isActive(item.href, item.exact);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative shrink-0 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
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
      <Link
        href="/"
        className="shrink-0 rounded-md px-2.5 py-1.5 text-xs text-admin-sidebar-text hover:text-admin-sidebar-active"
      >
        🏪 Tienda
      </Link>
    </nav>
  );
}
