import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getPedidosUsuario } from "@/lib/supabase/queries";
import { formatPrecio } from "@/lib/pricing";
import { Badge } from "@/components/ui/badge";
import { redirect } from "next/navigation";

export const metadata = { title: "Mis pedidos" };

const estadoLabels: Record<string, string> = {
  pendiente_pago: "Pendiente de pago",
  confirmado: "Confirmado",
  enviado: "Enviado",
  cancelado: "Cancelado",
};

export default async function PedidosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const pedidos = await getPedidosUsuario(user.id).catch(() => []);

  return (
    <div>
      <h1 className="mb-6 text-xl font-medium">Mis pedidos</h1>
      {pedidos.length === 0 ? (
        <p className="text-muted">Aún no tenés pedidos.</p>
      ) : (
        <ul className="space-y-3">
          {pedidos.map((pedido) => (
            <li key={pedido.id}>
              <Link
                href={`/cuenta/pedidos/${pedido.id}`}
                className="flex items-center justify-between rounded-sm border border-border p-4 hover:bg-surface"
              >
                <div>
                  <p className="text-sm font-medium">
                    Pedido #{pedido.id.slice(0, 8)}
                  </p>
                  <p className="text-xs text-muted">
                    {new Date(pedido.created_at).toLocaleDateString("es-AR")}
                  </p>
                </div>
                <div className="text-right">
                  <Badge>{estadoLabels[pedido.estado] ?? pedido.estado}</Badge>
                  <p className="mt-1 text-sm">{formatPrecio(pedido.total)}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
