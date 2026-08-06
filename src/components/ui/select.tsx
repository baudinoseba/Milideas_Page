import { cn } from "@/lib/utils/cn";
import { SelectHTMLAttributes, forwardRef } from "react";

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "flex min-h-11 w-full appearance-none rounded-sm border border-border bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
      className,
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";
