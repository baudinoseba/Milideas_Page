"use client";

import { useState, useCallback } from "react";
import { useCartStore } from "@/stores/cart-store";
import type { ProductoConImagenes } from "@/types";

export function QuickAddToCartButton({ producto }: { producto: ProductoConImagenes }) {
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const toggleCart = useCartStore((s) => s.toggleCart);

  const stock = producto.stock_disponible;
  const imagen = producto.producto_imagenes.sort((a, b) => a.orden - b.orden)[0]?.url_imagen ?? null;

  const handleAdd = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      addItem({
        productoId: producto.id,
        slug: producto.slug,
        nombre: producto.nombre,
        imagenUrl: imagen,
        precioBase: producto.precio_base,
        esPersonalizable: producto.es_personalizable,
        personalizado: false,
        stockDisponible: producto.stock_disponible,
        cantidad: 1,
      });

      setAdded(true);
      setTimeout(() => setAdded(false), 1800);
      toggleCart();
    },
    [addItem, producto, imagen, toggleCart],
  );

  if (stock <= 0) {
    return (
      <span className="w-full text-center py-2 text-xs font-semibold rounded-xl bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 block">
        ✨ Encargar esta pieza
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={added}
      className={`w-full py-2 px-3 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs ${
        added
          ? "bg-verde-menta text-chocolate font-bold"
          : "bg-terracota/10 text-terracota hover:bg-terracota hover:text-white border border-terracota/30"
      }`}
    >
      {added ? (
        <>
          <span>✓</span>
          <span>¡Agregado al carrito!</span>
        </>
      ) : (
        <>
          <span>🛒</span>
          <span>Agregar al carrito</span>
        </>
      )}
    </button>
  );
}
