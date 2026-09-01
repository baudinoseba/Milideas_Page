"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_LINKS } from "@/lib/utils/constants";
import { cn } from "@/lib/utils/cn";
import { CartButton } from "@/components/cart/cart-button";
import { createClient } from "@/lib/supabase/client";

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
  const [isDark, setIsDark] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const supabase = createClient();
    
    // Check initial dark theme
    const storedTheme = localStorage.getItem("milideas-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (storedTheme === "dark" || (!storedTheme && prefersDark)) {
      setIsDark(true);
    } else {
      setIsDark(false);
    }

    // Check session & admin profile
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        setIsLoggedIn(true);
        setUserEmail(session.user.email ?? null);
        const { data: profile } = await supabase
          .from("perfiles")
          .select("nombre_completo, es_admin")
          .eq("id", session.user.id)
          .single();
        if (profile) {
          setIsAdmin(!!profile.es_admin);
          setUserName(profile.nombre_completo ?? null);
        }
      } else {
        setIsLoggedIn(false);
        setIsAdmin(false);
      }
    });

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
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        setIsLoggedIn(true);
        setUserEmail(session.user.email ?? null);
        const { data: profile } = await supabase
          .from("perfiles")
          .select("nombre_completo, es_admin")
          .eq("id", session.user.id)
          .single();
        if (profile) {
          setIsAdmin(!!profile.es_admin);
          setUserName(profile.nombre_completo ?? null);
        }
      } else {
        setIsLoggedIn(false);
        setIsAdmin(false);
        setUserEmail(null);
        setUserName(null);
      }
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

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("milideas-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("milideas-theme", "light");
    }
  };

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
      <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-surface/90 backdrop-blur-md transition-colors duration-300 shadow-xs">
        <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-3 sm:px-6">
          
          {/* Left: Mobile Hamburger Icon + Brand Logo */}
          <div className="flex items-center gap-2 sm:gap-3.5">
            {/* Hamburger button visible only on mobile/tablets (< md) */}
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="flex md:hidden h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-surface text-chocolate hover:bg-secondary/40 active:scale-95 transition-all shadow-xs cursor-pointer"
              aria-label="Abrir menú de navegación"
            >
              <IconMenu className="h-5 w-5" />
            </button>

            <Link
              href="/"
              className="flex items-center shrink-0 hover:opacity-90 transition-transform active:scale-95"
              title="Milideas Inicio"
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Milideas"
                  className="h-10 sm:h-12 w-auto object-contain"
                />
              ) : (
                <img
                  src="/logo-artistic.jpg"
                  alt="Milideas"
                  className="h-10 sm:h-12 w-auto object-contain"
                />
              )}
            </Link>
          </div>

          {/* Center: Desktop Nav Links (hidden on mobile, visible on desktop >= md) */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2">
            {NAV_LINKS.map((link) => {
              const isActive =
                pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs lg:text-sm font-medium font-sans transition-all duration-200",
                    isActive
                      ? "bg-terracota/15 text-chocolate font-semibold ring-1 ring-terracota/30 shadow-xs"
                      : "text-muted hover:text-chocolate hover:bg-secondary/40",
                  )}
                >
                  <span className="text-sm lg:text-base leading-none">{link.emoji}</span>
                  <span className="truncate">{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Actions: Cart + Profile Popover */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <CartButton />

            {/* Profile & Settings Dropdown Menu */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-surface text-muted transition-all duration-200 hover:text-foreground hover:bg-secondary/40 active:scale-95 cursor-pointer shadow-xs",
                  menuOpen && "ring-2 ring-terracota/50 text-foreground bg-secondary/50",
                )}
                title="Ajustes y Cuenta"
                aria-label="Menú de usuario"
              >
                <IconUser className="h-4.5 w-4.5" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-border/80 bg-surface/98 p-3 shadow-xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                  {/* User info banner */}
                  <div className="border-b border-border/60 pb-2.5 mb-2.5 px-1">
                    <p className="text-xs font-semibold text-chocolate truncate">
                      {userName || (isLoggedIn ? "Mi Cuenta" : "Hola, visitante")}
                    </p>
                    <p className="text-[11px] text-muted truncate">
                      {userEmail || "Bienvenido a Milideas"}
                    </p>
                  </div>

                  {/* Dark mode switch inside menu */}
                  <div className="flex items-center justify-between rounded-xl bg-secondary/40 px-3 py-2 text-xs font-medium text-foreground mb-2">
                    <span className="flex items-center gap-2">
                      <span>{isDark ? "🌙 Modo Noche" : "☀️ Modo Claro"}</span>
                    </span>
                    <button
                      type="button"
                      onClick={toggleTheme}
                      className={cn(
                        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                        isDark ? "bg-terracota" : "bg-barro-claro",
                      )}
                      role="switch"
                      aria-checked={isDark}
                    >
                      <span
                        className={cn(
                          "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
                          isDark ? "translate-x-4" : "translate-x-0",
                        )}
                      />
                    </button>
                  </div>

                  {/* Menu items */}
                  <div className="space-y-1 text-xs">
                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 font-semibold text-terracota hover:bg-terracota/10 transition-colors"
                      >
                        <span>⚙️</span>
                        <span>Panel de Administración</span>
                      </Link>
                    )}

                    {isLoggedIn ? (
                      <>
                        <Link
                          href="/cuenta/perfil"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-foreground hover:bg-secondary/50 transition-colors"
                        >
                          <span>👤</span>
                          <span>Mi Perfil & Compras</span>
                        </Link>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-admin-danger hover:bg-red-500/10 transition-colors cursor-pointer"
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
                          className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 font-medium text-foreground hover:bg-secondary/50 transition-colors"
                        >
                          <span>🔑</span>
                          <span>Iniciar Sesión</span>
                        </Link>
                        <Link
                          href="/registro"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-muted hover:bg-secondary/50 transition-colors"
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
            className="relative w-72 sm:w-80 max-w-[85vw] h-full bg-surface border-r border-border/80 shadow-2xl p-5 flex flex-col justify-between animate-in slide-in-from-left duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-6">
              {/* Header del Drawer */}
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <Link
                  href="/"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="flex items-center gap-2.5 group"
                >
                  <img
                    src="/logo-artistic.jpg"
                    alt="Milideas"
                    className="h-10 w-auto object-contain group-hover:scale-105 transition-transform"
                  />
                  <div>
                    <span className="text-sm font-semibold text-chocolate font-serif block group-hover:text-terracota transition-colors">
                      Milideas
                    </span>
                    <span className="text-[10px] text-muted block">Estudio de Arte & Cerámica</span>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/50 text-chocolate hover:bg-secondary transition-all cursor-pointer"
                  aria-label="Cerrar menú"
                >
                  ✕
                </button>
              </div>

              {/* Lista de Navegación Principal */}
              <nav className="space-y-1.5">
                {/* Botón Volver al Inicio */}
                <Link
                  href="/"
                  onClick={() => setMobileDrawerOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium font-sans transition-all",
                    pathname === "/"
                      ? "bg-terracota/15 text-chocolate font-semibold ring-1 ring-terracota/30 shadow-xs"
                      : "text-muted hover:text-chocolate hover:bg-secondary/40"
                  )}
                >
                  <span className="text-lg leading-none">🏠</span>
                  <span>Inicio</span>
                </Link>

                {NAV_LINKS.map((link) => {
                  const isActive =
                    pathname === link.href || pathname.startsWith(link.href + "/");
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileDrawerOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium font-sans transition-all",
                        isActive
                          ? "bg-terracota/15 text-chocolate font-semibold ring-1 ring-terracota/30 shadow-xs"
                          : "text-muted hover:text-chocolate hover:bg-secondary/40"
                      )}
                    >
                      <span className="text-lg leading-none">{link.emoji}</span>
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Enlaces de Cuenta */}
              <div className="border-t border-border/60 pt-4 space-y-1.5 text-xs">
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3.5 py-2 font-semibold text-terracota hover:bg-terracota/10 transition-colors"
                  >
                    <span>⚙️</span>
                    <span>Panel Admin</span>
                  </Link>
                )}

                {isLoggedIn ? (
                  <Link
                    href="/cuenta/perfil"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3.5 py-2 text-foreground hover:bg-secondary/40 transition-colors"
                  >
                    <span>👤</span>
                    <span>Mi Perfil & Compras</span>
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3.5 py-2 text-chocolate font-medium hover:bg-secondary/40 transition-colors"
                  >
                    <span>🔑</span>
                    <span>Iniciar Sesión / Registro</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Footer del Drawer */}
            <div className="border-t border-border/60 pt-4 space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-secondary/40 px-3 py-2 text-xs font-medium text-foreground">
                <span>{isDark ? "🌙 Modo Noche" : "☀️ Modo Claro"}</span>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
                    isDark ? "bg-terracota" : "bg-barro-claro"
                  )}
                  role="switch"
                  aria-checked={isDark}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
                      isDark ? "translate-x-4" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

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
