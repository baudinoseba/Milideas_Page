import { getConfiguracionEncargos } from "@/lib/supabase/queries";
import { EncargosConfigForm } from "@/components/admin/encargos-config-form";

export const metadata = { title: "Configuración de Encargos | Admin" };

export default async function AdminEncargosConfigPage() {
  const config = await getConfiguracionEncargos();

  return <EncargosConfigForm initialConfig={config} />;
}
