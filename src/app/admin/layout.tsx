import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isUserAdmin } from "@/lib/supabase/queries";
import { logoutAction } from "@/lib/actions";

const adminLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/categorias", label: "Categorías" },
  { href: "/admin/logistica", label: "Logística" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/admin");
  const admin = await isUserAdmin(user.id);
  if (!admin) redirect("/");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/admin" className="text-lg font-medium">
            Milideas Admin
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-muted hover:text-foreground">
              Tienda
            </Link>
            <form action={logoutAction}>
              <button type="submit" className="text-sm text-muted hover:text-foreground">
                Salir
              </button>
            </form>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-4 overflow-x-auto px-4 pb-3 sm:px-6">
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="shrink-0 text-sm text-muted hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
