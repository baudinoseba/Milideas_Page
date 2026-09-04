"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useStockStore } from "@/stores/stock-store";
import { useCartStore } from "@/stores/cart-store";

export function RealtimeStockSync() {
  const stockAlert = useStockStore((s) => s.stockAlert);
  const clearStockAlert = useStockStore((s) => s.clearStockAlert);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("milideas-stock-realtime")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "productos",
        },
        (payload) => {
          const newRow = payload.new as {
            id?: string;
            stock_disponible?: number;
            nombre?: string;
          };

          if (newRow?.id && typeof newRow.stock_disponible === "number") {
            // Actualizar el mapa reactivo de stock en memoria
            useStockStore.getState().setStock(newRow.id, newRow.stock_disponible);

            // Sincronizar con el carrito de compra
            const cartItems = useCartStore.getState().items;
            const itemEnCarrito = cartItems.find((i) => i.productoId === newRow.id);

            useCartStore.getState().syncProductStock(newRow.id, newRow.stock_disponible);

            // Si el usuario tenía este producto en el carrito y disminuyó por debajo de su cantidad:
            if (itemEnCarrito && newRow.stock_disponible < itemEnCarrito.cantidad) {
              useStockStore.getState().setStockAlert({
                productoId: newRow.id,
                nombre: newRow.nombre || itemEnCarrito.nombre,
                nuevoStock: newRow.stock_disponible,
              });
            }
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Auto-dismiss alert after 6 seconds
  useEffect(() => {
    if (stockAlert) {
      const timer = setTimeout(() => {
        clearStockAlert();
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [stockAlert, clearStockAlert]);

  return (
    <AnimatePresence>
      {stockAlert && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="fixed top-20 right-4 z-50 max-w-md w-[calc(100%-2rem)] sm:w-auto pointer-events-auto"
        >
          <div className="rounded-2xl border border-amber-500/40 bg-surface/95 p-4 shadow-xl backdrop-blur-md text-chocolate space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                <span className="text-base">⚡</span>
                <span>Stock Actualizado en Tiempo Real</span>
              </div>
              <button
                type="button"
                onClick={clearStockAlert}
                className="text-xs text-muted hover:text-chocolate cursor-pointer p-1"
                aria-label="Cerrar aviso"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-chocolate leading-relaxed">
              Otro comprador acaba de reservar o comprar{" "}
              <strong>&ldquo;{stockAlert.nombre}&rdquo;</strong>.
              {stockAlert.nuevoStock <= 0 ? (
                <span className="block pt-1 text-red-600 font-semibold">
                  ⚠️ La pieza ya no tiene stock disponible para compra inmediata. Podés solicitarla por encargo personalizado.
                </span>
              ) : (
                <span className="block pt-1 text-amber-800 font-medium">
                  📦 Stock restante disponible: {stockAlert.nuevoStock}{" "}
                  {stockAlert.nuevoStock === 1 ? "unidad" : "unidades"}.
                </span>
              )}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
