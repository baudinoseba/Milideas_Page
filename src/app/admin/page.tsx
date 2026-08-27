import Link from "next/link";
import { getAdminStats } from "@/lib/supabase/queries";
import { formatPrecio } from "@/lib/pricing";

export const metadata = { title: "Admin — Dashboard de Control" };

export default async function AdminDashboardPage() {
  const stats = await getAdminStats().catch(() => ({
    pedidosPendientes: 0,
    pedidosConfirmados: 0,
    stockBajo: 0,
    totalProductosActivos: 0,
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
            Métricas operativas en tiempo real, transferencias por conciliar y estado del taller.
          </p>
        </div>
      </div>

      {/* ─── 1. MÉTRICAS CLAVE CON NÚMEROS Y PRIORIDADES DE COLOR ─── */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-barro font-sans flex items-center gap-1.5">
          <span>⚡</span> Prioridades Operativas del Día
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          
          {/* Card 1: Pagos por revisar */}
          <Link
            href="/admin/pedidos?estado=pendiente_pago"
            className={`rounded-2xl sm:rounded-3xl border p-4 sm:p-5 shadow-xs transition-all flex flex-col justify-between ${
              pedidosDemorados.length > 0
                ? "bg-red-50/95 border-red-300 text-red-950 dark:bg-red-950/60 dark:border-red-800 dark:text-red-100 hover:border-red-500 ring-2 ring-red-400/40"
                : stats.pedidosPendientes > 0
                  ? "bg-amber-50/90 border-amber-300 text-amber-950 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-100 hover:border-amber-500"
                  : "bg-surface border-border/70 hover:border-terracota/40 text-chocolate"
            }`}
          >
            <div>
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>Pagos por revisar</span>
                <span className="text-base">{pedidosDemorados.length > 0 ? "🚨" : "💳"}</span>
              </div>
              <p className="mt-2 text-3xl sm:text-4xl font-bold font-mono">
                {stats.pedidosPendientes}
              </p>
            </div>
            <p className="text-[11px] mt-2 font-medium">
              {pedidosDemorados.length > 0
                ? `⚠️ ${pedidosDemorados.length} demorado(s) >48hs`
                : stats.pedidosPendientes > 0
                  ? "Transferencias a verificar"
                  : "✓ Todo al día"}
            </p>
          </Link>

          {/* Card 2: Listos para despacho */}
          <Link
            href="/admin/pedidos?estado=confirmado"
            className={`rounded-2xl sm:rounded-3xl border p-4 sm:p-5 shadow-xs transition-all flex flex-col justify-between ${
              stats.pedidosConfirmados > 0
                ? "bg-emerald-50/90 border-emerald-300 text-emerald-950 hover:border-emerald-500 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-100"
                : "bg-surface border-border/70 hover:border-terracota/40 text-chocolate"
            }`}
          >
            <div>
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>Listos para despacho</span>
                <span className="text-base">📦</span>
              </div>
              <p className="mt-2 text-3xl sm:text-4xl font-bold font-mono text-emerald-900 dark:text-emerald-200">
                {stats.pedidosConfirmados}
              </p>
            </div>
            <p className="text-[11px] mt-2 font-medium text-emerald-800 dark:text-emerald-300">
              {stats.pedidosConfirmados > 0
                ? "Empacar y coordinar envío"
                : "Sin pedidos pendientes de envío"}
            </p>
          </Link>

          {/* Card 3: Encargos a Medida en Taller */}
          <Link
            href="/admin/encargos"
            className={`rounded-2xl sm:rounded-3xl border p-4 sm:p-5 shadow-xs transition-all flex flex-col justify-between ${
              stats.encargosPendientes > 0
                ? "bg-amber-50/80 border-amber-300/80 text-amber-950 hover:border-amber-500 dark:bg-amber-950/50 dark:border-amber-800"
                : "bg-surface border-border/70 hover:border-terracota/40 text-chocolate"
            }`}
          >
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-chocolate">
                <span>Encargos a Medida</span>
                <span className="text-base">📝</span>
              </div>
              <p className="mt-2 text-3xl sm:text-4xl font-bold font-mono text-chocolate">
                {stats.encargosPendientes}
              </p>
            </div>
            <p className="text-[11px] text-muted mt-2 font-medium">
              {stats.encargosPendientes > 0
                ? "Solicitudes de clientes a presupuestar"
                : "Taller al día"}
            </p>
          </Link>

          {/* Card 4: Stock Crítico / Agotado */}
          <Link
            href="/admin/ceramica"
            className={`rounded-2xl sm:rounded-3xl border p-4 sm:p-5 shadow-xs transition-all flex flex-col justify-between ${
              stats.stockBajo > 0
                ? "bg-rose-50/80 border-rose-300/80 text-rose-950 hover:border-rose-500 dark:bg-rose-950/50 dark:border-rose-800"
                : "bg-surface border-border/70 hover:border-terracota/40 text-chocolate"
            }`}
          >
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-chocolate">
                <span>Stock Crítico / Agotado</span>
                <span className="text-base">⚠️</span>
              </div>
              <p className="mt-2 text-3xl sm:text-4xl font-bold font-mono text-rose-900 dark:text-rose-200">
                {stats.stockBajo}
              </p>
            </div>
            <p className="text-[11px] text-rose-800 dark:text-rose-300 mt-2 font-medium">
              {stats.stockBajo > 0
                ? "Piezas con 0 o 1 unidad disponible"
                : "Inventario saludable"}
            </p>
          </Link>

        </div>
      </section>

      {/* ─── 2. PEDIDOS RECIENTES CON DETALLE REAL ─── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-barro font-sans flex items-center gap-1.5">
              <span>🛒</span> Pedidos Recientes de la Tienda
            </h2>
            <p className="text-[11px] text-muted font-sans mt-0.5">
              Control de comprobantes de pago y estado de entrega.
            </p>
          </div>
          <Link
            href="/admin/pedidos"
            className="text-xs font-semibold text-terracota hover:underline font-sans"
          >
            Ver todos los pedidos →
          </Link>
        </div>

        {stats.ultimosPedidos.length === 0 ? (
          <div className="rounded-2xl border border-border/60 bg-arena/20 p-8 text-center text-xs text-muted">
            <p className="text-2xl mb-1">📦</p>
            <p className="font-semibold text-chocolate">No hay pedidos registrados recientemente.</p>
          </div>
        ) : (
          <div className="rounded-2xl sm:rounded-3xl border border-border/60 bg-surface divide-y divide-border/40 shadow-xs overflow-hidden">
            {stats.ultimosPedidos.slice(0, 6).map((pedido: any) => {
              const diffMs = ahora - new Date(pedido.created_at).getTime();
              const esDemorado = pedido.estado === "pendiente_pago" && diffMs > DOS_DIAS_MS;
              const dias = Math.floor(diffMs / (24 * 60 * 60 * 1000));
              const itemsNombres =
                pedido.items_pedido?.map((it: any) => it.productos?.nombre || "Pieza").join(", ") ||
                "Pieza de catálogo";

              return (
                <div
                  key={pedido.id}
                  className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 transition-colors ${
                    esDemorado
                      ? "bg-red-50/70 dark:bg-red-950/30 hover:bg-red-100/70"
                      : "hover:bg-arena/10"
                  }`}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs sm:text-sm font-semibold text-chocolate">
                        {pedido.nombre_contacto || "Cliente"}
                      </p>
                      
                      {/* Badge de Estado Claro */}
                      {pedido.estado === "pendiente_pago" ? (
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            esDemorado
                              ? "bg-red-600 text-white shadow-xs animate-pulse"
                              : "bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-900/60 dark:text-amber-100"
                          }`}
                        >
                          {esDemorado ? `🚨 Sin pagar (${dias} días)` : "⏳ Esperando Pago"}
                        </span>
                      ) : pedido.estado === "confirmado" || pedido.estado === "enviado" ? (
                        <span className="rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-900/60 dark:text-emerald-100 px-2.5 py-0.5 text-[11px] font-bold">
                          ✓ {pedido.estado === "confirmado" ? "Listo para Despacho" : "Enviado"}
                        </span>
                      ) : (
                        <span className="rounded-full bg-secondary/80 text-chocolate px-2.5 py-0.5 text-[10px] font-medium">
                          {pedido.estado}
                        </span>
                      )}

                      {pedido.metodo_pago && (
                        <span className="text-[10px] text-muted font-sans uppercase">
                          ({pedido.metodo_pago})
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-barro truncate font-medium">
                      🛍️ {itemsNombres}
                    </p>

                    <p className="text-[11px] text-muted font-sans">
                      {new Date(pedido.created_at).toLocaleDateString("es-AR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                    <span className="text-xs sm:text-sm font-mono font-bold text-chocolate">
                      {formatPrecio(pedido.total)}
                    </span>
                    <Link
                      href={`/admin/pedidos/${pedido.id}`}
                      className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs text-chocolate hover:bg-secondary/40 font-semibold shadow-2xs cursor-pointer"
                    >
                      Gestionar →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ─── 3. ENCARGOS A MEDIDA RECIENTES DEL TALLER ─── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-barro font-sans flex items-center gap-1.5">
              <span>🎨</span> Encargos Especiales & Personalizados
            </h2>
            <p className="text-[11px] text-muted font-sans mt-0.5">
              Solicitudes de clientes para piezas únicas o proyectos a medida.
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
          <div className="rounded-2xl border border-border/60 bg-arena/20 p-8 text-center text-xs text-muted">
            <p className="text-2xl mb-1">✨</p>
            <p className="font-semibold text-chocolate">No hay encargos a medida pendientes en este momento.</p>
          </div>
        ) : (
          <div className="rounded-2xl sm:rounded-3xl border border-border/60 bg-surface divide-y divide-border/40 shadow-xs overflow-hidden">
            {stats.ultimosEncargos.map((enc: any) => (
              <div
                key={enc.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 hover:bg-arena/10 transition-colors"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs sm:text-sm font-semibold text-chocolate">
                      {enc.nombre_contacto || "Cliente"}
                    </p>
                    <span className="rounded-full bg-arena/60 border border-border/60 px-2 py-0.5 text-[10px] font-semibold text-barro">
                      {enc.tipo_encargo || "Personalizado"}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        enc.estado === "pendiente"
                          ? "bg-amber-100 text-amber-900 border border-amber-300"
                          : enc.estado === "en_produccion"
                            ? "bg-sky-100 text-sky-900 border border-sky-300"
                            : "bg-emerald-100 text-emerald-900 border border-emerald-300"
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
