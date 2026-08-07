"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatPrecio } from "@/lib/pricing";
import {
  confirmarPagoAction,
  cancelarPedidoAction,
  marcarEnviadoAction,
} from "@/lib/actions";

type PedidoAdmin = {
  id: string;
  estado: string;
  total: number;
  subtotal: number;
  descuento_aplicado: number;
  costo_envio: number;
  nombre_contacto: string;
  whatsapp_contacto: string;
  email_contacto: string | null;
  tipo_envio: string;
  metodo_pago: string;
  fecha_limite_pago: string;
  comprobante_url: string | null;
  direccion_envio: Record<string, string> | null;  // eslint-disable-line @typescript-eslint/no-explicit-any
  created_at: string;
  items_pedido: Array<{
    id: string;
    cantidad: number;
    precio_unitario_final: number;
    es_personalizado: boolean;
    productos: { nombre: string } | null;
  }>;
};

const estadoSteps = ["reservado", "confirmado", "enviado"];

function PedidoTimeline({ estado }: { estado: string }) {
  const normalized = estado === "pendiente_pago" ? "reservado" : estado;
  const currentIdx = estadoSteps.indexOf(normalized);
  const labels = ["Reservado (48h)", "Confirmado", "Enviado"];

  if (estado === "cancelado") {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="muted">Cancelado</Badge>
        <p className="text-xs text-muted">Este pedido fue cancelado</p>
      </div>
    );
  }

  return (
    <div className="admin-timeline flex-wrap">
      {estadoSteps.map((step, idx) => {
        const isCompleted = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const status = isCompleted
          ? "completed"
          : isCurrent
            ? "current"
            : "pending";

        return (
          <div key={step} className="flex items-center">
            <div className={`admin-timeline-step ${status}`}>
              <div className="step-dot">
                {isCompleted ? "✓" : idx + 1}
              </div>
              <span
                className={
                  isCurrent ? "font-medium text-foreground" : "text-muted"
                }
              >
                {labels[idx]}
              </span>
            </div>
            {idx < estadoSteps.length - 1 && (
              <div
                className={`admin-timeline-connector ${isCompleted ? "completed" : "pending"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function PedidoAdminActions({
  pedido,
  proximoAVencer,
}: {
  pedido: PedidoAdmin;
  proximoAVencer: boolean;
}) {
  const [pending, startTransition] = useTransition();

  const handleConfirmar = () => {
    startTransition(async () => {
      await confirmarPagoAction(pedido.id);
      window.location.reload();
    });
  };

  const handleEnviado = () => {
    startTransition(async () => {
      await marcarEnviadoAction(pedido.id);
      window.location.reload();
    });
  };

  const handleCancelar = () => {
    if (!confirm("¿Cancelar pedido y restaurar stock?")) return;
    startTransition(async () => {
      await cancelarPedidoAction(pedido.id);
      window.location.reload();
    });
  };

  const limite = new Date(pedido.fecha_limite_pago);

  return (
    <div className="space-y-6">
      {/* Timeline */}
      <Card>
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted">
          Estado del pedido
        </p>
        <PedidoTimeline estado={pedido.estado} />
        {proximoAVencer && pedido.estado === "pendiente_pago" && (
          <div className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
            ⏰ Este pedido vence el {limite.toLocaleString("es-AR")}
          </div>
        )}
      </Card>

      {/* Contact info */}
      <Card>
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted">
          Datos del cliente
        </p>
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <span className="text-xs text-muted">Nombre</span>
            <p className="font-medium">{pedido.nombre_contacto}</p>
          </div>
          <div>
            <span className="text-xs text-muted">WhatsApp</span>
            <p className="font-medium">{pedido.whatsapp_contacto}</p>
          </div>
          {pedido.email_contacto && (
            <div>
              <span className="text-xs text-muted">Email</span>
              <p className="font-medium">{pedido.email_contacto}</p>
            </div>
          )}
          <div>
            <span className="text-xs text-muted">Método de pago</span>
            <p className="font-medium capitalize">
              {pedido.metodo_pago.replace("_", " ")}
            </p>
          </div>
          <div>
            <span className="text-xs text-muted">Tipo de envío</span>
            <p className="font-medium capitalize">{pedido.tipo_envio}</p>
          </div>
          {pedido.direccion_envio && (
            <div className="sm:col-span-2">
              <span className="text-xs text-muted">Dirección</span>
              <p className="font-medium">
                {pedido.direccion_envio.calle} {pedido.direccion_envio.numero},{" "}
                {pedido.direccion_envio.ciudad}{" "}
                {pedido.direccion_envio.codigoPostal}
                {pedido.direccion_envio.referencia &&
                  ` (${pedido.direccion_envio.referencia})`}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Items */}
      <Card>
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted">
          Detalle del pedido
        </p>
        <ul className="divide-y divide-border text-sm">
          {pedido.items_pedido.map((item) => (
            <li key={item.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">
                  {item.productos?.nombre ?? "Producto"}{" "}
                  <span className="text-muted">× {item.cantidad}</span>
                </p>
                {item.es_personalizado && (
                  <Badge variant="default" className="mt-1">
                    Personalizado
                  </Badge>
                )}
              </div>
              <span className="font-medium">
                {formatPrecio(item.precio_unitario_final * item.cantidad)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Subtotal</span>
            <span>{formatPrecio(pedido.subtotal)}</span>
          </div>
          {pedido.descuento_aplicado > 0 && (
            <div className="flex justify-between text-admin-success">
              <span>Descuento</span>
              <span>-{formatPrecio(pedido.descuento_aplicado)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted">Envío</span>
            <span>{formatPrecio(pedido.costo_envio)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2 font-medium">
            <span>Total</span>
            <span>{formatPrecio(pedido.total)}</span>
          </div>
        </div>
      </Card>

      {/* Comprobante */}
      {pedido.comprobante_url && (
        <Card>
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted">
            Comprobante de pago
          </p>
          <a
            href={pedido.comprobante_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block overflow-hidden rounded-lg border border-border hover:border-admin-accent transition-colors"
          >
            <img
              src={pedido.comprobante_url}
              alt="Comprobante de pago"
              className="max-h-64 w-full object-contain bg-surface p-2"
            />
          </a>
          <p className="mt-2 text-xs text-muted">
            Click en la imagen para verla completa
          </p>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 border-t border-border pt-6">
        {(pedido.estado === "reservado" || pedido.estado === "pendiente_pago") && (
          <>
            <Button onClick={handleConfirmar} isLoading={pending}>
              ✅ Confirmar pago recibido
            </Button>
            <Button
              variant="outline"
              onClick={handleCancelar}
              isLoading={pending}
            >
              ❌ Cancelar (Liberar Stock)
            </Button>
          </>
        )}
        {pedido.estado === "confirmado" && (
          <>
            <Button onClick={handleEnviado} isLoading={pending}>
              📦 Marcar como enviado
            </Button>
            <Button
              variant="outline"
              onClick={handleCancelar}
              isLoading={pending}
            >
              Cancelar pedido
            </Button>
          </>
        )}
        <Link
          href="/admin/pedidos"
          className="inline-flex items-center text-sm text-muted hover:text-foreground transition-colors"
        >
          ← Volver a pedidos
        </Link>
      </div>
    </div>
  );
}
