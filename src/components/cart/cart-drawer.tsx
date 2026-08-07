"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useCartStore } from "@/stores/cart-store";
import { formatPrecio, calcularSubtotal, calcularPrecioUnitario } from "@/lib/pricing";
import { createClient } from "@/lib/supabase/client";

import { CartReservationTimer } from "@/components/cart/cart-reservation-timer";

interface CrossSellProduct {
  id: string;
  slug: string;
  nombre: string;
  precio: number;
  imagen: string;
  esPersonalizable: boolean;
  stockDisponible: number;
}

export function CartDrawer() {
  const isOpen = useCartStore((s) => s.isOpen);
  const closeCart = useCartStore((s) => s.closeCart);
  const items = useCartStore((s) => s.items);
  const updateQty = useCartStore((s) => s.updateQty);
  const removeItem = useCartStore((s) => s.removeItem);
  const addItem = useCartStore((s) => s.addItem);
  const router = useRouter();

  const [crossSellItems, setCrossSellItems] = useState<CrossSellProduct[]>([]);

  const subtotal = calcularSubtotal(items);

  // Fetch real active products from the DB for "Compañeros ideales"
  useEffect(() => {
    if (!isOpen) return;
    const supabase = createClient();
    supabase
      .from("productos")
      .select("id, slug, nombre, precio_base, es_personalizable, stock_disponible, producto_imagenes(url_imagen, orden)")
      .eq("activo", true)
      .limit(8)
      .then(({ data }) => {
        if (data) {
          const cartIds = new Set(items.map((i) => i.productoId));
          const available = data.filter((p) => !cartIds.has(p.id));
          const mapped = available.slice(0, 2).map((p) => {
            const sortedImg = [...(p.producto_imagenes ?? [])].sort((a, b) => a.orden - b.orden);
            return {
              id: p.id,
              slug: p.slug,
              nombre: p.nombre,
              precio: p.precio_base,
              imagen: sortedImg[0]?.url_imagen ?? "https://placehold.co/300x300",
              esPersonalizable: p.es_personalizable,
              stockDisponible: p.stock_disponible,
            };
          });
          setCrossSellItems(mapped);
        }
      });
  }, [isOpen, items]);

  const handleCheckout = () => {
    closeCart();
    router.push("/carrito");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Warm Ceramic Studio Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeCart}
            className="fixed inset-0 bg-chocolate/40 backdrop-blur-md cursor-pointer"
            aria-hidden="true"
          />

          {/* Slide-out Panel (Warm Ceramic Palette in Light Mode, Noche Taller in Dark Mode) */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="relative z-10 flex h-full w-full max-w-md flex-col bg-surface text-chocolate shadow-piece border-l border-border"
          >
            {/* ─── Header ─── */}
            <div className="flex items-center justify-between border-b border-border bg-arena/60 p-5 backdrop-blur-sm">
              <div>
                <h2 className="text-lg font-medium font-serif text-chocolate">
                  Tu Carrito ({items.length})
                </h2>
                <p className="text-[11px] font-sans text-muted">
                  Piezas elegidas para iluminar tu hogar
                </p>
              </div>
              <button
                type="button"
                onClick={closeCart}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-surface border border-border text-chocolate transition-colors hover:bg-terracota hover:text-white"
                aria-label="Cerrar carrito"
              >
                ✕
              </button>
            </div>


            {/* ─── Cart Items List ─── */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-background/40">
              <CartReservationTimer />

              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                  <span className="text-4xl">🏺</span>
                  <p className="text-lg font-medium font-serif text-chocolate">Tu carrito está vacío</p>
                  <p className="text-xs text-muted max-w-xs leading-relaxed font-sans">
                    Explorá las piezas disponibles moldeadas e ilustradas a mano.
                  </p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {items.map((item) => {
                    const unitario = calcularPrecioUnitario(
                      item.precioBase,
                      item.esPersonalizable,
                      item.personalizado
                    );

                    return (
                      <li
                        key={item.productoId}
                        className="flex gap-3.5 rounded-2xl bg-surface p-3 border border-border shadow-sm transition-all hover:border-terracota/40"
                      >
                        {/* Thumbnail Container */}
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-arena/50 p-1 border border-border/40">
                          <Image
                            src={item.imagenUrl || "https://placehold.co/800x800"}
                            alt={item.nombre}
                            fill
                            className="object-contain p-0.5"
                            sizes="80px"
                          />
                        </div>

                        <div className="flex flex-1 flex-col justify-between py-0.5">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="text-sm font-medium font-serif text-chocolate leading-snug">
                                {item.nombre}
                              </h3>
                              <button
                                type="button"
                                onClick={() => removeItem(item.productoId)}
                                className="text-muted hover:text-terracota transition-colors p-1"
                                aria-label={`Quitar ${item.nombre}`}
                              >
                                ✕
                              </button>
                            </div>

                            <p className="text-[11px] text-muted font-sans pt-0.5">
                              Esculpido & ilustrado a mano
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-2">
                            <span className="text-sm font-semibold font-sans text-terracota">
                              {formatPrecio(unitario * item.cantidad)}
                            </span>

                            {/* Touch Quantity Controls */}
                            <div className="flex items-center rounded-lg border border-border bg-arena/40">
                              <button
                                type="button"
                                onClick={() => updateQty(item.productoId, item.cantidad - 1)}
                                className="flex h-7 w-7 items-center justify-center text-xs font-semibold text-chocolate hover:bg-surface transition-colors"
                              >
                                −
                              </button>
                              <span className="w-6 text-center text-xs font-semibold text-chocolate">
                                {item.cantidad}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQty(item.productoId, item.cantidad + 1)}
                                className="flex h-7 w-7 items-center justify-center text-xs font-semibold text-chocolate hover:bg-surface transition-colors"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              {/* ─── Cross-Selling: "Compañeros ideales" ─── */}
              {items.length > 0 && crossSellItems.length > 0 && (
                <div className="pt-5 border-t border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-terracota font-sans">
                      Compañeros ideales
                    </span>
                    <span className="text-[11px] font-handwritten text-muted">De la misma colección</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {crossSellItems.map((prod) => (
                      <div
                        key={prod.id}
                        className="flex flex-col gap-1.5 rounded-xl bg-surface p-2.5 border border-border shadow-sm"
                      >
                        <div className="relative h-20 w-full overflow-hidden rounded-lg bg-arena/50 p-1">
                          <img src={prod.imagen} alt={prod.nombre} className="h-full w-full object-contain" />
                        </div>
                        <p className="text-xs font-medium font-serif text-chocolate truncate">{prod.nombre}</p>
                        <p className="text-[11px] font-semibold text-terracota">{formatPrecio(prod.precio)}</p>
                        <button
                          type="button"
                          onClick={() => {
                            addItem({
                              productoId: prod.id,
                              slug: prod.slug,
                              nombre: prod.nombre,
                              imagenUrl: prod.imagen,
                              precioBase: prod.precio,
                              esPersonalizable: prod.esPersonalizable,
                              personalizado: false,
                              stockDisponible: prod.stockDisponible,
                            });
                          }}
                          className="mt-1 w-full rounded-full bg-arena py-1 text-[11px] font-semibold text-chocolate hover:bg-terracota hover:text-white transition-colors border border-border/40"
                        >
                          + Agregar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ─── Footer CTA Panel ─── */}
            {items.length > 0 && (
              <div className="border-t border-border bg-arena/60 p-5 space-y-3 backdrop-blur-sm">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted font-sans">Subtotal de piezas</span>
                  <span className="text-lg font-semibold font-serif text-chocolate">
                    {formatPrecio(subtotal)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCheckout}
                  className="w-full rounded-full bg-terracota py-3.5 text-center text-sm font-semibold text-white shadow-sm transition-all hover:bg-terracota/90 hover:-translate-y-0.5 active:scale-[0.98]"
                >
                  Proceder con la compra →
                </button>

                <p className="text-center text-[11px] text-muted font-sans">
                  🔒 Embalaje especial antigolpes incluido en tu pedido
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
