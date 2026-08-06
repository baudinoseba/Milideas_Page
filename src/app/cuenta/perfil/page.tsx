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

  const perfil = await getPerfil(user.id);
  if (!perfil) redirect("/login");

  return <PerfilForm perfil={perfil} />;
}
