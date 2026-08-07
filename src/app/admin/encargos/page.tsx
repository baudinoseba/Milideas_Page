import { getEncargos } from "@/lib/supabase/queries";
import { EncargosManager } from "@/components/admin/encargos-manager";

export const metadata = { title: "Gestión de Encargos | Admin" };

export default async function AdminEncargosPage() {
  const encargos = await getEncargos();

  return <EncargosManager initialEncargos={encargos} />;
}
