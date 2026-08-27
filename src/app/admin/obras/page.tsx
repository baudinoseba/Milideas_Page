import { getObrasProyectos } from "@/lib/supabase/queries";
import { ObrasManager } from "@/components/admin/obras-manager";

export const metadata = {
  title: "Admin — Obras & Proyectos Especiales",
};

export default async function AdminObrasPage() {
  const obras = await getObrasProyectos({}).catch(() => []);
  return <ObrasManager obras={obras} />;
}
