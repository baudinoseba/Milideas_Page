import type { Metadata } from "next";
import Link from "next/link";
import { ArrepentimientoForm } from "@/components/legal/arrepentimiento-form";
import { getConfiguracionSitio } from "@/lib/supabase/queries";

export const metadata: Metadata = {
  title: "Botón de Arrepentimiento",
  description: "Formulario de revocación de compra conforme a la Disposición 954/2025 y Art. 34 de la Ley 24.240.",
};

export default async function ArrepentimientoPage() {
  const config = await getConfiguracionSitio().catch(() => null);

  return (
    <div className="mx-auto max-w-xl py-8 sm:py-14 px-4 sm:px-6 space-y-6">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-sans text-muted">
        <Link href="/" className="hover:text-chocolate transition-colors">
          Inicio
        </Link>
        <span>/</span>
        <span className="text-chocolate">Botón de arrepentimiento</span>
      </nav>

      <div className="space-y-1.5 border-b border-border/70 pb-4">
        <h1 className="text-2xl sm:text-3xl font-serif font-medium text-chocolate">
          Revocación de compra
        </h1>
        <p className="text-xs text-muted font-sans">
          Disposición 954/2025 · Subsecretaría de Defensa del Consumidor (Art. 34 Ley 24.240)
        </p>
      </div>

      <div className="rounded-2xl border border-border/70 bg-surface p-5 sm:p-7 shadow-xs">
        <ArrepentimientoForm whatsappNumero={config?.vendedor_whatsapp || undefined} />
      </div>
    </div>
  );
}
