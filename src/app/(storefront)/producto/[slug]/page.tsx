import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductDetailClient } from "@/components/product/product-detail-client";
import { ProductCard } from "@/components/product/product-card";
import { Badge } from "@/components/ui/badge";
import { BackButton } from "@/components/ui/back-button";
import { formatPrecio } from "@/lib/pricing";
import { getStockStatus, getStockLabel, puedeComprar } from "@/lib/stock";
import { getProductoBySlug, getProductoSlugs, getProductos } from "@/lib/supabase/queries";

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

  // Fetch related products from the same category
  const productosRelacionados = producto.categoria_id
    ? await getProductos({ categoriaId: producto.categoria_id })
        .then((items) => items.filter((item) => item.id !== producto.id).slice(0, 3))
        .catch(() => [])
    : [];

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

      {/* Breadcrumbs Navigation */}
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs font-sans text-barro">
        <Link href="/" className="hover:text-chocolate transition-colors">
          Inicio
        </Link>
        <span>/</span>
        <Link href="/catalogo" className="hover:text-chocolate transition-colors">
          Catálogo
        </Link>
        {producto.categorias && (
          <>
            <span>/</span>
            <Link
              href={`/catalogo?categoria=${producto.categorias.id}`}
              className="hover:text-chocolate transition-colors"
            >
              {producto.categorias.nombre}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="font-semibold text-chocolate truncate max-w-[180px]">{producto.nombre}</span>
      </nav>

      <div className="mb-6">
        <BackButton fallbackHref="/catalogo">Volver al catálogo</BackButton>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 lg:gap-12 pb-16">
        <div className="lg:col-span-6">
          <ProductGallery imagenes={producto.producto_imagenes} />
        </div>

        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-2">
            <div className="flex gap-2">
              {producto.categorias && (
                <span className="inline-block rounded-full bg-rosa-buho/20 px-3.5 py-1 text-xs font-semibold text-terracota font-sans">
                  {producto.categorias.nombre}
                </span>
              )}
              {producto.producciones && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-terracota/20 bg-surface/95 px-3.5 py-1 text-xs font-semibold font-sans tracking-wide text-chocolate shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-verde-menta animate-pulse" />
                  {producto.producciones.nombre}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-medium font-serif text-chocolate sm:text-4xl leading-tight">
              {producto.nombre}
            </h1>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Badge className="bg-arena text-chocolate border border-barro-claro/60">
              {getStockLabel(stockStatus)}
            </Badge>
            {producto.es_personalizable && (
              <Badge variant="muted" className="bg-lino/50 text-chocolate">Personalizable (+15%)</Badge>
            )}
            {producto.es_entrega_inmediata && (
              <Badge variant="success" className="bg-verde-menta/20 text-chocolate border border-verde-menta/40">
                Entrega inmediata
              </Badge>
            )}
          </div>

          {producto.descripcion && (
            <div className="space-y-2 bg-arena/30 p-5 rounded-2xl border border-border/60">
              <span className="text-xs font-semibold uppercase tracking-wider text-barro font-sans block">
                Detalles del autor
              </span>
              <p className="text-sm leading-relaxed text-chocolate font-sans">
                {producto.descripcion}
              </p>
            </div>
          )}

          {/* Craftsmanship & Care Info Box */}
          <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl border border-border/50 bg-surface text-xs text-barro font-sans">
            <div className="flex items-center gap-2">
              <span className="text-terracota text-base">🔥</span>
              <span>Horneado a 1040°C</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-terracota text-base">✨</span>
              <span>Esmalte libre de plomo</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-terracota text-base">🧽</span>
              <span>Apto lavavajillas</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-terracota text-base">🇦🇷</span>
              <span>Hecho en Sunchales</span>
            </div>
          </div>

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

      {/* Related Products Section */}
      {productosRelacionados.length > 0 && (
        <section className="border-t border-border/60 pt-12 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-medium font-serif text-chocolate">Otras piezas de la colección</h2>
            {producto.categoria_id && (
              <Link
                href={`/catalogo?categoria=${producto.categoria_id}`}
                className="text-sm font-semibold text-terracota hover:text-chocolate transition-colors font-sans"
              >
                Ver todas →
              </Link>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6">
            {productosRelacionados.map((rel) => (
              <ProductCard key={rel.id} producto={rel} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

