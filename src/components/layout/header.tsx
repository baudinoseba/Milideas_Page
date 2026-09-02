"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_LINKS } from "@/lib/utils/constants";
import { cn } from "@/lib/utils/cn";
import { CartButton } from "@/components/cart/cart-button";
import { NotificationBell } from "@/components/layout/notification-bell";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUserRoleAction } from "@/lib/actions";

function IconUser({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M5.5 21a8.38 8.38 0 0 1 13 0" />
    </svg>
  );
}

function IconMenu({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

export function Header() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  const refreshUserRole = async () => {
    try {
      const res = await getCurrentUserRoleAction();
      setIsLoggedIn(res.isLoggedIn);
      setIsAdmin(res.isAdmin);
      setUserEmail(res.email ?? null);
      setUserName(res.nombre ?? null);
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    const supabase = createClient();

    // Refresh user role
    refreshUserRole();

    supabase
      .from("configuracion_sitio")
      .select("logo_url")
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data?.logo_url) setLogoUrl(data.logo_url);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, _session) => {
      await refreshUserRole();
    });

    // Close user menu on outside click
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    setIsLoggedIn(false);
    setIsAdmin(false);
    setMenuOpen(false);
    setMobileDrawerOpen(false);
    window.location.href = "/auth/logout";
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-[#E5E0D8] bg-white transition-all duration-200 shadow-2xs">
        <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-3 sm:px-6">
          
          {/* Left: Mobile Hamburger Icon + Brand Logo Circular */}
          <div className="flex items-center gap-2 sm:gap-3.5 flex-1 justify-start">
            {/* Hamburger button visible only on mobile/tablets (< md) */}
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="flex md:hidden h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-white text-chocolate hover:bg-stone-100 active:scale-95 transition-all shadow-xs cursor-pointer"
              aria-label="Abrir menú de navegación"
            >
              <IconMenu className="h-5 w-5" />
            </button>

            <Link
              href="/"
              className="flex items-center shrink-0 group transition-transform active:scale-95"
              title="Milideas Inicio"
            >
              <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-full bg-white p-1 ring-1 ring-stone-200 shadow-2xs overflow-hidden flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Milideas"
                    className="h-full w-full object-contain rounded-full"
                  />
                ) : (
                  <img
                    src="/milideas_logo.png"
                    alt="Milideas"
                    className="h-full w-full object-contain rounded-full"
                  />
                )}
              </div>
            </Link>
          </div>

          {/* Center: Desktop Nav Links (hidden on mobile, strictly centered in the viewport) */}
          <nav className="hidden md:flex items-center justify-center shrink-0 gap-1 sm:gap-2">
            {NAV_LINKS.map((link) => {
              const isActive =
                pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs lg:text-sm font-semibold font-sans transition-all duration-200",
                    isActive
                      ? "bg-terracota/15 text-chocolate font-bold ring-1 ring-terracota/30 shadow-xs"
                      : "text-stone-700 hover:text-chocolate hover:bg-stone-100",
                  )}
                >
                  <span className="text-sm lg:text-base leading-none">{link.emoji}</span>
                  <span className="truncate">{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Actions: Mis Compras + Notification Bell + Cart + Profile Popover */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-1 justify-end">
            {/* Direct Mis Compras & Encargos Button */}
            <Link
              href={isLoggedIn ? "/cuenta/pedidos" : "/login?redirect=/cuenta/pedidos"}
              className={cn(
                "hidden sm:flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 border",
                pathname === "/cuenta/pedidos"
                  ? "bg-terracota text-white border-terracota shadow-2xs"
                  : "border-stone-200 bg-white text-stone-700 hover:text-chocolate hover:bg-stone-100 shadow-2xs",
              )}
              title="Ver mis compras de stock y estado de mis encargos"
            >
              <span>🛍️</span>
              <span className="hidden lg:inline">Mis Compras</span>
            </Link>

            {/* Notification Bell */}
            <NotificationBell />

            <CartButton />

            {/* Profile & Settings Dropdown Menu */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 transition-all duration-200 hover:text-chocolate hover:bg-stone-100 active:scale-95 cursor-pointer shadow-xs",
                  menuOpen && "ring-2 ring-terracota/50 text-chocolate bg-stone-100",
                )}
                title="Ajustes y Cuenta"
                aria-label="Menú de usuario"
              >
                <IconUser className="h-4.5 w-4.5" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-3xl border border-[#E5E0D8] bg-white p-3.5 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150 z-50">
                  {/* User info banner */}
                  <div className="border-b border-stone-100 pb-2.5 mb-2.5 px-1">
                    <p className="text-xs font-bold text-chocolate truncate">
                      {userName || (isLoggedIn ? "Mi Cuenta" : "Hola, visitante")}
                    </p>
                    <p className="text-[11px] text-stone-500 truncate">
                      {userEmail || "Bienvenido a Milideas"}
                    </p>
                  </div>

                  {/* Botón Verde Destacado de Panel Admin si es Administrador */}
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 px-3 text-xs shadow-xs transition-all mb-2.5 cursor-pointer"
                    >
                      <span>🛡️</span>
                      <span>Panel de Administración</span>
                      <span>→</span>
                    </Link>
                  )}

                  {/* Menu items */}
                  <div className="space-y-1 text-xs font-medium">
                    {isLoggedIn ? (
                      <>
                        <Link
                          href="/cuenta/perfil"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-stone-700 hover:text-chocolate hover:bg-stone-100 transition-colors"
                        >
                          <span>👤</span>
                          <span>Mi Perfil</span>
                        </Link>
                        <Link
                          href="/cuenta/pedidos"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-stone-700 hover:text-chocolate hover:bg-stone-100 transition-colors"
                        >
                          <span>🛍️</span>
                          <span>Compras & Encargos</span>
                        </Link>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <span>🚪</span>
                          <span>Cerrar Sesión</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/login"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 font-bold text-chocolate hover:bg-stone-100 transition-colors"
                        >
                          <span>🔑</span>
                          <span>Iniciar Sesión</span>
                        </Link>
                        <Link
                          href="/registro"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-stone-600 hover:text-chocolate hover:bg-stone-100 transition-colors"
                        >
                          <span>✨</span>
                          <span>Crear Cuenta</span>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </header>

      {/* ─── Mobile Drawer Menu Lateral (Sheet) ─── */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 z-50 flex bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 md:hidden"
          onClick={() => setMobileDrawerOpen(false)}
        >
          <div
            className="relative w-72 sm:w-80 max-w-[85vw] h-full bg-white border-r border-[#E5E0D8] shadow-2xl p-5 flex flex-col justify-between animate-in slide-in-from-left duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-6">
              {/* Header del Drawer */}
              <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                <Link
                  href="/"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="flex items-center gap-2.5 group"
                >
                  <div className="h-10 w-10 rounded-full bg-white p-1 ring-1 ring-stone-200 shadow-2xs overflow-hidden flex items-center justify-center shrink-0">
                    <img
                      src={logoUrl || "/milideas_logo.png"}
                      alt="Milideas Logo"
                      className="h-full w-full object-contain rounded-full"
                    />
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="rounded-full p-2 text-stone-500 hover:bg-stone-100 active:scale-95 transition-all cursor-pointer"
                  aria-label="Cerrar menú"
                >
                  ✕
                </button>
              </div>

              {/* Links de Navegación Mobile */}
              <nav className="flex flex-col gap-1.5">
                {NAV_LINKS.map((link) => {
                  const isActive =
                    pathname === link.href || pathname.startsWith(link.href + "/");
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileDrawerOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold transition-all",
                        isActive
                          ? "bg-terracota/15 text-chocolate font-bold"
                          : "text-stone-700 hover:bg-stone-100 hover:text-chocolate",
                      )}
                    >
                      <span className="text-xl leading-none">{link.emoji}</span>
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Acceso a Admin / Cuenta Mobile */}
              <div className="border-t border-stone-100 pt-4 space-y-1.5 text-xs font-semibold">
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-2xl px-3.5 py-2.5 font-bold text-xs bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors"
                  >
                    <span>🛡️</span>
                    <span>Panel de Administración</span>
                    <span>→</span>
                  </Link>
                )}

                <Link
                  href={isLoggedIn ? "/cuenta/pedidos" : "/login?redirect=/cuenta/pedidos"}
                  onClick={() => setMobileDrawerOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-3.5 py-2.5 font-bold transition-all",
                    pathname === "/cuenta/pedidos"
                      ? "bg-terracota text-white shadow-xs"
                      : "bg-arena/30 border border-terracota/20 text-chocolate hover:bg-arena/50",
                  )}
                >
                  <span>🛍️</span>
                  <span>Mis Compras & Encargos</span>
                </Link>

                {isLoggedIn ? (
                  <>
                    <Link
                      href="/cuenta/perfil"
                      onClick={() => setMobileDrawerOpen(false)}
                      className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-stone-700 hover:bg-stone-100 transition-colors"
                    >
                      <span>👤</span>
                      <span>Mi Perfil</span>
                    </Link>
                  </>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-chocolate font-bold hover:bg-stone-100 transition-colors"
                  >
                    <span>🔑</span>
                    <span>Iniciar Sesión / Registro</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Footer del Drawer */}
            <div className="border-t border-stone-100 pt-4">
              <a
                href="https://instagram.com/milideas_arte"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 text-xs font-medium text-terracota hover:text-chocolate transition-colors"
              >
                <span>Instagram @milideas_arte</span>
                <span className="text-[10px]">↗</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
