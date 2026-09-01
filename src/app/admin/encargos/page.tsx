import { getEncargos, getConfiguracionSitio, getConfiguracionEncargos } from "@/lib/supabase/queries";
import { EncargosManager } from "@/components/admin/encargos-manager";

export const metadata = { title: "Gestión de Encargos | Admin" };

export default async function AdminEncargosPage() {
  const [encargos, configSitio, configEncargos] = await Promise.all([
    getEncargos(),
    getConfiguracionSitio().catch(() => null),
    getConfiguracionEncargos().catch(() => null),
  ]);

  return (
    <EncargosManager
      initialEncargos={encargos}
      configSitio={configSitio}
      configEncargos={configEncargos}
    />
  );
}
