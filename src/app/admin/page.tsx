import Link from "next/link";
import { getAdminStats } from "@/lib/supabase/queries";
import { DashboardPedidosList } from "@/components/admin/dashboard-pedidos-list";

export const metadata = { title: "Admin — Dashboard de Control" };

export default async function AdminDashboardPage() {
  const stats = await getAdminStats().catch(() => ({
    pedidosPendientes: 0,
    pedidosConfirmados: 0,
    pedidosRetiroTaller: 0,
    pedidosEnvioDomicilio: 0,
    totalStockPiezas: 0,
    encargosPendientes: 0,
    ultimosPedidos: [],
    ultimosEncargos: [],
  }));

  const ahora = Date.now();
  const DOS_DIAS_MS = 48 * 60 * 60 * 1000;

  // Detectar cuántos pedidos pendientes tienen más de 48hs
  const pedidosDemorados = stats.ultimosPedidos.filter((p: any) => {
    if (p.estado !== "pendiente_pago") return false;
    const diff = ahora - new Date(p.created_at).getTime();
    return diff > DOS_DIAS_MS;
  });

  return (
    <div className="space-y-8 pb-12">
      
      {/* ─── Encabezado Limpio del Panel ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-chocolate">
            Panel de Control · Milideas
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-muted font-sans">
            Métricas operativas en tiempo real, conciliación de pagos y estado del taller.
          </p>
        </div>
      </div>

      {/* ─── 1. MÉTRICAS CLAVE CON FONDOS PASTEL SUAVES Y NÚMEROS ELEGANTES ─── */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-barro font-sans flex items-center gap-1.5">
          <span>⚡</span> Resumen Operativo
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          
          {/* Card 1: Pagos por revisar */}
          <Link
            href="/admin/pedidos?estado=pendiente_pago"
            className="rounded-3xl border border-[#E8DAB2] bg-[#FDF8EC] p-4 sm:p-5 shadow-2xs transition-all hover:shadow-xs hover:border-[#D6C291] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-[#6E4F1A]">
                <span>Pagos por revisar</span>
                <span>💳</span>
              </div>
              <p className="mt-2 text-3xl sm:text-4xl font-bold font-mono text-[#B35436]">
                {stats.pedidosPendientes}
              </p>
            </div>
            <div className="mt-2">
              {pedidosDemorados.length > 0 ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-full">
                  ⚠️ {pedidosDemorados.length} con más de 48hs
                </span>
              ) : (
                <p className="text-[11px] text-[#8C6D34] font-medium">
                  {stats.pedidosPendientes > 0 ? "Transferencias a conciliar" : "✓ Todo al día"}
                </p>
              )}
            </div>
          </Link>

          {/* Card 2: Listos para despacho / retiro */}
          <Link
            href="/admin/pedidos?estado=confirmado"
            className="rounded-3xl border border-[#C6E4D2] bg-[#EFF8F2] p-4 sm:p-5 shadow-2xs transition-all hover:shadow-xs hover:border-[#A4D4B6] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-[#205C33]">
                <span>Listos para entrega</span>
                <span>📦</span>
              </div>
              <p className="mt-2 text-3xl sm:text-4xl font-bold font-mono text-[#1E6838]">
                {stats.pedidosConfirmados}
              </p>
            </div>
            <p className="text-[11px] text-[#2D7344] mt-2 font-medium">
              {stats.pedidosConfirmados > 0
                ? `${stats.pedidosEnvioDomicilio} por correo · ${stats.pedidosRetiroTaller} en taller`
                : "Sin pedidos por entregar"}
            </p>
          </Link>

          {/* Card 3: Encargos a Medida en Taller */}
          <Link
            href="/admin/encargos"
            className="rounded-3xl border border-[#E0D2EC] bg-[#F7F2FA] p-4 sm:p-5 shadow-2xs transition-all hover:shadow-xs hover:border-[#CBB7DD] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-[#54366C]">
                <span>Encargos a Medida</span>
                <span>📝</span>
              </div>
              <p className="mt-2 text-3xl sm:text-4xl font-bold font-mono text-[#5C347A]">
                {stats.encargosPendientes}
              </p>
            </div>
            <p className="text-[11px] text-[#694883] mt-2 font-medium">
              {stats.encargosPendientes > 0
                ? "Solicitudes por presupuestar"
                : "Taller al día"}
            </p>
          </Link>

          {/* Card 4: Stock Total Disponible en Tienda */}
          <Link
            href="/admin/ceramica"
            className="rounded-3xl border border-[#CDE3EC] bg-[#F0F7FA] p-4 sm:p-5 shadow-2xs transition-all hover:shadow-xs hover:border-[#B2D5E3] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-[#2C5F74]">
                <span>Stock en Tienda</span>
                <span>🏺</span>
              </div>
              <p className="mt-2 text-3xl sm:text-4xl font-bold font-mono text-[#24596F]">
                {stats.totalStockPiezas}
              </p>
            </div>
            <p className="text-[11px] text-[#366B80] mt-2 font-medium">
              Unidades listas para entrega
            </p>
          </Link>

        </div>
      </section>

      {/* ─── 2. PEDIDOS RECIENTES CON DETALLE REAL Y ACCIONES RÁPIDAS ─── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-barro font-sans flex items-center gap-1.5">
              <span>🛒</span> Pedidos Recientes de la Tienda
            </h2>
            <p className="text-[11px] text-muted font-sans mt-0.5">
              Revisá comprobantes de transferencia y gestioná despachos o retiros en el taller.
            </p>
          </div>
          <Link
            href="/admin/pedidos"
            className="text-xs font-semibold text-terracota hover:underline font-sans"
          >
            Ver todos los pedidos →
          </Link>
        </div>

        <DashboardPedidosList pedidos={stats.ultimosPedidos} />
      </section>

      {/* ─── 3. ENCARGOS A MEDIDA RECIENTES DEL TALLER ─── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-barro font-sans flex items-center gap-1.5">
              <span>🎨</span> Encargos Especiales & Personalizados
            </h2>
            <p className="text-[11px] text-muted font-sans mt-0.5">
              Solicitudes de clientes para piezas personalizadas y proyectos a medida.
            </p>
          </div>
          <Link
            href="/admin/encargos"
            className="text-xs font-semibold text-terracota hover:underline font-sans"
          >
            Ver todos los encargos →
          </Link>
        </div>

        {stats.ultimosEncargos.length === 0 ? (
          <div className="rounded-3xl border border-border/60 bg-arena/20 p-8 text-center text-xs text-muted">
            <p className="text-2xl mb-1">✨</p>
            <p className="font-semibold text-chocolate">No hay encargos a medida pendientes en este momento.</p>
          </div>
        ) : (
          <div className="rounded-3xl border border-border/60 bg-surface divide-y divide-border/40 shadow-xs overflow-hidden">
            {stats.ultimosEncargos.map((enc: any) => (
              <div
                key={enc.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 sm:p-5 hover:bg-arena/10 transition-colors"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs sm:text-sm font-semibold text-chocolate">
                      {enc.nombre_contacto || "Cliente"}
                    </p>
                    <span className="rounded-full bg-arena/60 border border-border/60 px-2.5 py-0.5 text-[10px] font-semibold text-barro">
                      {enc.tipo_encargo || "Personalizado"}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        enc.estado === "pendiente"
                          ? "bg-amber-100 text-amber-950 border border-amber-300"
                          : enc.estado === "en_produccion"
                            ? "bg-sky-100 text-sky-950 border border-sky-300"
                            : "bg-emerald-100 text-emerald-950 border border-emerald-300"
                      }`}
                    >
                      {enc.estado === "pendiente"
                        ? "⏳ Pendiente"
                        : enc.estado === "en_produccion"
                          ? "🛠️ En Producción"
                          : "✓ Listo"}
                    </span>
                  </div>

                  {enc.descripcion_idea && (
                    <p className="text-xs text-barro truncate">
                      {enc.descripcion_idea}
                    </p>
                  )}

                  <p className="text-[11px] text-muted font-sans">
                    {new Date(enc.created_at).toLocaleDateString("es-AR", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                  <Link
                    href={`/admin/encargos/${enc.id}`}
                    className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs text-chocolate hover:bg-secondary/40 font-semibold shadow-2xs"
                  >
                    Ver detalle →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
