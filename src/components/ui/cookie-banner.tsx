"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "./button";

export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem("milideas_cookie_consent");
      if (!consent) {
        // Breve delay para animación de entrada suave
        const timer = setTimeout(() => setIsVisible(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      // Si localStorage está bloqueado en modo privado estricto, no mostrar
    }
  }, []);

  const handleAcceptAll = () => {
    try {
      localStorage.setItem("milideas_cookie_consent", "all");
      window.dispatchEvent(new CustomEvent("cookie-consent-updated", { detail: "all" }));
    } catch {}
    setIsVisible(false);
  };

  const handleOnlyEssential = () => {
    try {
      localStorage.setItem("milideas_cookie_consent", "essential");
      window.dispatchEvent(new CustomEvent("cookie-consent-updated", { detail: "essential" }));
    } catch {}
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      role="region"
      aria-label="Aviso de privacidad y cookies"
      className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 z-50 max-w-md animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="rounded-2xl sm:rounded-3xl border border-border/80 bg-surface/95 backdrop-blur-md p-4 sm:p-5 shadow-lg shadow-chocolate/10 space-y-3 font-sans text-xs sm:text-sm text-barro">
        <div className="flex items-start gap-2.5">
          <span className="text-xl shrink-0 select-none">🍪</span>
          <div className="space-y-1">
            <h4 className="font-serif font-medium text-chocolate text-sm sm:text-base">
              Privacidad y Cookies en Milideas
            </h4>
            <p className="text-[11px] sm:text-xs leading-relaxed text-barro">
              Utilizamos cookies esenciales para el funcionamiento del carrito de compras y la seguridad de tu sesión. También podemos usar analítica anónima para mejorar la experiencia de nuestra tienda artesanal. Podés leer más en nuestra{" "}
              <Link href="/privacidad" className="text-terracota font-semibold underline hover:text-chocolate">
                Política de Privacidad
              </Link>
              .
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1 border-t border-border/50">
          <Button
            type="button"
            variant="outline"
            onClick={handleOnlyEssential}
            className="rounded-full border-border/70 text-barro hover:text-chocolate hover:bg-arena/40 text-xs px-3.5 py-1.5 min-h-0 h-auto font-sans"
          >
            Solo esenciales
          </Button>
          <Button
            type="button"
            onClick={handleAcceptAll}
            className="rounded-full bg-chocolate text-crema-cruda hover:bg-chocolate/90 text-xs px-4 py-1.5 min-h-0 h-auto font-sans font-semibold shadow-2xs"
          >
            Aceptar todas
          </Button>
        </div>
      </div>
    </div>
  );
}
