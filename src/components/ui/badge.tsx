import { cn } from "@/lib/utils/cn";

type BadgeVariant = "default" | "success" | "warning" | "muted" | "accent";

const variants: Record<BadgeVariant, string> = {
  default: "bg-secondary text-secondary-foreground",
  success: "bg-emerald-50 text-emerald-800 border border-emerald-100/50",
  warning: "bg-amber-50 text-amber-800 border border-amber-100/50",
  muted: "bg-border/40 text-muted",
  accent: "bg-accent/10 text-accent-hover border border-accent/20",
};

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide transition-colors",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
