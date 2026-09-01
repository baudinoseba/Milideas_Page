import { getFormatosCatalogo, getProductos, getPortfolioColecciones } from "@/lib/supabase/queries";
import { CatalogoView } from "@/components/catalogo/catalogo-view";

export const metadata = {
  title: "Ilustraciones — Catálogo & Obras Originales",
  description: "Pinturas originales en acuarela, cuadros enmarcados artesanalmente y dibujos de autor.",
};

export default async function IlustracionPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: "stock" | "catalogo" | "portfolio" }>;
}) {
  const { tab = "stock" } = await searchParams;

  const [formatos, productosStock, portfolio] = await Promise.all([
    getFormatosCatalogo("ilustracion").catch(() => []),
    getProductos({ tipoCatalogo: "ilustraciones" }).catch(() => []),
    getPortfolioColecciones("ilustracion").catch(() => []),
  ]);

  const stockDisponibles = productosStock.filter((p) => (p.stock_disponible ?? 0) > 0);

  return (
    <CatalogoView
      rubro="ilustracion"
      formatos={formatos}
      productosStock={stockDisponibles}
      portfolio={portfolio}
      tabInicial={tab}
    />
  );
}
