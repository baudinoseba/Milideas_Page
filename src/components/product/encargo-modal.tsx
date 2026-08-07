"use client";

import { useState } from "react";
import type { ProductoConImagenes, ConfiguracionEncargos, TipoCatalogo } from "@/types";
import { formatPrecio } from "@/lib/pricing";
import { useEncargosCartStore } from "@/stores/encargos-cart-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface EncargoModalProps {
  producto: ProductoConImagenes;
  config: ConfiguracionEncargos;
  isOpen: boolean;
  onClose: () => void;
}

export function EncargoModal({
  producto,
  config,
  isOpen,
  onClose,
}: EncargoModalProps) {
  const addEncargoItem = useEncargosCartStore((s) => s.addEncargoItem);

  const tipoCatalogo: TipoCatalogo = ((producto as any).tipo_catalogo as TipoCatalogo) || "ceramica";
  const precioBase = producto.precio_base;

  // Customization state
  const [esPersonalizado, setEsPersonalizado] = useState(false);
  const [detallePersonalizacion, setDetallePersonalizacion] = useState("");

  // Ilustración specific state
  const medidas = config.medidas_ilustraciones ?? [
    { id: "a4", nombre: "A4 (21 x 30 cm)", recargo: 0 },
    { id: "a3", nombre: "A3 (30 x 42 cm)", recargo: 5000 },
  ];
  const [medidaSeleccionada, setMedidaSeleccionada] = useState(medidas[0]?.nombre ?? "A4");
  const [conMarco, setConMarco] = useState(false);
  const [cantidad, setCantidad] = useState(1);

  // Calculations
  const recargoPersonalizadoCalculado = esPersonalizado
    ? Math.round(precioBase * (config.porcentaje_recargo_personalizado ?? 0.15))
    : 0;

  const medidaObj = medidas.find((m) => m.nombre === medidaSeleccionada);
  const adicionalMedidaCalculado = tipoCatalogo === "ilustraciones" ? (medidaObj?.recargo ?? 0) : 0;
  const adicionalMarcoCalculado = (tipoCatalogo === "ilustraciones" && conMarco) ? (config.precio_marco_madera ?? 8500) : 0;

  const precioUnitarioFinal = precioBase + recargoPersonalizadoCalculado + adicionalMedidaCalculado + adicionalMarcoCalculado;
  const totalEstimado = precioUnitarioFinal * cantidad;

  if (!isOpen) return null;

  const handleAddToCart = (e: React.FormEvent) => {
    e.preventDefault();

    const imagenUrl = producto.producto_imagenes?.[0]?.url_imagen ?? null;

    addEncargoItem({
      productoId: producto.id,
      slug: producto.slug,
      nombre: producto.nombre,
      imagenUrl,
      tipoCatalogo,
      precioBase,
      esPersonalizado,
      detallePersonalizacion: esPersonalizado ? detallePersonalizacion : "",
      medidaSeleccionada: tipoCatalogo === "ilustraciones" ? medidaSeleccionada : null,
      adicionalMedida: adicionalMedidaCalculado,
      conMarco: tipoCatalogo === "ilustraciones" && conMarco,
      adicionalMarco: adicionalMarcoCalculado,
      recargoPersonalizado: recargoPersonalizadoCalculado,
      precioUnitarioFinal,
      cantidad,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-border/80 bg-surface/90 px-6 py-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-admin-accent">
              Configurar Pieza por Encargo
            </span>
            <h3 className="text-lg font-semibold text-foreground truncate">
              {producto.nombre}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-muted hover:bg-arena hover:text-foreground transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleAddToCart} className="max-h-[80vh] overflow-y-auto p-6 space-y-5">
          {/* Catalog specific configuration */}
          {tipoCatalogo === "ilustraciones" && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 space-y-3">
              <Label className="text-xs font-semibold text-chocolate">
                🎨 Configuración de Ilustración
              </Label>
              <div>
                <Label htmlFor="medida" className="text-xs text-muted">Tamaño de Lámina</Label>
                <select
                  id="medida"
                  value={medidaSeleccionada}
                  onChange={(e) => setMedidaSeleccionada(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-admin-accent focus:outline-none"
                >
                  {medidas.map((m) => (
                    <option key={m.id} value={m.nombre}>
                      {m.nombre} {m.recargo > 0 ? `(+${formatPrecio(m.recargo)})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="conMarco"
                  checked={conMarco}
                  onChange={(e) => setConMarco(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-admin-accent cursor-pointer"
                />
                <Label htmlFor="conMarco" className="text-xs cursor-pointer">
                  Incluir enmarcado en madera artesanal (+{formatPrecio(config.precio_marco_madera ?? 8500)})
                </Label>
              </div>
            </div>
          )}

          {/* Personalization option (+15%) */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="esPersonalizado"
                checked={esPersonalizado}
                onChange={(e) => setEsPersonalizado(e.target.checked)}
                className="h-4 w-4 rounded border-border text-admin-accent cursor-pointer"
              />
              <Label htmlFor="esPersonalizado" className="text-sm font-semibold cursor-pointer text-chocolate">
                ✨ ¿Deseás personalizar esta pieza? (+15%)
              </Label>
            </div>
            {esPersonalizado && (
              <div>
                <Label htmlFor="detallePersonalizacion" className="text-xs text-muted">
                  Detalle del grabado, nombre, fecha o motivo especial
                </Label>
                <Textarea
                  id="detallePersonalizacion"
                  placeholder="ej. Inscribir iniciales M&S y fecha 15/09"
                  value={detallePersonalizacion}
                  onChange={(e) => setDetallePersonalizacion(e.target.value)}
                  rows={2}
                  className="mt-1"
                />
              </div>
            )}
          </div>

          {/* Quantity Stepper */}
          <div className="flex items-center justify-between bg-arena/20 p-3 rounded-xl border border-border/50">
            <span className="text-xs font-semibold text-chocolate">Cantidad de piezas a encargar:</span>
            <div className="flex items-center rounded-lg border border-border bg-surface px-2 py-1">
              <button
                type="button"
                onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                className="px-2 text-sm font-bold text-chocolate hover:text-admin-accent"
              >
                −
              </button>
              <span className="px-3 text-sm font-bold text-chocolate">{cantidad}</span>
              <button
                type="button"
                onClick={() => setCantidad((c) => c + 1)}
                className="px-2 text-sm font-bold text-chocolate hover:text-admin-accent"
              >
                +
              </button>
            </div>
          </div>

          {/* Price summary */}
          <div className="rounded-xl border border-border bg-arena/30 p-4 space-y-2 text-sm">
            <div className="flex justify-between text-muted text-xs">
              <span>Precio Base (unitario):</span>
              <span>{formatPrecio(precioBase)}</span>
            </div>
            {adicionalMedidaCalculado > 0 && (
              <div className="flex justify-between text-muted text-xs">
                <span>Adicional Medida ({medidaSeleccionada}):</span>
                <span>+{formatPrecio(adicionalMedidaCalculado)}</span>
              </div>
            )}
            {adicionalMarcoCalculado > 0 && (
              <div className="flex justify-between text-muted text-xs">
                <span>Marco de Madera:</span>
                <span>+{formatPrecio(adicionalMarcoCalculado)}</span>
              </div>
            )}
            {recargoPersonalizadoCalculado > 0 && (
              <div className="flex justify-between text-muted text-xs">
                <span>Personalización (+15%):</span>
                <span>+{formatPrecio(recargoPersonalizadoCalculado)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-border/60 pt-2 font-bold text-foreground text-base">
              <span>Total ({cantidad} {cantidad === 1 ? "unidad" : "unidades"}):</span>
              <span className="text-admin-accent">{formatPrecio(totalEstimado)}</span>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-admin-accent text-white hover:bg-admin-accent-hover flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold shadow-md"
          >
            <span>🛍️ Agregar al Carrito de Encargos</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
