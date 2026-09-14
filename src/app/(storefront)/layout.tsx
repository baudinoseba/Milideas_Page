import { Suspense } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CartHydration } from "@/hooks/use-cart-hydration";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { CartToast } from "@/components/cart/cart-toast";
import { AuthWelcomeToast } from "@/components/layout/auth-welcome-toast";
import { RealtimeStockSync } from "@/components/providers/realtime-stock-sync";
import { StorefrontMain } from "@/components/layout/storefront-main";
import { getConfiguracionSitio } from "@/lib/supabase/queries";
import { TiendaStatusSync } from "@/components/storefront/tienda-status-sync";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = await getConfiguracionSitio().catch(() => null);

  const initialStatus = {
    stockCeramicaAbierto: config?.stock_ceramica_abierto ?? true,
    encargosCeramicaAbiertos: config?.encargos_ceramica_abiertos ?? true,
    stockIlustracionAbierto: config?.stock_ilustracion_abierto ?? true,
    encargosIlustracionAbiertos: config?.encargos_ilustracion_abiertos ?? true,
  };

  return (
    <>
      <TiendaStatusSync initialStatus={initialStatus} />
      <CartHydration />
      <Header />
      <Suspense fallback={null}>
        <AuthWelcomeToast />
      </Suspense>
      <StorefrontMain>{children}</StorefrontMain>
      <Footer />
      <CartDrawer />
      <CartToast />
      <RealtimeStockSync />
    </>
  );
}

