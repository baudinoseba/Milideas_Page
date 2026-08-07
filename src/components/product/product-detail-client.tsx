"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatPrecio, calcularPrecioUnitario } from "@/lib/pricing";
import { useCartStore } from "@/stores/cart-store";

type ProductDetailProps = {
  producto: {
    id: string;
    slug: string;
    nombre: string;
    precioBase: number;
    esPersonalizable: boolean;
    stockDisponible: number;
    imagenUrl: string | null;
  };
};

function IconTruck() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" rx="2" />
      <path d="M16 8h4l3 3v5h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function IconHeart() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

const TRUST_ITEMS = [
  { icon: IconTruck, text: "Envíos protegidos a todo el país" },
  { icon: IconShield, text: "Embalaje especial antigolpes garantizado" },
  { icon: IconHeart, text: "Pieza única ilustrada por Mili Ferrero" },
] as const;

export function ProductDetailClient({ producto }: ProductDetailProps) {
  const [personalizado, setPersonalizado] = useState(false);
  const [cantidad, setCantidad] = useState(1);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const router = useRouter();

  const precio = calcularPrecioUnitario(
    producto.precioBase,
    producto.esPersonalizable,
    personalizado,
  );

  const handleAdd = useCallback(() => {
    addItem({
      productoId: producto.id,
      slug: producto.slug,
      nombre: producto.nombre,
      imagenUrl: producto.imagenUrl,
      precioBase: producto.precioBase,
      esPersonalizable: producto.esPersonalizable,
      personalizado,
      stockDisponible: producto.stockDisponible,
      cantidad,
    });
    setAdded(true);
  }, [addItem, producto, personalizado, cantidad]);

  useEffect(() => {
    if (added) {
      const timer = setTimeout(() => setAdded(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [added]);

  return (
    <div className="space-y-6 border-t border-border/60 pt-6">
      {producto.esPersonalizable && (
        <label className="flex cursor-pointer items-center gap-3.5 rounded-2xl border border-border/80 bg-arena/30 p-4 text-sm transition-all hover:border-terracota/40">
          <div className="relative">
            <input
              type="checkbox"
              checked={personalizado}
              onChange={(e) => setPersonalizado(e.target.checked)}
              className="peer sr-only"
            />
            <div className="h-5 w-9 rounded-full bg-barro-claro transition-colors peer-checked:bg-terracota" />
            <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" />
          </div>
          <span className="font-medium text-chocolate">
            Personalizar esta pieza <span className="text-barro font-normal">(+15%)</span>
          </span>
        </label>
      )}

      {/* Price & Stock Badge */}
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <div>
          <span className="text-xs uppercase tracking-wider text-barro font-semibold block">PRECIO DE LA PIEZA</span>
          <p className="text-3xl font-semibold text-chocolate font-serif">{formatPrecio(precio)}</p>
        </div>

        <div className="shrink-0">
          {producto.stockDisponible === 1 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-800 dark:text-amber-300 border border-amber-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              ¡Última unidad disponible!
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              📦 {producto.stockDisponible} unidades disponibles
            </span>
          )}
        </div>
      </div>

      {/* Quantity Stepper Selector (when stock > 1) */}
      {producto.stockDisponible > 1 && (
        <div className="space-y-2.5 bg-arena/20 p-4 rounded-2xl border border-border/50">
          <div className="flex items-center justify-between text-xs font-sans">
            <span className="font-semibold uppercase tracking-wider text-barro">
              CANTIDAD A COMPRAR
            </span>
            <span className="text-chocolate font-medium">
              Máximo: {producto.stockDisponible} unidades
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center rounded-xl border border-border bg-surface p-1 shadow-xs">
              <button
                type="button"
                onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                disabled={cantidad <= 1}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-lg font-bold text-chocolate hover:bg-arena/60 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                aria-label="Disminuir cantidad"
              >
                −
              </button>
              <span className="w-10 text-center text-base font-bold font-sans text-chocolate">
                {cantidad}
              </span>
              <button
                type="button"
                onClick={() => setCantidad((c) => Math.min(producto.stockDisponible, c + 1))}
                disabled={cantidad >= producto.stockDisponible}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-lg font-bold text-chocolate hover:bg-arena/60 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                aria-label="Aumentar cantidad"
              >
                +
              </button>
            </div>

            {cantidad > 1 && (
              <span className="text-xs text-barro font-sans">
                Subtotal piezas: <strong className="text-chocolate font-serif text-sm">{formatPrecio(precio * cantidad)}</strong>
              </span>
            )}
          </div>
        </div>
      )}

      <Button
        onClick={handleAdd}
        className={`w-full py-4 text-base font-semibold rounded-full shadow-md transition-all ${
          added
            ? "bg-verde-menta text-chocolate hover:bg-verde-menta"
            : "bg-terracota text-white hover:bg-terracota/90 hover:-translate-y-0.5"
        }`}
        disabled={added}
      >
        {added ? (
          <span className="flex items-center justify-center gap-2">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3.5 8.5 6.5 11.5 12.5 5.5" />
            </svg>
            ¡{cantidad > 1 ? `${cantidad} piezas agregadas` : "Pieza agregada"} a tu carrito!
          </span>
        ) : (
          `Comprar ${cantidad > 1 ? `${cantidad} piezas` : "esta pieza"} →`
        )}
      </Button>

      {/* Trust indicators */}
      <div className="space-y-3 pt-4 border-t border-border/40">
        {TRUST_ITEMS.map((item) => (
          <div key={item.text} className="flex items-center gap-3 text-xs text-barro font-sans font-medium">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rosa-buho/20 text-terracota" aria-hidden>
              <item.icon />
            </span>
            <span>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

