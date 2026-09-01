import { getFormatosCatalogo, getProductos, getPortfolioColecciones } from "@/lib/supabase/queries";
import { CatalogoView } from "@/components/catalogo/catalogo-view";

export const metadata = {
  title: "Cerámica de Autor — Catálogo & Stock",
  description: "Piezas únicas y en pequeñas ediciones listas para entregar.",
};

export default async function CeramicaPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: "stock" | "catalogo" | "portfolio" }>;
}) {
  const { tab = "stock" } = await searchParams;

  const [formatos, productosStock, portfolio] = await Promise.all([
    getFormatosCatalogo("ceramica").catch(() => []),
    getProductos({ tipoCatalogo: "ceramica" }).catch(() => []),
    getPortfolioColecciones("ceramica").catch(() => []),
  ]);

  // Filtrar solo piezas con stock real para la pestaña de stock
  const stockDisponibles = productosStock.filter((p) => (p.stock_disponible ?? 0) > 0);

  return (
    <CatalogoView
      rubro="ceramica"
      formatos={formatos}
      productosStock={stockDisponibles}
      portfolio={portfolio}
      tabInicial={tab}
    />
  );
}
