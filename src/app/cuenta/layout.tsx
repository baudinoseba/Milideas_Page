import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPerfil, getConfiguracionSitio } from "@/lib/supabase/queries";
import { CuentaHeader } from "@/components/cuenta/cuenta-header";
import { CartHydration } from "@/hooks/use-cart-hydration";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { CartToast } from "@/components/cart/cart-toast";

export default async function CuentaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/cuenta/perfil");

  const [perfil, config] = await Promise.all([
    getPerfil(user.id),
    getConfiguracionSitio().catch(() => null),
  ]);

  return (
    <div className="min-h-screen bg-[#FAF7F2]/40 text-stone-900 flex flex-col">
      <CartHydration />
      <CuentaHeader
        userEmail={user.email ?? ""}
        userName={perfil?.nombre_completo ?? user.user_metadata?.nombre_completo}
        isAdmin={!!perfil?.es_admin}
        logoUrl={config?.logo_url ?? null}
      />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
      <CartDrawer />
      <CartToast />
    </div>
  );
}
