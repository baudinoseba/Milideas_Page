import {
  getFormatosCatalogo,
  getProductos,
  getPortfolioColecciones,
  getCategorias,
  getProducciones,
} from "@/lib/supabase/queries";
import { ArteManager } from "@/components/admin/arte-manager";

export const metadata = {
  title: "Admin — Cerámica (Catálogo, Stock & Portfolio)",
};

export default async function AdminCeramicaPage() {
  const [formatos, productosStock, portfolio, categorias, producciones] = await Promise.all([
    getFormatosCatalogo("ceramica").catch(() => []),
    getProductos({ tipoCatalogo: "ceramica" }).catch(() => []),
    getPortfolioColecciones("ceramica").catch(() => []),
    getCategorias("ceramica").catch(() => []),
    getProducciones().catch(() => []),
  ]);

  return (
    <ArteManager
      rubro="ceramica"
      formatos={formatos}
      productosStock={productosStock}
      portfolio={portfolio}
      categorias={categorias}
      producciones={producciones}
    />
  );
}
