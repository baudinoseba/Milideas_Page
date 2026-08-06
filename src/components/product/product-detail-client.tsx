"use client";

import { useState } from "react";
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

export function ProductDetailClient({ producto }: ProductDetailProps) {
  const [personalizado, setPersonalizado] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  const precio = calcularPrecioUnitario(
    producto.precioBase,
    producto.esPersonalizable,
    personalizado,
  );

  const handleAdd = () => {
    addItem({
      productoId: producto.id,
      slug: producto.slug,
      nombre: producto.nombre,
      imagenUrl: producto.imagenUrl,
      precioBase: producto.precioBase,
      esPersonalizable: producto.esPersonalizable,
      personalizado,
      stockDisponible: producto.stockDisponible,
    });
  };

  return (
    <div className="space-y-4 border-t border-border pt-6">
      {producto.esPersonalizable && (
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={personalizado}
            onChange={(e) => setPersonalizado(e.target.checked)}
            className="h-4 w-4"
          />
          Personalizar esta pieza (+15%)
        </label>
      )}
      <p className="text-lg font-medium">{formatPrecio(precio)}</p>
      <Button onClick={handleAdd} className="w-full sm:w-auto">
        Agregar al carrito
      </Button>
    </div>
  );
}
