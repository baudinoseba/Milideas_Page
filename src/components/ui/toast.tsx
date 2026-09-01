"use client";

import { useToastStore, type ToastItem } from "@/stores/toast-store";
import { cn } from "@/lib/utils/cn";

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  if (toasts.length === 0) return null;

  return (
    <aside
      aria-label="Notificaciones"
      className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onClose={() => removeToast(t.id)} />
      ))}
    </aside>
  );
}

function ToastCard({ toast, onClose }: { toast: ToastItem; onClose: () => void }) {
  const isSuccess = toast.type === "success";
  const isError = toast.type === "error";

  return (
    <div
      role="status"
      className={cn(
        "pointer-events-auto flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-xs font-semibold shadow-xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-top-3 duration-200",
        isSuccess && "border-emerald-300/80 bg-emerald-50/95 text-emerald-950 shadow-emerald-900/10",
        isError && "border-rose-300/80 bg-rose-50/95 text-rose-950 shadow-rose-900/10",
        !isSuccess && !isError && "border-chocolate/30 bg-[#FAF7F2]/95 text-chocolate shadow-black/10",
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-2xs",
            isSuccess && "bg-emerald-600 text-white",
            isError && "bg-rose-600 text-white",
            !isSuccess && !isError && "bg-chocolate text-crema-cruda",
          )}
        >
          {isSuccess ? "✓" : isError ? "⚠️" : "ℹ️"}
        </span>
        <p className="leading-snug break-words">{toast.message}</p>
      </div>

      <button
        type="button"
        onClick={onClose}
        className={cn(
          "shrink-0 rounded-lg p-1 text-xs font-bold transition-colors cursor-pointer opacity-70 hover:opacity-100",
          isSuccess && "hover:bg-emerald-200/50 text-emerald-800",
          isError && "hover:bg-rose-200/50 text-rose-800",
          !isSuccess && !isError && "hover:bg-stone-200/50 text-stone-700",
        )}
        title="Cerrar notificación"
      >
        ✕
      </button>
    </div>
  );
}
