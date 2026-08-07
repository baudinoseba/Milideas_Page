"use client";

import { Modal } from "@/components/ui/modal";
import { ProductCard } from "@/components/product/product-card";
import type { ProductoConImagenes } from "@/types";

interface StorefrontPreviewModalProps {
  open: boolean;
  onClose: () => void;
  categoriaNombre: string;
  piezas: ProductoConImagenes[];
}

export function StorefrontPreviewModal({
  open,
  onClose,
  categoriaNombre,
  piezas,
}: StorefrontPreviewModalProps) {
  const featuredProduct = piezas[0];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`🛍️ Vista Previa Fiel — Colección ${categoriaNombre}`}
    >

      <div className="space-y-8 p-1">
        {/* Banner notification */}
        <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 text-xs text-muted flex items-center justify-between">
          <span>
            💡 Esta es la simulación exacta de cómo verán los clientes esta colección al ingresar a la tienda.
          </span>
          <span className="font-semibold text-accent uppercase tracking-wider text-[10px]">
            Modo Borrador
          </span>
        </div>

        {/* Hero simulation if there is a featured product */}
        {featuredProduct && (
          <div className="rounded-2xl border border-border bg-surface p-6">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
              Colección actual: {categoriaNombre}
            </span>
            <h2 className="mt-1 text-2xl font-semibold">{featuredProduct.nombre}</h2>
            <p className="mt-1 text-xs text-muted max-w-md line-clamp-2">
              {featuredProduct.descripcion || "Pieza artesanal de la colección."}
            </p>
          </div>
        )}

        {/* Product Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
              Piezas de la colección ({piezas.length})
            </h3>
          </div>

          {piezas.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted">
              No hay piezas cargadas en esta colección para previsualizar.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6">
              {piezas.map((pieza) => (
                <ProductCard key={pieza.id} producto={pieza} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
