import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CartHydration } from "@/hooks/use-cart-hydration";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { CartToast } from "@/components/cart/cart-toast";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <CartHydration />
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-3.5 py-6 sm:px-6 sm:py-8 overflow-x-hidden">
        {children}
      </main>
      <Footer />
      <CartDrawer />
      <CartToast />
    </>
  );
}
