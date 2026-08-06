"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_LINKS } from "@/lib/utils/constants";
import { cn } from "@/lib/utils/cn";
import { CartButton } from "@/components/cart/cart-button";

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:h-16 sm:px-6">
        <Link href="/" className="text-lg font-medium tracking-tight">
          Milideas
        </Link>
        <nav className="hidden items-center gap-6 sm:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm text-muted transition-colors hover:text-foreground",
                pathname === link.href && "text-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/cuenta/perfil"
            className="hidden text-sm text-muted hover:text-foreground sm:inline"
          >
            Cuenta
          </Link>
          <CartButton />
        </div>
      </div>
      <MobileNav pathname={pathname} />
    </header>
  );
}

function MobileNav({ pathname }: { pathname: string }) {
  return (
    <nav className="flex border-t border-border sm:hidden">
      {NAV_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "flex-1 py-3 text-center text-xs text-muted",
            pathname === link.href && "text-foreground font-medium",
          )}
        >
          {link.label}
        </Link>
      ))}
      <Link
        href="/cuenta/perfil"
        className={cn(
          "flex-1 py-3 text-center text-xs text-muted",
          pathname.startsWith("/cuenta") && "text-foreground font-medium",
        )}
      >
        Cuenta
      </Link>
    </nav>
  );
}
