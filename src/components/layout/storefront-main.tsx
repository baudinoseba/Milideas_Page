"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

export function StorefrontMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <main
      className={cn(
        "w-full flex-1 overflow-x-hidden",
        isHome ? "" : "mx-auto max-w-7xl px-3.5 py-6 sm:px-6 sm:py-8"
      )}
    >
      {children}
    </main>
  );
}
