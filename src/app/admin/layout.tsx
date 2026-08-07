import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isUserAdmin, getPerfil, getAdminStats } from "@/lib/supabase/queries";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

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

  const perfil = await getPerfil(user.id);
  const stats = await getAdminStats().catch(() => ({
    pedidosPendientes: 0,
    stockBajo: 0,
    pedidosConfirmados: 0,
    totalProductosActivos: 0,
    ultimosPedidos: [],
  }));

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar
        nombreAdmin={perfil?.nombre_completo ?? user.email ?? "Admin"}
        pedidosPendientes={stats.pedidosPendientes}
      />

      {/* Main content — offset by sidebar on desktop */}
      <div className="lg:pl-64">
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
