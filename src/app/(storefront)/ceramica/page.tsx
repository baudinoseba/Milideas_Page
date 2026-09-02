import { redirect } from "next/navigation";

export default async function CeramicaBasePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: "stock" | "catalogo" | "portfolio" }>;
}) {
  const { tab = "stock" } = await searchParams;
  if (tab === "catalogo" || tab === "portfolio" || tab === "stock") {
    redirect(`/ceramica/${tab}`);
  }
  redirect("/ceramica/stock");
}
