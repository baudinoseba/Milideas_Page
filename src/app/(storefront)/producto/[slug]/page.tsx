import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductDetailClient } from "@/components/product/product-detail-client";
import { Badge } from "@/components/ui/badge";
import { formatPrecio } from "@/lib/pricing";
import { getStockStatus, getStockLabel, puedeComprar } from "@/lib/stock";
import { getProductoBySlug, getProductoSlugs } from "@/lib/supabase/queries";

export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = await getProductoSlugs().catch(() => []);
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const producto = await getProductoBySlug(slug);
  if (!producto) return { title: "Producto no encontrado" };

  const imagen = producto.producto_imagenes[0]?.url_imagen;

  return {
    title: producto.nombre,
    description: producto.descripcion ?? undefined,
    openGraph: imagen
      ? { images: [{ url: imagen, alt: producto.nombre }] }
      : undefined,
  };
}

export default async function ProductoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const producto = await getProductoBySlug(slug);
  if (!producto) notFound();

  const stockStatus = getStockStatus(producto.stock_disponible);
  const comprable = puedeComprar(stockStatus);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: producto.nombre,
    description: producto.descripcion,
    image: producto.producto_imagenes.map((i) => i.url_imagen),
    offers: {
      "@type": "Offer",
      price: producto.precio_base,
      priceCurrency: "ARS",
      availability:
        stockStatus === "disponible"
          ? "https://schema.org/InStock"
          : "https://schema.org/PreOrder",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <ProductGallery imagenes={producto.producto_imagenes} />
        <div className="space-y-6">
          <div className="space-y-2">
            {producto.categorias && (
              <p className="text-xs uppercase tracking-wider text-muted">
                {producto.categorias.nombre}
              </p>
            )}
            <h1 className="text-2xl font-medium sm:text-3xl">{producto.nombre}</h1>
            <p className="text-xl">{formatPrecio(producto.precio_base)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>{getStockLabel(stockStatus)}</Badge>
            {producto.es_personalizable && (
              <Badge variant="muted">Personalizable</Badge>
            )}
            {producto.es_entrega_inmediata && (
              <Badge variant="success">Entrega inmediata</Badge>
            )}
          </div>
          {producto.descripcion && (
            <p className="text-sm leading-relaxed text-muted">
              {producto.descripcion}
            </p>
          )}
          {comprable && (
            <ProductDetailClient
              producto={{
                id: producto.id,
                slug: producto.slug,
                nombre: producto.nombre,
                precioBase: producto.precio_base,
                esPersonalizable: producto.es_personalizable,
                stockDisponible: producto.stock_disponible,
                imagenUrl:
                  producto.producto_imagenes.sort((a, b) => a.orden - b.orden)[0]
                    ?.url_imagen ?? null,
              }}
            />
          )}
        </div>
      </div>
    </>
  );
}
