import { redirect } from "next/navigation";

export default async function IlustracionBasePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: "stock" | "catalogo" | "portfolio" }>;
}) {
  const { tab = "stock" } = await searchParams;
  if (tab === "catalogo" || tab === "portfolio" || tab === "stock") {
    redirect(`/ilustracion/${tab}`);
  }
  redirect("/ilustracion/stock");
}
