import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPedidosUsuario, getEncargosUsuario } from "@/lib/supabase/queries";
import { ComprasEncargosView } from "@/components/cuenta/compras-encargos-view";

export const metadata = {
  title: "Mis Compras & Encargos | Milideas",
  description: "Seguimiento de compras de stock y estado de tus encargos en taller.",
};

export default async function PedidosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/cuenta/pedidos");

  const [pedidos, encargos] = await Promise.all([
    getPedidosUsuario(user.id).catch(() => []),
    getEncargosUsuario(user.id, user.email ?? "").catch(() => []),
  ]);

  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-muted">Cargando tus compras y encargos...</div>}>
      <ComprasEncargosView
        pedidos={pedidos}
        encargos={encargos}
        userEmail={user.email ?? ""}
      />
    </Suspense>
  );
}
