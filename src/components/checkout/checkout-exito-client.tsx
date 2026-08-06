"use client";

import { useState, useTransition } from "react";
import { formatPrecio } from "@/lib/pricing";
import { subirComprobanteAction } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Toast } from "@/components/ui/modal";
import { PAYMENT_GRACE_HOURS } from "@/lib/utils/constants";
import type { PedidoConItems } from "@/types";

export function CheckoutExitoClient({ pedido }: { pedido: PedidoConItems }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const limite = new Date(pedido.fecha_limite_pago);

  const handleUpload = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await subirComprobanteAction(pedido.id, formData);
      if (result.success) {
        setMessage("Comprobante subido correctamente");
      } else {
        setError(result.error ?? "Error al subir");
      }
    });
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-medium">¡Pedido confirmado!</h1>
        <p className="mt-2 text-muted">
          Tenés {PAYMENT_GRACE_HOURS} horas para transferir y subir el comprobante.
        </p>
      </div>

      <Card className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted">Nº de pedido</span>
          <span className="font-mono text-xs">{pedido.id.slice(0, 8)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Total</span>
          <span className="font-medium">{formatPrecio(pedido.total)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Vence</span>
          <span>{limite.toLocaleString("es-AR")}</span>
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 font-medium">Datos para transferencia</h2>
        <p className="text-sm text-muted">
          {process.env.NEXT_PUBLIC_BANK_ACCOUNT_INFO ??
            "Los datos bancarios serán enviados por WhatsApp."}
        </p>
      </Card>

      {!pedido.comprobante_url && (
        <Card>
          <h2 className="mb-3 font-medium">Subir comprobante</h2>
          <form onSubmit={handleUpload} className="space-y-3">
            <div>
              <Label htmlFor="comprobante">Archivo</Label>
              <input
                id="comprobante"
                name="comprobante"
                type="file"
                accept="image/*,.pdf"
                required
                className="mt-1 block w-full text-sm"
              />
            </div>
            <Button type="submit" isLoading={pending}>
              Subir comprobante
            </Button>
          </form>
        </Card>
      )}

      {pedido.comprobante_url && (
        <p className="text-center text-sm text-emerald-700">
          Comprobante recibido. Te contactaremos pronto.
        </p>
      )}

      {message && <Toast message={message} type="success" />}
      {error && <Toast message={error} type="error" onClose={() => setError(null)} />}
    </div>
  );
}
