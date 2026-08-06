"use client";

import { Button } from "@/components/ui/button";
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
    <li className="flex gap-3 border-b border-border pb-4">
      {item.imagenUrl && (
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-sm bg-border/30">
          <Image src={item.imagenUrl} alt={item.nombre} fill className="object-cover" sizes="64px" />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex justify-between gap-2">
          <Link href={`/producto/${item.slug}`} className="text-sm font-medium">
            {item.nombre}
          </Link>
          <button
            type="button"
            onClick={() => removeItem(item.productoId)}
            className="text-xs text-muted hover:text-foreground"
          >
            Quitar
          </button>
        </div>
        <p className="text-sm text-muted">{formatPrecio(unitario)}</p>
        {item.esPersonalizable && !compact && (
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={item.personalizado}
              onChange={() => togglePersonalizacion(item.productoId)}
            />
            Personalizar (+15%)
          </label>
        )}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="min-h-8 px-2"
            onClick={() => updateQty(item.productoId, item.cantidad - 1)}
          >
            −
          </Button>
          <span className="w-6 text-center text-sm">{item.cantidad}</span>
          <Button
            variant="outline"
            className="min-h-8 px-2"
            onClick={() => updateQty(item.productoId, item.cantidad + 1)}
          >
            +
          </Button>
        </div>
      </div>
    </li>
  );
}
