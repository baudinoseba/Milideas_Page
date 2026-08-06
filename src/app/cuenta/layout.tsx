import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logoutAction } from "@/lib/actions";

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

  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-lg font-medium">
            Milideas
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/cuenta/perfil">Perfil</Link>
            <Link href="/cuenta/pedidos">Pedidos</Link>
            <form action={logoutAction}>
              <button type="submit" className="text-muted hover:text-foreground">
                Salir
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
