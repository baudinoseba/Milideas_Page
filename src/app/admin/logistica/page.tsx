import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { formatPrecio } from "@/lib/pricing";
import { Badge } from "@/components/ui/badge";
import type { ZonaLogistica } from "@/types";

export const metadata = { title: "Logística" };

export default async function AdminLogisticaPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("configuracion_logistica")
    .select("*")
    .order("zona_nombre");

  const zonas = (data ?? []) as ZonaLogistica[];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-medium">Zonas logísticas</h1>
        <Link href="/admin/logistica/nueva">
          <Button>Nueva zona</Button>
        </Link>
      </div>
      <ul className="divide-y divide-border rounded-sm border border-border">
        {zonas.map((z) => (
          <li key={z.id} className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium">{z.zona_nombre}</p>
              <p className="text-xs text-muted">
                Agencia: {formatPrecio(z.precio_agencia)} · Domicilio:{" "}
                {formatPrecio(z.precio_domicilio)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!z.activa && <Badge variant="muted">Inactiva</Badge>}
              <Link
                href={`/admin/logistica/${z.id}`}
                className="text-sm text-muted hover:text-foreground"
              >
                Editar
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
