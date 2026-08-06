"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Toast } from "@/components/ui/modal";
import { formatPrecio } from "@/lib/pricing";
import { calcularCostoEnvio } from "@/lib/shipping";
import { crearPedidoAction } from "@/lib/actions";
import { useCartStore } from "@/stores/cart-store";
import type { MetodoPago, TipoEnvio, ZonaLogistica } from "@/types";

export function CheckoutForm({ zonas }: { zonas: ZonaLogistica[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [tipoEnvio, setTipoEnvio] = useState<TipoEnvio>("agencia");
  const [metodoPago, setMetodoPago] = useState<MetodoPago>("transferencia");
  const [zonaId, setZonaId] = useState(zonas[0]?.id ?? "");

  const items = useCartStore((s) => s.items);
  const hydrated = useCartStore((s) => s.hydrated);
  const clearCart = useCartStore((s) => s.clearCart);
  const toRpcItems = useCartStore((s) => s.toRpcItems);

  const zona = zonas.find((z) => z.id === zonaId);
  const costoEnvio = zona ? calcularCostoEnvio(zona, tipoEnvio) : 0;
  const pricing = useCartStore.getState().getPricing(metodoPago, costoEnvio);

  useEffect(() => {
    if (hydrated && items.length === 0) {
      router.push("/carrito");
    }
  }, [hydrated, items.length, router]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await crearPedidoAction(
        formData,
        toRpcItems(),
        {
          subtotal: pricing.subtotal,
          descuentoAplicado: pricing.descuentoTotal,
          costoEnvio: pricing.costoEnvio,
          total: pricing.total,
        },
      );

      if (!result.success) {
        setError(result.error);
        return;
      }

      clearCart();
      router.push(`/checkout/exito/${result.pedidoId}`);
    });
  };

  if (!hydrated) return null;

  return (
    <>
      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <h2 className="mb-4 font-medium">Datos de contacto</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="nombreContacto">Nombre completo</Label>
                <Input id="nombreContacto" name="nombreContacto" required />
              </div>
              <div>
                <Label htmlFor="whatsappContacto">WhatsApp</Label>
                <Input id="whatsappContacto" name="whatsappContacto" required />
              </div>
              <div>
                <Label htmlFor="emailContacto">Email (opcional)</Label>
                <Input id="emailContacto" name="emailContacto" type="email" />
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="mb-4 font-medium">Envío</h2>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="zonaLogisticaId">Zona</Label>
                <Select
                  id="zonaLogisticaId"
                  name="zonaLogisticaId"
                  value={zonaId}
                  onChange={(e) => setZonaId(e.target.value)}
                  required
                >
                  {zonas.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.zona_nombre}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="tipoEnvio">Tipo de envío</Label>
                <Select
                  id="tipoEnvio"
                  name="tipoEnvio"
                  value={tipoEnvio}
                  onChange={(e) => setTipoEnvio(e.target.value as TipoEnvio)}
                >
                  <option value="agencia">Retiro en agencia</option>
                  <option value="domicilio">Envío a domicilio</option>
                </Select>
              </div>
              {tipoEnvio === "domicilio" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label htmlFor="calle">Calle</Label>
                    <Input id="calle" name="calle" required />
                  </div>
                  <div>
                    <Label htmlFor="numero">Número</Label>
                    <Input id="numero" name="numero" required />
                  </div>
                  <div>
                    <Label htmlFor="ciudad">Ciudad</Label>
                    <Input id="ciudad" name="ciudad" required />
                  </div>
                  <div>
                    <Label htmlFor="codigoPostal">Código postal</Label>
                    <Input id="codigoPostal" name="codigoPostal" required />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="referencia">Referencia (opcional)</Label>
                    <Input id="referencia" name="referencia" />
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <h2 className="mb-4 font-medium">Pago</h2>
            <Select
              name="metodoPago"
              value={metodoPago}
              onChange={(e) => setMetodoPago(e.target.value as MetodoPago)}
            >
              <option value="transferencia">Transferencia bancaria (-20%)</option>
              <option value="efectivo">Efectivo</option>
            </Select>
          </Card>
        </div>

        <aside className="h-fit">
          <Card className="space-y-4">
            <h2 className="font-medium">Resumen del pedido</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Subtotal</span>
                <span>{formatPrecio(pricing.subtotal)}</span>
              </div>
              {pricing.descuentoMayorista > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Mayorista</span>
                  <span>-{formatPrecio(pricing.descuentoMayorista)}</span>
                </div>
              )}
              {pricing.descuentoTransferencia > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Transferencia</span>
                  <span>-{formatPrecio(pricing.descuentoTransferencia)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted">Envío</span>
                <span>{formatPrecio(costoEnvio)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-base font-medium">
                <span>Total</span>
                <span>{formatPrecio(pricing.total)}</span>
              </div>
            </div>
            <Button type="submit" className="w-full" isLoading={pending}>
              Confirmar pedido
            </Button>
          </Card>
        </aside>
      </form>
      {error && <Toast message={error} type="error" onClose={() => setError(null)} />}
    </>
  );
}
