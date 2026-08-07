import { createClient } from "@/lib/supabase/server";
import { getPerfil } from "@/lib/supabase/queries";
import { PerfilForm } from "@/components/cuenta/perfil-form";
import { redirect } from "next/navigation";

export const metadata = { title: "Mi perfil" };

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const perfil = (await getPerfil(user.id)) ?? {
    id: user.id,
    nombre_completo: (user.user_metadata?.nombre_completo as string | null) ?? "",
    whatsapp: (user.user_metadata?.whatsapp as string | null) ?? "",
    es_admin: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    nombre_usuario: null,
    dni: null,
    direccion_calle: null,
    direccion_numero: null,
    direccion_piso: null,
    direccion_depto: null,
    direccion_ciudad: null,
    direccion_provincia: null,
    direccion_codigo_postal: null,
    direccion_referencia: null,
  };

  return <PerfilForm perfil={perfil} email={user.email ?? ""} />;
}
