import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ZonaForm } from "@/components/admin/zona-form";
import type { ZonaLogistica } from "@/types";

export default async function EditarZonaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("configuracion_logistica")
    .select("*")
    .eq("id", id)
    .single();
  if (!data) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-medium">Editar zona</h1>
      <ZonaForm zona={data as ZonaLogistica} />
    </div>
  );
}
