import { redirect } from "next/navigation";

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria } = await searchParams;
  if (categoria) {
    redirect(`/catalogo/ceramica?categoria=${categoria}`);
  }
  redirect("/catalogo/ceramica");
}
