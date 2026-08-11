"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_LINKS } from "@/lib/utils/constants";
import { cn } from "@/lib/utils/cn";
import { CartButton } from "@/components/cart/cart-button";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/layout/theme-toggle";

/* Inline SVG icons — uniform 20x20 sizing for clean alignment */
function IconUser({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M5.5 21a8.38 8.38 0 0 1 13 0" />
    </svg>
  );
}

function IconCeramica({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3h8a2 2 0 0 1 2 2v2a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V5a2 2 0 0 1 2-2z" />
      <path d="M6 11v2a6 6 0 0 0 12 0v-2" />
      <path d="M9 21h6" />
      <path d="M12 17v4" />
    </svg>
  );
}

function IconEsculturas({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-4 4 4 4 0 0 1-4-4V6a4 4 0 0 1 4-2z" />
      <path d="M6 22v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3" />
    </svg>
  );
}

function IconIlustraciones({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.92 0 1.67-.75 1.67-1.67 0-.42-.16-.8-.42-1.08-.26-.28-.42-.66-.42-1.08 0-.92.75-1.67 1.67-1.67H16c3.31 0 6-2.69 6-6 0-4.96-4.49-9-10-9z" />
    </svg>
  );
}

function IconCollection({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  );
}

export function Header() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
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
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-surface/80 backdrop-blur-md transition-colors duration-300">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:h-16 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
          {logoUrl ? (
            <img src={logoUrl} alt="Milideas" className="h-9 max-w-[140px] object-contain" />
          ) : (
            <span className="flex items-center gap-2.5">
              <img src="/logo-artistic.jpg" alt="Milideas" className="h-9 sm:h-10 w-auto rounded-lg object-contain shadow-xs" />
              <span className="text-xl font-semibold font-serif tracking-tight text-chocolate">
                Milideas
              </span>
            </span>
          )}
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-1.5 sm:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-lg px-3.5 py-2 text-sm font-medium font-sans transition-all duration-200",
                pathname === link.href
                  ? "text-chocolate font-semibold bg-terracota/10"
                  : "text-muted hover:text-chocolate hover:bg-secondary/35",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="flex items-center gap-2 text-sm">
          <ThemeToggle />
          <Link
            href={isLoggedIn ? "/cuenta/perfil" : "/login"}
            className="hidden items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-sans text-muted transition-all duration-200 hover:bg-secondary/35 hover:text-primary sm:inline-flex"
          >
            <IconUser className="h-4 w-4" />
            <span>{isLoggedIn ? "Mi Cuenta" : "Ingresar"}</span>
          </Link>
          <CartButton />
        </div>
      </div>

      {/* Mobile navigation */}
      <MobileNav pathname={pathname} isLoggedIn={isLoggedIn} />
    </header>
  );
}

function MobileNav({
  pathname,
  isLoggedIn,
}: {
  pathname: string;
  isLoggedIn: boolean;
}) {
  const items = [
    { href: "/catalogo/ceramica", label: "Cerámica", icon: IconCeramica },
    { href: "/catalogo/esculturas", label: "Esculturas", icon: IconEsculturas },
    { href: "/catalogo/ilustraciones", label: "Ilustraciones", icon: IconIlustraciones },
    { href: "/colecciones", label: "Colecciones", icon: IconCollection },
  ];

  return (
    <nav className="flex items-center justify-between border-t border-border/70 bg-surface/95 px-3 py-1.5 sm:hidden">
      <div className="flex flex-1 items-center justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-2 py-1 text-[11px] font-sans transition-all duration-200 rounded-lg",
                isActive
                  ? "text-chocolate font-semibold bg-terracota/10"
                  : "text-muted hover:text-chocolate hover:bg-surface",
              )}
            >
              <Icon className="h-4.5 w-4.5 shrink-0" />
              <span className="leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Universal Profile Icon ONLY (No text label per user request) */}
      <div className="border-l border-border/60 pl-2">
        <Link
          href={isLoggedIn ? "/cuenta/perfil" : "/login"}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200",
            (pathname.startsWith("/cuenta") || pathname === "/login" || pathname === "/registro")
              ? "text-chocolate bg-terracota/15 ring-1 ring-terracota/40 font-semibold"
              : "text-muted hover:text-chocolate hover:bg-surface",
          )}
          title={isLoggedIn ? "Mi Cuenta" : "Iniciar Sesión"}
          aria-label={isLoggedIn ? "Mi Cuenta" : "Iniciar Sesión"}
        >
          <IconUser className="h-5 w-5 shrink-0" />
        </Link>
      </div>
    </nav>
  );
}
