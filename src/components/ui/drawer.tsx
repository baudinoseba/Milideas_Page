"use client";

import { cn } from "@/lib/utils/cn";
import { useEffect } from "react";

export function Drawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-foreground/20"
        onClick={onClose}
        aria-label="Cerrar"
      />
      <div
        className={cn(
          "relative flex h-full w-full max-w-md flex-col bg-surface shadow-xl",
        )}
        role="dialog"
        aria-modal
        aria-label={title}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <h2 className="text-lg font-medium">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-foreground"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}
