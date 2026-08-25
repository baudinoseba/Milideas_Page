"use client";

import { formatPrecio, calcularPrecioUnitario } from "@/lib/pricing";
import { useCartStore } from "@/stores/cart-store";
import type { LineaCarrito } from "@/types";
import Link from "next/link";
import Image from "next/image";

export function CartLineItem({
  item,
  compact = false,
}: {
  item: LineaCarrito;
  compact?: boolean;
}) {
  const updateQty = useCartStore((s) => s.updateQty);
  const removeItem = useCartStore((s) => s.removeItem);
  const togglePersonalizacion = useCartStore((s) => s.togglePersonalizacion);

  const unitario = calcularPrecioUnitario(
    item.precioBase,
    item.esPersonalizable,
    item.personalizado,
  );

  return (
    <li className="flex gap-3.5 border-b border-border pb-4 transition-all">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-border/20">
        <Image
          src={item.imagenUrl || "https://placehold.co/800x800"}
          alt={item.nombre}
          fill
          className="object-cover"
          sizes="80px"
        />
      </div>
      <div className="flex flex-1 flex-col justify-between py-0.5">
        <div>
          <div className="flex items-start justify-between gap-2">
            <Link href={`/producto/${item.slug}`} className="text-sm font-medium hover:underline">
              {item.nombre}
            </Link>
            <button
              type="button"
              onClick={() => removeItem(item.productoId)}
              className="text-xs text-muted hover:text-red-600 transition-colors p-1 -mr-1"
              aria-label={`Quitar ${item.nombre}`}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          </div>
          <p className="text-sm font-medium text-muted mt-0.5">{formatPrecio(unitario)}</p>
          {item.esPersonalizable && !compact && (
            <label className="mt-1 flex cursor-pointer items-center gap-2 text-xs text-muted hover:text-foreground">
              <input
                type="checkbox"
                checked={item.personalizado}
                onChange={() => togglePersonalizacion(item.productoId)}
                className="h-3.5 w-3.5 rounded border-border text-foreground focus:ring-0"
              />
              <span>Personalizar (+15%)</span>
            </label>
          )}
        </div>

        {/* Quantity Controls with improved touch targets & stock limit enforcement */}
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex items-center rounded-lg border border-border bg-background">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center text-sm font-medium transition-colors hover:bg-border/40 active:scale-95 disabled:opacity-30"
              onClick={() => updateQty(item.productoId, item.cantidad - 1)}
              aria-label="Disminuir cantidad"
            >
              −
            </button>
            <span className="w-8 text-center text-xs font-semibold">{item.cantidad}</span>
            <button
              type="button"
              disabled={typeof item.stockDisponible === "number" && item.cantidad >= item.stockDisponible}
              className="flex h-8 w-8 items-center justify-center text-sm font-medium transition-colors hover:bg-border/40 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
              onClick={() => updateQty(item.productoId, item.cantidad + 1)}
              aria-label="Aumentar cantidad"
              title={typeof item.stockDisponible === "number" && item.cantidad >= item.stockDisponible ? `Stock máximo disponible (${item.stockDisponible})` : undefined}
            >
              +
            </button>
          </div>
          {typeof item.stockDisponible === "number" && item.cantidad >= item.stockDisponible && (
            <span className="text-[10px] font-semibold text-terracota bg-terracota/10 px-2 py-0.5 rounded-full border border-terracota/20">
              Máx. disponible ({item.stockDisponible})
            </span>
          )}
        </div>
      </div>
    </li>
  );
}
