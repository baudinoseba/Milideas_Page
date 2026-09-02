import { notFound } from "next/navigation";
import { getFormatosCatalogo, getProductos, getPortfolioColecciones } from "@/lib/supabase/queries";
import { CatalogoView } from "@/components/catalogo/catalogo-view";

const SECCIONES_VALIDAS = ["stock", "catalogo", "portfolio"] as const;
type TipoSeccion = (typeof SECCIONES_VALIDAS)[number];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ seccion: string }>;
}) {
  const { seccion } = await params;
  if (!SECCIONES_VALIDAS.includes(seccion as TipoSeccion)) {
    return {
      title: "Ilustración de Autor — Milideas",
    };
  }

  const titles: Record<TipoSeccion, string> = {
    stock: "Ilustración de Autor — Stock Disponible para Entrega Inmediata",
    catalogo: "Ilustración de Autor — Catálogo de Obras & Formatos a Medida",
    portfolio: "Ilustración de Autor — Portfolio de Cuadros & Pinturas",
  };

  const descriptions: Record<TipoSeccion, string> = {
    stock: "Pinturas y dibujos originales en acuarela en stock listas para retirar en el momento o despachar en la semana.",
    catalogo: "Obras únicas sobre papel acuarela de alto gramaje y formatos enmarcados a pedido.",
    portfolio: "Galería de ilustraciones y proyectos especiales pintados a mano por Mili Ferrero.",
  };

  return {
    title: titles[seccion as TipoSeccion],
    description: descriptions[seccion as TipoSeccion],
  };
}

export default async function IlustracionSeccionPage({
  params,
}: {
  params: Promise<{ seccion: string }>;
}) {
  const { seccion } = await params;

  if (!SECCIONES_VALIDAS.includes(seccion as TipoSeccion)) {
    notFound();
  }

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
      tabInicial={seccion as TipoSeccion}
    />
  );
}
