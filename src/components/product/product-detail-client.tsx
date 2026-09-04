"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { formatPrecio, calcularPrecioUnitario } from "@/lib/pricing";
import { useCartStore } from "@/stores/cart-store";
import { useStockStore } from "@/stores/stock-store";
import { EncargoModal } from "@/components/product/encargo-modal";
import type { ProductoConImagenes, ConfiguracionEncargos } from "@/types";

type ProductDetailProps = {
  producto: ProductoConImagenes;
  configEncargos?: ConfiguracionEncargos;
};

export function ProductDetailClient({ producto, configEncargos }: ProductDetailProps) {
  const [personalizado, setPersonalizado] = useState(false);
  const [cantidad, setCantidad] = useState(1);
  const [added, setAdded] = useState(false);
  const [isEncargoOpen, setIsEncargoOpen] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  const liveStock = useStockStore((s) => s.stocks[producto.id]);
  const stockDisponible = typeof liveStock === "number" ? liveStock : producto.stock_disponible;

  useEffect(() => {
    if (stockDisponible > 0 && cantidad > stockDisponible) {
      setCantidad(stockDisponible);
    }
  }, [stockDisponible, cantidad]);

  const precioBase = producto.precio_base;
  const esPersonalizable = producto.es_personalizable;

  const primerImagen = producto.producto_imagenes?.[0]?.url_imagen ?? null;

  const precio = calcularPrecioUnitario(
    precioBase,
    esPersonalizable,
    personalizado,
  );

  const handleBuyNow = useCallback(() => {
    addItem({
      productoId: producto.id,
      slug: producto.slug,
      nombre: producto.nombre,
      imagenUrl: primerImagen,
      precioBase: precioBase,
      esPersonalizable: esPersonalizable,
      personalizado,
      stockDisponible: stockDisponible,
      cantidad,
    }, false);
    window.location.href = "/carrito";
  }, [addItem, producto, primerImagen, precioBase, esPersonalizable, personalizado, stockDisponible, cantidad]);

  const handleAddToCart = useCallback(() => {
    addItem({
      productoId: producto.id,
      slug: producto.slug,
      nombre: producto.nombre,
      imagenUrl: primerImagen,
      precioBase: precioBase,
      esPersonalizable: esPersonalizable,
      personalizado,
      stockDisponible: stockDisponible,
      cantidad,
    }, false);
    setAdded(true);
  }, [addItem, producto, primerImagen, precioBase, esPersonalizable, personalizado, stockDisponible, cantidad]);

  useEffect(() => {
    if (added) {
      const timer = setTimeout(() => setAdded(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [added]);

  const defaultConfig: ConfiguracionEncargos = configEncargos ?? {
    id: "e2000000-0000-4000-8000-000000000001",
    medidas_ilustraciones: [
      { id: "a4", nombre: "A4 (21 x 30 cm)", recargo: 0 },
      { id: "a3", nombre: "A3 (30 x 42 cm)", recargo: 5000 },
      { id: "large", nombre: "Grand Format (50 x 70 cm)", recargo: 12000 },
    ],
    precio_marco_madera: 8500,
    porcentaje_recargo_personalizado: 0.15,
    demora_default_dias: 15,
  };

  return (
    <div className="space-y-6 border-t border-border/60 pt-6">
      {esPersonalizable && (
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
          {stockDisponible > 0 ? (
            stockDisponible === 1 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-800 dark:text-amber-300 border border-amber-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                ¡Última unidad disponible!
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                📦 {stockDisponible} unidades disponibles
              </span>
            )
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3.5 py-1 text-xs font-semibold text-amber-800 dark:text-amber-300 border border-amber-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              🎨 Pieza disponible bajo encargo
            </span>
          )}
        </div>
      </div>

      {/* Quantity Stepper Selector (when stock > 1) */}
      {stockDisponible > 1 && (
        <div className="space-y-2.5 bg-arena/20 p-4 rounded-2xl border border-border/50">
          <div className="flex items-center justify-between text-xs font-sans">
            <span className="font-semibold uppercase tracking-wider text-barro">
              CANTIDAD A COMPRAR
            </span>
            <span className="text-chocolate font-medium">
              Máximo: {stockDisponible} unidades
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
                onClick={() => setCantidad((c) => Math.min(stockDisponible, c + 1))}
                disabled={cantidad >= stockDisponible}
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

      {/* Action Buttons */}
      {stockDisponible > 0 ? (
        <div className="space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Comprar ahora -> Redirige directamente al flujo de pago seguro / checkout */}
            <Button
              type="button"
              onClick={handleBuyNow}
              className="w-full py-3 text-sm font-semibold rounded-full shadow-sm bg-terracota text-white hover:bg-terracota/90 hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              🛍️ Comprar ahora →
            </Button>

            {/* Agregar al carrito -> Notifica sin salir de la página */}
            <Button
              type="button"
              onClick={handleAddToCart}
              variant="outline"
              className={`w-full py-3 text-sm font-semibold rounded-full border transition-all cursor-pointer ${
                added
                  ? "bg-verde-menta text-chocolate border-verde-menta font-bold"
                  : "border-terracota/40 text-terracota bg-terracota/10 hover:bg-terracota/20"
              }`}
              disabled={added}
            >
              {added ? (
                <span className="flex items-center justify-center gap-1.5">
                  ✓ ¡Agregado al carrito!
                </span>
              ) : (
                "🛒 Agregar al carrito"
              )}
            </Button>
          </div>

          {/* Encargo Special Request Button */}
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsEncargoOpen(true)}
            className="w-full py-2.5 text-xs font-semibold rounded-full border border-admin-accent/30 bg-admin-accent/5 text-chocolate hover:bg-admin-accent/15 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>✨</span>
            <span>Solicitar esta pieza por Encargo / Medida Especial</span>
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          onClick={() => setIsEncargoOpen(true)}
          className="w-full py-3 text-sm font-semibold rounded-full bg-chocolate text-crema-cruda hover:bg-chocolate/90 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
        >
          <span>✨</span>
          <span>Encargar esta pieza a Mili Ferrero</span>
        </Button>
      )}

      {/* Modal de Encargo */}
      <EncargoModal
        producto={producto}
        config={defaultConfig}
        isOpen={isEncargoOpen}
        onClose={() => setIsEncargoOpen(false)}
      />
    </div>
  );
}
