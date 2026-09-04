import { Suspense } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CartHydration } from "@/hooks/use-cart-hydration";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { CartToast } from "@/components/cart/cart-toast";
import { AuthWelcomeToast } from "@/components/layout/auth-welcome-toast";
import { RealtimeStockSync } from "@/components/providers/realtime-stock-sync";

import { StorefrontMain } from "@/components/layout/storefront-main";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
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
