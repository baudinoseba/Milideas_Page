"use client";

import { useState } from "react";
import { toast } from "@/stores/toast-store";

interface ShareButtonProps {
  title: string;
  text?: string;
  url?: string;
  className?: string;
  variant?: "pill" | "icon";
}

export function ShareButton({
  title,
  text = "Mirá esta pieza única de Milideas Arte",
  url,
  className = "",
  variant = "pill",
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url: shareUrl,
        });
        return;
      } catch (err: any) {
        // Si el usuario canceló el share nativo, no hacemos nada
        if (err.name === "AbortError") return;
      }
    }

    // Fallback: copiar enlace al portapapeles
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("¡Enlace copiado! Ya podés pegarlo y compartirlo.");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("No se pudo copiar. Copiá la URL desde la barra de tu navegador.");
    }
  };

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleShare}
        title="Compartir esta pieza"
        className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/80 bg-surface text-chocolate hover:bg-arena hover:border-terracota/40 transition-all shadow-2xs active:scale-95 cursor-pointer ${className}`}
      >
        {copied ? (
          <span className="text-xs text-verde-menta font-bold">✓</span>
        ) : (
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className={`inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-surface/90 px-3 py-1.5 text-xs font-medium text-chocolate hover:bg-arena hover:border-terracota/30 transition-all shadow-2xs active:scale-95 cursor-pointer font-sans ${className}`}
    >
      {copied ? (
        <>
          <span className="text-verde-menta font-bold">✓</span>
          <span>¡Enlace copiado!</span>
        </>
      ) : (
        <>
          <svg
            className="w-3.5 h-3.5 text-terracota"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
          <span>Compartir</span>
        </>
      )}
    </button>
  );
}
