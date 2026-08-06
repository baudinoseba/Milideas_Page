import { cn } from "@/lib/utils/cn";

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-sm border border-border bg-surface p-4 sm:p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
