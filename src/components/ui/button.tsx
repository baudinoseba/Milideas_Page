import { cn } from "@/lib/utils/cn";
import { ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "primary" | "ghost" | "outline";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50",
  ghost: "bg-transparent hover:bg-border/60 text-foreground",
  outline:
    "border border-border bg-transparent hover:bg-surface text-foreground",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      isLoading,
      disabled,
      children,
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-sm px-5 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed",
        variants[variant],
        className,
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? "Cargando..." : children}
    </button>
  ),
);
Button.displayName = "Button";
