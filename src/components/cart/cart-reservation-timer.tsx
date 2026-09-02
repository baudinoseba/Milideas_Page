"use client";

import { useEffect, useState, useRef } from "react";
import { useCartStore } from "@/stores/cart-store";
import { Modal } from "@/components/ui/modal";

export function CartReservationTimer({ className = "" }: { className?: string }) {
  const items = useCartStore((s) => s.items);
  const expiresAt = useCartStore((s) => s.expiresAt);
  const extensionCount = useCartStore((s) => s.extensionCount);
  const checkExpiration = useCartStore((s) => s.checkExpiration);
  const extendReservation = useCartStore((s) => s.extendReservation);
  const hydrated = useCartStore((s) => s.hydrated);

  const [timeLeftMs, setTimeLeftMs] = useState<number | null>(null);
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const hasPromptedExtendRef = useRef<boolean>(false);

  useEffect(() => {
    if (!hydrated || items.length === 0 || !expiresAt) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTimeLeftMs(null);
      return;
    }

    const updateTimer = () => {
      const remaining = expiresAt - Date.now();
      if (remaining <= 0) {
        setTimeLeftMs(0);
        setShowExtendModal(false);
        const expired = checkExpiration();
        if (expired) {
          setShowExpiredModal(true);
        }
      } else {
        setTimeLeftMs(remaining);

        // Si quedan menos de 2 minutos (120 seg) y aún puede extender, mostramos el modal de aviso una vez
        if (remaining <= 120000 && extensionCount < 2 && !hasPromptedExtendRef.current) {
          hasPromptedExtendRef.current = true;
          setShowExtendModal(true);
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [items.length, expiresAt, hydrated, checkExpiration, extensionCount]);

  const handleExtend = () => {
    const success = extendReservation();
    if (success) {
      setShowExtendModal(false);
      hasPromptedExtendRef.current = false;
    }
  };

  if (!hydrated || items.length === 0 || timeLeftMs === null) {
    return (
      <>
        {showExpiredModal && (
          <Modal open={showExpiredModal} onClose={() => setShowExpiredModal(false)} title="Reserva temporaria finalizada">
            <div className="space-y-4 text-center p-2">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40 text-2xl text-amber-700 dark:text-amber-300">
                ⏱️
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-chocolate">
                  Reserva temporaria finalizada
                </h3>
                <p className="text-xs text-muted leading-relaxed max-w-sm mx-auto">
                  El tiempo de reserva de 15 minutos ha expirado. Como nuestras piezas son artesanales, exclusivas y de edición limitada, las piezas fueron liberadas para dar oportunidad a otros clientes.
                </p>
                <p className="text-xs font-semibold text-terracota pt-1">
                  Podés volver a agregarlas al carrito si aún continúan disponibles.
                </p>
              </div>
              <button
                onClick={() => setShowExpiredModal(false)}
                className="w-full min-h-10 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-all shadow-sm cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </Modal>
        )}
      </>
    );
  }

  const minutes = Math.floor(timeLeftMs / 60000);
  const seconds = Math.floor((timeLeftMs % 60000) / 1000);
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const isUrgent = minutes < 3;
  const canExtend = extensionCount < 2;
  const nextExtensionMinutes = extensionCount === 0 ? 10 : 5;

  return (
    <>
      <div
        className={`rounded-2xl border-2 p-4 transition-all duration-300 shadow-xs ${
          isUrgent
            ? "border-red-400 bg-red-50 text-stone-900"
            : "border-amber-400 bg-amber-50 text-stone-900"
        } ${className}`}
      >
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 font-black text-xs sm:text-sm">
            <span className="text-base sm:text-lg animate-bounce">⏱️</span>
            <span className="text-stone-950 font-bold">Reserva por tiempo limitado</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 font-mono text-sm sm:text-base font-black px-3 py-1 rounded-xl bg-amber-500 text-white shadow-xs shrink-0">
              <span>{formattedTime}</span>
            </div>

            {canExtend && (
              <button
                type="button"
                onClick={() => setShowExtendModal(true)}
                className="rounded-xl bg-white border border-stone-300 px-3 py-1 text-xs font-bold text-stone-900 hover:bg-stone-50 transition-all shadow-2xs cursor-pointer active:scale-95"
                title={`Sumar +${nextExtensionMinutes} min a la reserva`}
              >
                + Extender tiempo
              </button>
            )}
          </div>
        </div>

        <p className="mt-2 text-xs leading-relaxed font-sans font-medium text-stone-900">
          Nuestras piezas son exclusivas y de edición limitada. Tenés <strong className="font-black text-stone-950 underline decoration-amber-500 decoration-2">{formattedTime} minutos</strong> para confirmar tu pedido antes de que el stock sea liberado para otros compradores.
        </p>
      </div>

      {/* Modal de Aviso / Extensión de Tiempo */}
      {showExtendModal && (
        <Modal open={showExtendModal} onClose={() => setShowExtendModal(false)} title="¿Necesitás más tiempo?">
          <div className="space-y-4 text-center p-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40 text-2xl text-amber-700 dark:text-amber-300">
              ⏳
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-serif font-bold text-chocolate">
                ¿Necesitás más tiempo para completar tu compra?
              </h3>
              <p className="text-xs text-muted leading-relaxed max-w-sm mx-auto">
                Tu reserva de 15 minutos está por expirar. Como nuestras piezas son artesanales y de edición limitada, podés extender tu reserva por <strong>+{nextExtensionMinutes} minutos</strong> para terminar de completar tus datos de envío con total tranquilidad.
              </p>
              {extensionCount > 0 && (
                <p className="text-[11px] text-amber-800 dark:text-amber-300 font-semibold">
                  (Extensión final de reserva)
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={handleExtend}
                className="flex-1 rounded-full bg-terracota hover:bg-terracota/90 text-white py-2.5 text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95"
              >
                ✨ Extender Reserva (+{nextExtensionMinutes} min)
              </button>
              <button
                type="button"
                onClick={() => setShowExtendModal(false)}
                className="rounded-full border border-border bg-surface px-4 py-2.5 text-xs font-semibold text-muted hover:text-foreground cursor-pointer"
              >
                Continuar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal de Expiración */}
      {showExpiredModal && (
        <Modal open={showExpiredModal} onClose={() => setShowExpiredModal(false)} title="Reserva temporaria finalizada">
          <div className="space-y-4 text-center p-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40 text-2xl text-amber-700 dark:text-amber-300">
              ⏱️
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-chocolate">
                Reserva temporaria finalizada
              </h3>
              <p className="text-xs text-muted leading-relaxed max-w-sm mx-auto">
                El tiempo de reserva ha expirado. Como nuestras piezas son artesanales, exclusivas y de edición limitada, las piezas fueron liberadas para dar oportunidad a otros clientes.
              </p>
              <p className="text-xs font-semibold text-terracota pt-1">
                Podés volver a agregarlas al carrito si aún continúan disponibles.
              </p>
            </div>
            <button
              onClick={() => setShowExpiredModal(false)}
              className="w-full min-h-10 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-all shadow-sm cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
