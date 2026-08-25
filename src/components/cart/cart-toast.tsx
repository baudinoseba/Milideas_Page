"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/stores/cart-store";

export function CartToast() {
  const lastAdded = useCartStore((s) => s.lastAddedItem);
  const clearLastAdded = useCartStore((s) => s.clearLastAddedItem);
  const [visible, setVisible] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<typeof lastAdded>(null);

  useEffect(() => {
    if (lastAdded) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentNotification(lastAdded);
      setVisible(true);

      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => clearLastAdded(), 300);
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [lastAdded, clearLastAdded]);

  if (!currentNotification) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed bottom-5 right-4 z-50 w-full max-w-sm px-2 sm:px-0 pointer-events-auto"
        >
          <div className="flex items-center gap-3.5 rounded-2xl border border-terracota/30 bg-surface/95 p-3.5 shadow-piece backdrop-blur-md text-chocolate">
            {/* Thumbnail */}
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-arena/50 border border-border/40">
              {currentNotification.imagenUrl ? (
                <Image
                  src={currentNotification.imagenUrl}
                  alt={currentNotification.nombre}
                  fill
                  className="object-contain p-0.5"
                  sizes="48px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg">
                  🏺
                </div>
              )}
            </div>

            {/* Text & Notification Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-terracota font-sans uppercase tracking-wider">
                <span>✨</span>
                <span>¡Agregado al carrito!</span>
              </div>
              <p className="text-xs font-serif font-medium text-chocolate truncate leading-snug pt-0.5">
                {currentNotification.nombre}
              </p>
            </div>

            {/* Action Link to /carrito */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Link
                href="/carrito"
                onClick={() => setVisible(false)}
                className="rounded-full bg-terracota px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-terracota/90 transition-colors font-sans shadow-xs"
              >
                Ver Carrito →
              </Link>
              <button
                type="button"
                onClick={() => setVisible(false)}
                className="p-1 text-muted hover:text-chocolate transition-colors text-xs"
                aria-label="Cerrar notificación"
              >
                ✕
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
