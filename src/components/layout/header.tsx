"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_LINKS } from "@/lib/utils/constants";
import { cn } from "@/lib/utils/cn";
import { CartButton } from "@/components/cart/cart-button";
import { createClient } from "@/lib/supabase/client";

/* Inline SVG icons — no external dependencies */
function IconUser({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M5.5 21a8.38 8.38 0 0 1 13 0" />
    </svg>
  );
}

function IconCatalog({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function IconCollection({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z" />
      <path d="M8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  );
}

const MOBILE_ICONS: Record<string, typeof IconCatalog> = {
  "/catalogo": IconCatalog,
  "/colecciones": IconCollection,
};

import { ThemeToggle } from "@/components/layout/theme-toggle";

import { EncargosCartButton } from "@/components/cart/encargos-cart-button";
import { EncargosCartDrawer } from "@/components/cart/encargos-cart-drawer";

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

        <nav className="hidden items-center gap-1.5 sm:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-lg px-3.5 py-2 text-sm font-medium font-sans transition-all duration-200",
                pathname === link.href
                  ? "text-primary font-semibold bg-secondary/50"
                  : "text-muted hover:text-primary hover:bg-secondary/35",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 text-sm">
          <ThemeToggle />
          <Link
            href={isLoggedIn ? "/cuenta/perfil" : "/login"}
            className="hidden items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-sans text-muted transition-all duration-200 hover:bg-secondary/35 hover:text-primary sm:inline-flex"
          >
            <IconUser className="h-4 w-4" />
            <span>{isLoggedIn ? "Mi Cuenta" : "Ingresar"}</span>
          </Link>
          <EncargosCartButton />
          <CartButton />
        </div>
      </div>
      <MobileNav pathname={pathname} isLoggedIn={isLoggedIn} />
      <EncargosCartDrawer />
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
  return (
    <nav className="flex border-t border-border sm:hidden">
      {NAV_LINKS.map((link) => {
        const Icon = MOBILE_ICONS[link.href];
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] transition-all duration-205",
              isActive ? "text-primary font-semibold" : "text-muted hover:text-primary",
            )}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {link.label}
          </Link>
        );
      })}
      <Link
        href={isLoggedIn ? "/cuenta/perfil" : "/login"}
        className={cn(
          "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] transition-all duration-205",
          (pathname.startsWith("/cuenta") ||
            pathname === "/login" ||
            pathname === "/registro") &&
            "text-primary font-semibold",
          !(pathname.startsWith("/cuenta") ||
            pathname === "/login" ||
            pathname === "/registro") && "text-muted hover:text-primary",
        )}
      >
        <IconUser className="h-4 w-4" />
        {isLoggedIn ? "Cuenta" : "Ingresar"}
      </Link>
    </nav>
  );
}
