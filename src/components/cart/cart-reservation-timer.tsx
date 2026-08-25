"use client";

import { useEffect, useState } from "react";
import { useCartStore } from "@/stores/cart-store";
import { Modal } from "@/components/ui/modal";

export function CartReservationTimer({ className = "" }: { className?: string }) {
  const items = useCartStore((s) => s.items);
  const expiresAt = useCartStore((s) => s.expiresAt);
  const checkExpiration = useCartStore((s) => s.checkExpiration);
  const hydrated = useCartStore((s) => s.hydrated);

  const [timeLeftMs, setTimeLeftMs] = useState<number | null>(null);
  const [showExpiredModal, setShowExpiredModal] = useState(false);

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
        const expired = checkExpiration();
        if (expired) {
          setShowExpiredModal(true);
        }
      } else {
        setTimeLeftMs(remaining);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [items.length, expiresAt, hydrated, checkExpiration]);

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
                className="w-full min-h-10 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-all shadow-sm"
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

  return (
    <>
      <div
        className={`rounded-2xl border-2 p-4 transition-all duration-300 shadow-xs ${
          isUrgent
            ? "border-red-400 bg-red-50 dark:bg-red-950/40 text-red-950 dark:text-red-100 animate-pulse"
            : "border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-100"
        } ${className}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
            <span className="text-base sm:text-lg animate-bounce">⏱️</span>
            <span className="text-amber-950 dark:text-amber-200">Reserva por tiempo limitado</span>
          </div>
          <div className="flex items-center gap-1 font-mono text-sm sm:text-base font-bold px-3 py-1 rounded-lg bg-amber-600 dark:bg-amber-500 text-white shadow-xs shrink-0">
            <span>{formattedTime}</span>
          </div>
        </div>
        <p className="mt-2 text-xs leading-relaxed font-sans font-medium text-amber-900 dark:text-amber-200">
          Nuestras piezas son exclusivas y de edición limitada. Tenés <strong className="font-bold text-amber-950 dark:text-white underline">{formattedTime} minutos</strong> para confirmar tu pedido antes de que el stock sea liberado para otros compradores.
        </p>
      </div>

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
              className="w-full min-h-10 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-all shadow-sm"
            >
              Entendido
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
