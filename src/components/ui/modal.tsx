"use client";

import { cn } from "@/lib/utils/cn";
import { useEffect } from "react";

export function Modal({
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
    if (open) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-foreground/20"
        onClick={onClose}
        aria-label="Cerrar"
      />
      <div
        className="relative w-full max-w-md rounded-sm border border-border bg-surface p-6 shadow-xl"
        role="dialog"
        aria-modal
        aria-label={title}
      >
        <h2 className="mb-4 text-lg font-medium">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export function Toast({
  message,
  type = "info",
  onClose,
}: {
  message: string;
  type?: "info" | "success" | "error";
  onClose?: () => void;
}) {
  const colors = {
    info: "bg-foreground text-background",
    success: "bg-emerald-800 text-white",
    error: "bg-red-800 text-white",
  };

  return (
    <div
      className={cn(
        "fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-sm px-4 py-3 text-sm shadow-lg",
        colors[type],
      )}
      role="status"
    >
      <span>{message}</span>
      {onClose && (
        <button type="button" onClick={onClose} aria-label="Cerrar">
          ✕
        </button>
      )}
    </div>
  );
}
