import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product/product-card";
import { getDropDestacados } from "@/lib/supabase/queries";

export default async function HomePage() {
  const drops = await getDropDestacados(3).catch(() => []);

  return (
    <div className="space-y-16">
      <section className="space-y-6 py-8 text-center sm:py-16">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">
          Cerámica de autor
        </p>
        <h1 className="text-3xl font-medium tracking-tight sm:text-5xl">
          Piezas únicas.
          <br />
          Lanzamientos mensuales.
        </h1>
        <p className="mx-auto max-w-md text-muted">
          Descubrí cerámica hecha a mano en ediciones limitadas. Cada drop es
          una oportunidad única.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link href="/drops">
            <Button>Ver drop actual</Button>
          </Link>
          <Link href="/catalogo">
            <Button variant="outline">Explorar catálogo</Button>
          </Link>
        </div>
      </section>

      {drops.length > 0 && (
        <section>
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-xl font-medium">Drop destacado</h2>
            <Link href="/drops" className="text-sm text-muted hover:text-foreground">
              Ver todo
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6">
            {drops.map((producto) => (
              <ProductCard key={producto.id} producto={producto} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
