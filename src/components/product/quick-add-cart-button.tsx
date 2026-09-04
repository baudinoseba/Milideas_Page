"use client";

import { useState, useCallback } from "react";
import { useCartStore } from "@/stores/cart-store";
import { useStockStore } from "@/stores/stock-store";
import { getStockStatus } from "@/lib/stock";
import type { ProductoConImagenes } from "@/types";

export function QuickAddToCartButton({ producto }: { producto: ProductoConImagenes }) {
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  const liveStock = useStockStore((s) => s.stocks[producto.id]);
  const stock = typeof liveStock === "number" ? liveStock : producto.stock_disponible;
  const stockStatus = getStockStatus(stock);
  const imagen = producto.producto_imagenes?.sort((a, b) => a.orden - b.orden)[0]?.url_imagen ?? null;

  const handleAddToCartOnly = useCallback(
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
        stockDisponible: stock,
        cantidad: 1,
      }, false);

      setAdded(true);
      setTimeout(() => setAdded(false), 1800);
    },
    [addItem, producto, imagen, stock],
  );

  const handleBuyNow = useCallback(
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
        stockDisponible: stock,
        cantidad: 1,
      }, false);

      window.location.href = "/carrito";
    },
    [addItem, producto, imagen, stock],
  );

  const handleEncargo = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      window.location.href = `/producto/${producto.slug}#encargar`;
    },
    [producto.slug],
  );

  if (stockStatus === "bajo_pedido" || stock <= 0) {
    return (
      <button
        type="button"
        onClick={handleEncargo}
        className="w-full py-2 px-3 text-xs font-semibold rounded-xl bg-chocolate text-crema-cruda hover:bg-chocolate/90 border border-chocolate/30 flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
      >
        <span>✨</span>
        <span>Encargar esta pieza</span>
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {/* Botón Comprar Ahora -> Redirige directamente al flujo de compra / checkout */}
      <button
        type="button"
        onClick={handleBuyNow}
        className="w-full py-2 px-2.5 text-[11px] sm:text-xs font-semibold rounded-xl bg-terracota text-white hover:bg-terracota/90 transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer active:scale-95"
      >
        <span>🛍️</span>
        <span>Comprar ahora</span>
      </button>

      {/* Botón Agregar al Carrito -> Agrega al carrito con notificación corta sin redirigir */}
      <button
        type="button"
        onClick={handleAddToCartOnly}
        disabled={added}
        className={`w-full py-1.5 px-2.5 text-[11px] sm:text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1 border cursor-pointer active:scale-95 ${
          added
            ? "bg-verde-menta text-chocolate border-verde-menta font-bold"
            : "bg-terracota/10 text-terracota hover:bg-terracota/20 border-terracota/30"
        }`}
      >
        {added ? (
          <>
            <span>✓</span>
            <span>¡Agregado!</span>
          </>
        ) : (
          <>
            <span>🛒</span>
            <span>+ Agregar al carrito</span>
          </>
        )}
      </button>
    </div>
  );
}
