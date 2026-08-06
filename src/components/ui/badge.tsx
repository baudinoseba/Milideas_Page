import { cn } from "@/lib/utils/cn";

type BadgeVariant = "default" | "success" | "warning" | "muted";

const variants: Record<BadgeVariant, string> = {
  default: "bg-foreground/5 text-foreground",
  success: "bg-emerald-50 text-emerald-800",
  warning: "bg-amber-50 text-amber-800",
  muted: "bg-border/50 text-muted",
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
        "inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
