"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/actions";
import { cn } from "@/lib/utils/cn";
import { NotificationBell } from "@/components/layout/notification-bell";
import { CartButton } from "@/components/cart/cart-button";
import { useCartItemCount, useCartStore } from "@/stores/cart-store";
import { useEncargosCartStore } from "@/stores/encargos-cart-store";

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

interface CuentaHeaderProps {
  userEmail: string;
  userName?: string | null;
  isAdmin?: boolean;
  logoUrl?: string | null;
}

export function CuentaHeader({
  userEmail,
  userName,
  isAdmin,
  logoUrl,
}: CuentaHeaderProps) {
  const pathname = usePathname();
  const [loggingOut, startLogout] = useTransition();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Cart integration
  const stockCount = useCartItemCount();
  const encargosCount = useEncargosCartStore((s) => s.getTotalItems());
  const totalCartCount = stockCount + encargosCount;
  const openCart = useCartStore((s) => s.openCart);

  // Close user dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    startLogout(async () => {
      await logoutAction();
    });
  };

  const isPerfil = pathname.startsWith("/cuenta/perfil");
  const isPedidos = pathname.startsWith("/cuenta/pedidos");

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-[#E5E0D8] bg-white transition-all duration-200 shadow-2xs">
        <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-3 sm:px-6">
          
          {/* ─── 1. ZONA IZQUIERDA: Hamburger (Mobile) + Logo + Título ─── */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-start">
            {/* Botón hamburguesa sólo en mobile/tablets */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="flex md:hidden h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-white text-chocolate hover:bg-stone-100 active:scale-95 transition-all shadow-xs cursor-pointer shrink-0"
              aria-label="Abrir menú"
            >
              <IconMenu className="h-5 w-5" />
            </button>

            {/* Logo de la tienda (Visible en pantallas grandes sm:flex) */}
            <Link
              href="/"
              className="hidden sm:flex items-center shrink-0 group transition-transform active:scale-95"
              title="Volver al Inicio de Milideas"
            >
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-white p-0.5 ring-1 ring-stone-200 shadow-2xs overflow-hidden flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
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

          {/* ─── 2. ZONA CENTRAL: Navegación Perfectamente Centrada ─── */}
          <nav className="flex items-center justify-center shrink-0">
            <div className="flex items-center gap-1 p-1 rounded-full bg-[#FAF7F2] border border-[#E5E0D8] shadow-2xs">
              <Link
                href="/cuenta/perfil"
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 sm:px-4 py-1.5 text-xs font-sans transition-all duration-200 whitespace-nowrap",
                  isPerfil
                    ? "bg-terracota text-white font-bold shadow-xs"
                    : "text-stone-700 hover:text-chocolate hover:bg-stone-200/50 font-semibold",
                )}
              >
                <span>👤</span>
                <span className="hidden sm:inline">Mi Perfil</span>
                <span className="sm:hidden">Perfil</span>
              </Link>

              <Link
                href="/cuenta/pedidos"
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 sm:px-4 py-1.5 text-xs font-sans transition-all duration-200 whitespace-nowrap",
                  isPedidos
                    ? "bg-terracota text-white font-bold shadow-xs"
                    : "text-stone-700 hover:text-chocolate hover:bg-stone-200/50 font-semibold",
                )}
              >
                <span>🛍️</span>
                <span>Compras & Encargos</span>
              </Link>
            </div>
          </nav>

          {/* ─── 3. ZONA DERECHA: Botón Tienda + Notificaciones + Carrito + Usuario ─── */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-1 justify-end">
            {/* Enlace discreto a la tienda en escritorio grande */}
            <Link
              href="/"
              className="hidden lg:flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border border-stone-200 bg-white text-stone-700 hover:text-chocolate hover:bg-stone-100 shadow-2xs transition-all"
              title="Ir a la tienda principal"
            >
              <span>🏪</span>
              <span>Tienda</span>
            </Link>

            {/* Campanita de Notificaciones */}
            <NotificationBell />

            {/* Carrito de Compras */}
            <CartButton />

            {/* Menú Desplegable de Usuario (Visible en pantallas grandes sm:block) */}
            <div className="relative hidden sm:block" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((prev) => !prev)}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 transition-all duration-200 hover:text-chocolate hover:bg-stone-100 active:scale-95 cursor-pointer shadow-xs",
                  userMenuOpen && "ring-2 ring-terracota/50 text-chocolate bg-stone-100",
                )}
                title="Opciones de Cuenta"
                aria-label="Menú de usuario"
              >
                <IconUser className="h-4.5 w-4.5" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-3xl border border-[#E5E0D8] bg-white p-3.5 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150 z-50">
                  {/* Encabezado del Usuario */}
                  <div className="border-b border-stone-100 pb-2.5 mb-2.5 px-1">
                    <p className="text-xs font-bold text-chocolate truncate">
                      {userName || "Mi Cuenta"}
                    </p>
                    <p className="text-[11px] text-stone-500 font-mono truncate">
                      {userEmail}
                    </p>
                    {isAdmin && (
                      <span className="inline-block mt-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 border border-emerald-300">
                        🛡️ Administrador
                      </span>
                    )}
                  </div>

                  {/* Acciones del Menú */}
                  <div className="space-y-1 text-xs font-semibold">
                    <Link
                      href="/"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 p-2 rounded-xl text-stone-700 hover:bg-stone-100 transition-colors"
                    >
                      <span>🏪</span>
                      <span>Volver a la Tienda</span>
                    </Link>

                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 p-2 rounded-xl text-emerald-800 hover:bg-emerald-50 transition-colors border border-emerald-200/60"
                      >
                        <span>🛡️</span>
                        <span>Panel de Administración</span>
                      </Link>
                    )}
                  </div>

                  {/* Botón Cerrar Sesión Elegante */}
                  <div className="pt-2.5 mt-2.5 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleLogout();
                      }}
                      disabled={loggingOut}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-stone-50 hover:bg-rose-50 border border-stone-200 hover:border-rose-200 text-stone-600 hover:text-rose-700 py-2 text-xs font-bold transition-all cursor-pointer"
                    >
                      <span>🚪</span>
                      <span>{loggingOut ? "Cerrando..." : "Cerrar sesión"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </header>

      {/* ─── 4. DRAWER LATERAL MÓVIL (< md) ─── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="fixed inset-y-0 left-0 w-72 max-w-[80vw] bg-white p-5 shadow-2xl flex flex-col justify-between border-r border-[#E5E0D8] animate-in slide-in-from-left duration-200">
            <div className="space-y-5">
              
              {/* Header Drawer */}
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-full bg-white ring-1 ring-stone-200 shadow-2xs overflow-hidden flex items-center justify-center p-0.5">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="h-full w-full object-contain rounded-full" />
                    ) : (
                      <img src="/milideas_logo.png" alt="Logo" className="h-full w-full object-contain rounded-full" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-chocolate text-sm leading-tight">Milideas Arte</h3>
                    <p className="text-[11px] text-stone-500 font-sans">Panel de Usuario</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-full p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                  aria-label="Cerrar menú"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Información del Usuario */}
              <div className="rounded-2xl bg-[#FAF7F2] border border-[#E5E0D8] p-3 space-y-1">
                <p className="text-xs font-bold text-stone-900 truncate">
                  {userName || "Mi Cuenta"}
                </p>
                <p className="text-[11px] text-stone-500 font-mono truncate">
                  {userEmail}
                </p>
                {isAdmin && (
                  <span className="inline-block mt-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 border border-emerald-300">
                    🛡️ Administrador
                  </span>
                )}
              </div>

              {/* Enlaces de Navegación del Menú */}
              <div className="space-y-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openCart();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer text-xs font-semibold"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">🛒</span>
                    <span>Mi Carrito</span>
                  </div>
                  {totalCartCount > 0 && (
                    <span className="rounded-full bg-terracota text-white text-[10px] font-bold px-2 py-0.5 font-mono">
                      {totalCartCount}
                    </span>
                  )}
                </button>

                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl text-stone-800 hover:bg-stone-100 transition-colors"
                >
                  <span className="text-base">🏪</span>
                  <span>Volver a la Tienda</span>
                </Link>

                <Link
                  href="/ceramica/stock"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl text-stone-800 hover:bg-stone-100 transition-colors"
                >
                  <span className="text-base">🏺</span>
                  <span>Piezas en Stock</span>
                </Link>

                <Link
                  href="/ceramica/catalogo"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl text-stone-800 hover:bg-stone-100 transition-colors"
                >
                  <span className="text-base">🎨</span>
                  <span>Catálogo de Encargos</span>
                </Link>

                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl text-emerald-800 hover:bg-emerald-50 transition-colors border border-emerald-200/60 mt-2"
                  >
                    <span className="text-base">🛡️</span>
                    <span>Panel de Administración</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Footer con Botón de Cerrar Sesión */}
            <div className="pt-4 border-t border-stone-100">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                disabled={loggingOut}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-stone-50 hover:bg-rose-50 border border-stone-200 text-stone-600 hover:text-rose-700 py-2.5 text-xs font-bold transition-all cursor-pointer"
              >
                <span>🚪</span>
                <span>{loggingOut ? "Cerrando sesión..." : "Cerrar sesión"}</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
