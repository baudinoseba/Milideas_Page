"use client";

import Link from "next/link";
import { cn } from "@/lib/utils/cn";

interface BackButtonProps {
  fallbackHref?: string;
  className?: string;
  children?: React.ReactNode;
}

export function BackButton({ fallbackHref = "/", className, children = "Volver al inicio" }: BackButtonProps) {
  return (
    <Link
      href={fallbackHref}
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium text-barro hover:text-chocolate transition-colors py-1 px-2.5 rounded-lg bg-arena/30 hover:bg-arena/60 border border-border/40 select-none",
        className
      )}
    >
      <span>←</span> {children}
    </Link>
  );
}
