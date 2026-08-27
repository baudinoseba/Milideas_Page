import { getFormatosCatalogo, getProductos, getPortfolioColecciones } from "@/lib/supabase/queries";
import { ArteManager } from "@/components/admin/arte-manager";

export const metadata = {
  title: "Admin — Ilustración (Catálogo, Stock & Portfolio)",
};

export default async function AdminIlustracionPage() {
  const [formatos, productosStock, portfolio] = await Promise.all([
    getFormatosCatalogo("ilustracion").catch(() => []),
    getProductos({ tipoCatalogo: "ilustraciones" }).catch(() => []),
    getPortfolioColecciones("ilustracion").catch(() => []),
  ]);

  return (
    <ArteManager
      rubro="ilustracion"
      formatos={formatos}
      productosStock={productosStock}
      portfolio={portfolio}
    />
  );
}
