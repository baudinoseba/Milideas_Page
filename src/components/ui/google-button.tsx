"use client";

import { Button } from "@/components/ui/button";

interface GoogleButtonProps {
  redirectTo?: string;
  label?: string;
  disabled?: boolean;
}

export function GoogleButton({
  label = "Continuar con Google",
  disabled = true,
}: GoogleButtonProps) {
  return (
    <div className="relative w-full">
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        className="w-full relative flex items-center justify-center gap-2.5 bg-surface/80 text-muted-foreground border border-border/80 font-medium cursor-not-allowed opacity-80 transition-all py-2.5"
        title="Autenticación con Google en desarrollo (Próximamente)"
      >
        <svg className="w-5 h-5 flex-shrink-0 opacity-70 grayscale" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.29v3.15C3.26 21.3 7.37 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.27a7.22 7.22 0 0 1 0-4.54V6.58H1.29a11.98 11.98 0 0 0 0 10.84l3.99-3.15z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.26 2.7 1.29 6.58l3.99 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
          />
        </svg>
        <span className="text-xs sm:text-sm">{label}</span>
        <span className="ml-auto text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-muted/20 text-muted border border-border/60">
          Próximamente
        </span>
      </Button>
    </div>
  );
}
