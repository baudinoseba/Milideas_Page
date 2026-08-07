"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

interface BackButtonProps {
  fallbackHref?: string;
  className?: string;
  children?: React.ReactNode;
}

export function BackButton({ fallbackHref, className, children = "Volver" }: BackButtonProps) {
  const router = useRouter();

  const handleBack = (e: React.MouseEvent) => {
    // If there is history to go back to, let browser handle it.
    // If not, it will fall back to the href link.
    if (typeof window !== "undefined" && window.history.length > 1) {
      e.preventDefault();
      router.back();
    }
  };

  if (fallbackHref) {
    return (
      <Link
        href={fallbackHref}
        onClick={handleBack}
        className={cn(
          "inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors",
          className
        )}
      >
        <span>←</span> {children}
      </Link>
    );
  }

  return (
    <button
      onClick={() => router.back()}
      className={cn(
        "inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors cursor-pointer bg-transparent border-0 p-0 font-medium",
        className
      )}
    >
      <span>←</span> {children}
    </button>
  );
}
