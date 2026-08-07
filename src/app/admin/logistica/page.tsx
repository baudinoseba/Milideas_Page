import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrecio } from "@/lib/pricing";
import { BulkAdjustShippingForm } from "@/components/admin/bulk-adjust-shipping-form";
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
        <div>
          <h1 className="text-2xl font-semibold">Zonas de envío</h1>
          <p className="mt-1 text-sm text-muted">
            Configurá las zonas y precios de envío para tus clientes
          </p>
        </div>
        <Link href="/admin/logistica/nueva">
          <Button>+ Nueva zona</Button>
        </Link>
      </div>

      {zonas.length > 0 && <BulkAdjustShippingForm />}

      {zonas.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border p-12 text-center">
          <p className="text-3xl mb-3">🚚</p>
          <p className="text-lg font-medium">No tenés zonas de envío</p>
          <p className="mt-1 text-sm text-muted mb-6">
            Creá zonas para que tus clientes puedan elegir dónde recibir sus
            pedidos
          </p>
          <Link href="/admin/logistica/nueva">
            <Button>Crear primera zona</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {zonas.map((z) => (
            <Link
              key={z.id}
              href={`/admin/logistica/${z.id}`}
              className="rounded-lg border border-border bg-surface p-5 transition-all hover:border-admin-accent hover:shadow-sm"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-medium">{z.zona_nombre}</h3>
                {!z.activa ? (
                  <Badge variant="muted">Inactiva</Badge>
                ) : (
                  <Badge variant="success">Activa</Badge>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-muted">Agencia</p>
                  <p className="font-medium">{formatPrecio(z.precio_agencia)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Domicilio</p>
                  <p className="font-medium">{formatPrecio(z.precio_domicilio)}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted text-right">Editar →</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
