import { redirect } from "next/navigation";

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria } = await searchParams;
  if (categoria) {
    redirect(`/ceramica/catalogo?categoria=${categoria}`);
  }
  redirect("/ceramica/catalogo");
}
