import { redirect, notFound } from "next/navigation";

export default async function CatalogoTipoPage({
  params,
  searchParams,
}: {
  params: Promise<{ tipo: string }>;
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { tipo } = await params;
  const { categoria } = await searchParams;
  const query = categoria ? `?categoria=${categoria}` : "";

  if (tipo === "ceramica") {
    redirect(`/ceramica/catalogo${query}`);
  }

  if (tipo === "ilustracion" || tipo === "ilustraciones") {
    redirect(`/ilustracion/catalogo${query}`);
  }

  if (tipo === "esculturas") {
    redirect(`/obras${query}`);
  }

  notFound();
}
