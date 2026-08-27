import {
  getFormatosCatalogo,
  getProductos,
  getPortfolioColecciones,
  getCategorias,
  getProducciones,
} from "@/lib/supabase/queries";
import { ArteManager } from "@/components/admin/arte-manager";

export const metadata = {
  title: "Admin — Ilustración (Catálogo, Stock & Portfolio)",
};

export default async function AdminIlustracionPage() {
  const [formatos, productosStock, portfolio, categorias, producciones] = await Promise.all([
    getFormatosCatalogo("ilustracion").catch(() => []),
    getProductos({ tipoCatalogo: "ilustraciones" }).catch(() => []),
    getPortfolioColecciones("ilustracion").catch(() => []),
    getCategorias("ilustraciones").catch(() => []),
    getProducciones().catch(() => []),
  ]);

  return (
    <ArteManager
      rubro="ilustracion"
      formatos={formatos}
      productosStock={productosStock}
      portfolio={portfolio}
      categorias={categorias}
      producciones={producciones}
    />
  );
}
