"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrecio } from "@/lib/pricing";
import { confirmarPagoAction, cancelarPedidoAction } from "@/lib/actions";

type PedidoAdmin = {
  id: string;
  estado: string;
  total: number;
  nombre_contacto: string;
  whatsapp_contacto: string;
  fecha_limite_pago: string;
  comprobante_url: string | null;
  created_at: string;
  items_pedido: Array<{
    id: string;
    cantidad: number;
    precio_unitario_final: number;
    productos: { nombre: string } | null;
  }>;
};

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
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={proximoAVencer ? "warning" : "default"}>
          {pedido.estado}
        </Badge>
        {proximoAVencer && <Badge variant="warning">Por vencer</Badge>}
      </div>

      <div className="space-y-2 text-sm">
        <p>
          <span className="text-muted">Contacto:</span> {pedido.nombre_contacto}
        </p>
        <p>
          <span className="text-muted">WhatsApp:</span> {pedido.whatsapp_contacto}
        </p>
        <p>
          <span className="text-muted">Total:</span> {formatPrecio(pedido.total)}
        </p>
        <p>
          <span className="text-muted">Creado:</span>{" "}
          {new Date(pedido.created_at).toLocaleString("es-AR")}
        </p>
        <p>
          <span className="text-muted">Vence:</span>{" "}
          {limite.toLocaleString("es-AR")}
        </p>
      </div>

      <ul className="divide-y divide-border border-y border-border text-sm">
        {pedido.items_pedido.map((item) => (
          <li key={item.id} className="flex justify-between py-2">
            <span>
              {item.productos?.nombre ?? "Producto"} × {item.cantidad}
            </span>
            <span>{formatPrecio(item.precio_unitario_final * item.cantidad)}</span>
          </li>
        ))}
      </ul>

      {pedido.comprobante_url && (
        <a
          href={pedido.comprobante_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm underline"
        >
          Ver comprobante
        </a>
      )}

      {pedido.estado === "pendiente_pago" && (
        <div className="flex gap-3">
          <Button onClick={handleConfirmar} isLoading={pending}>
            Confirmar pago
          </Button>
          <Button variant="outline" onClick={handleCancelar} isLoading={pending}>
            Cancelar pedido
          </Button>
        </div>
      )}

      <Link href="/admin/pedidos" className="text-sm text-muted hover:text-foreground">
        ← Volver a pedidos
      </Link>
    </div>
  );
}
