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
      title: "Cerámica de Autor — Milideas",
    };
  }

  const titles: Record<TipoSeccion, string> = {
    stock: "Cerámica de Autor — Stock Disponible para Entrega Inmediata",
    catalogo: "Cerámica de Autor — Catálogo de Formatos & Encargos a Medida",
    portfolio: "Cerámica de Autor — Portfolio de Obras & Colecciones",
  };

  const descriptions: Record<TipoSeccion, string> = {
    stock: "Piezas únicas y pequeñas ediciones en stock listas para retirar en el momento o despachar en la semana.",
    catalogo: "Más de 40 formatos físicos artesanales disponibles para encargar con tu diseño preferido.",
    portfolio: "Galería de colecciones y estilos creados por Mili Ferrero en cerámica.",
  };

  return {
    title: titles[seccion as TipoSeccion],
    description: descriptions[seccion as TipoSeccion],
  };
}

export default async function CeramicaSeccionPage({
  params,
}: {
  params: Promise<{ seccion: string }>;
}) {
  const { seccion } = await params;

  if (!SECCIONES_VALIDAS.includes(seccion as TipoSeccion)) {
    notFound();
  }

  const [formatos, productosStock, portfolio] = await Promise.all([
    getFormatosCatalogo("ceramica").catch(() => []),
    getProductos({ tipoCatalogo: "ceramica" }).catch(() => []),
    getPortfolioColecciones("ceramica").catch(() => []),
  ]);

  const stockDisponibles = productosStock.filter((p) => (p.stock_disponible ?? 0) > 0);

  return (
    <CatalogoView
      rubro="ceramica"
      formatos={formatos}
      productosStock={stockDisponibles}
      portfolio={portfolio}
      tabInicial={seccion as TipoSeccion}
    />
  );
}
