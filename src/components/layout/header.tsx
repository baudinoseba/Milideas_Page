"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_LINKS } from "@/lib/utils/constants";
import { cn } from "@/lib/utils/cn";
import { CartButton } from "@/components/cart/cart-button";
import { createClient } from "@/lib/supabase/client";
import { logoutAction } from "@/lib/actions";

function IconUser({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M5.5 21a8.38 8.38 0 0 1 13 0" />
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
  const [isDark, setIsDark] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

    // Close menu on outside click
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
      await logoutAction();
    } catch (e) {
      console.error(e);
    }
    setIsLoggedIn(false);
    setIsAdmin(false);
    setMenuOpen(false);
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-surface/90 backdrop-blur-md transition-colors duration-300 shadow-xs">
      {/* Single Compact Row (Both Mobile & Desktop) */}
      <div className="mx-auto flex h-13 sm:h-15 max-w-7xl items-center justify-between px-3 sm:px-6">
        
        {/* Left: Brand Icon Logo Only */}
        <Link
          href="/"
          className="flex items-center shrink-0 hover:opacity-90 transition-transform active:scale-95"
          title="Milideas Inicio"
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Milideas"
              className="h-8 sm:h-9 w-auto rounded-lg object-contain"
            />
          ) : (
            <img
              src="/logo-artistic.jpg"
              alt="Milideas"
              className="h-8 sm:h-9 w-auto rounded-lg object-contain shadow-xs"
            />
          )}
        </Link>

        {/* Center: Clean Nav Links in 1 Single Line */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {NAV_LINKS.map((link) => {
            const isActive =
              pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-2.5 py-1 sm:px-3.5 sm:py-1.5 text-xs sm:text-sm font-medium font-sans transition-all duration-200",
                  isActive
                    ? "bg-terracota/15 text-chocolate font-semibold ring-1 ring-terracota/30 shadow-xs"
                    : "text-muted hover:text-chocolate hover:bg-secondary/40",
                )}
              >
                <span className="text-sm sm:text-base leading-none">{link.emoji}</span>
                <span className="truncate">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Actions: Cart + Profile Popover (with Dark Mode inside) */}
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
  );
}
