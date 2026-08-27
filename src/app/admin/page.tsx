import Link from "next/link";
import { getAdminStats, getFormatosCatalogo, getObrasProyectos } from "@/lib/supabase/queries";
import { formatPrecio } from "@/lib/pricing";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Admin — Dashboard de Control" };

export default async function AdminDashboardPage() {
  const [stats, formatosCeramica, formatosIlustracion, obras] = await Promise.all([
    getAdminStats().catch(() => ({
      pedidosPendientes: 0,
      pedidosConfirmados: 0,
      stockBajo: 0,
      totalProductosActivos: 0,
      ultimosPedidos: [],
    })),
    getFormatosCatalogo("ceramica").catch(() => []),
    getFormatosCatalogo("ilustracion").catch(() => []),
    getObrasProyectos({}).catch(() => []),
  ]);

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
      
      {/* ─── Encabezado de Bienvenida ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/60 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-chocolate">
            Panel de Control · Milideas
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-muted font-sans">
            Centro operativo para gestión de ventas, catálogo, stock y proyectos especiales.
          </p>
        </div>

        <Link
          href="/"
          target="_blank"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-semibold text-chocolate hover:bg-secondary/40 shadow-xs self-start sm:self-auto"
        >
          <span>👁️ Ver Tienda Online</span>
          <span className="text-[10px] text-terracota">↗</span>
        </Link>
      </div>

      {/* ─── 1. ALERTAS OPERATIVAS & PAGOS PENDIENTES (PRIORIDAD ALTA) ─── */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-barro font-sans flex items-center gap-1.5">
          <span>⚡</span> Prioridades Operativas
        </h2>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          
          {/* Alerta de Pagos Pendientes (Con alerta roja si hay pedidos de >48hs) */}
          <Link
            href="/admin/pedidos?estado=pendiente_pago"
            className={`rounded-2xl sm:rounded-3xl border p-4 sm:p-5 shadow-xs transition-all flex flex-col justify-between ${
              pedidosDemorados.length > 0
                ? "bg-red-50/90 border-red-300 text-red-900 dark:bg-red-950/60 dark:border-red-800 dark:text-red-100 hover:border-red-500 ring-2 ring-red-400/30"
                : stats.pedidosPendientes > 0
                  ? "bg-amber-50/90 border-amber-300 text-amber-900 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-100 hover:border-amber-500"
                  : "bg-surface border-border/70 hover:border-terracota/40 text-chocolate"
            }`}
          >
            <div>
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>Pagos por revisar</span>
                <span>{pedidosDemorados.length > 0 ? "🚨" : "💳"}</span>
              </div>
              <p className="mt-2 text-2xl sm:text-3xl font-bold font-mono">
                {stats.pedidosPendientes}
              </p>
            </div>
            <p className="text-[11px] mt-1 font-medium opacity-90">
              {pedidosDemorados.length > 0
                ? `⚠️ ${pedidosDemorados.length} con más de 48hs`
                : "Transferencias a verificar"}
            </p>
          </Link>

          {/* Pedidos Confirmados */}
          <Link
            href="/admin/pedidos"
            className="rounded-2xl sm:rounded-3xl border border-emerald-300/80 bg-emerald-50/70 p-4 sm:p-5 shadow-xs transition-all hover:border-emerald-500 dark:bg-emerald-950/50 dark:border-emerald-800 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                <span>Listos para despacho</span>
                <span>📦</span>
              </div>
              <p className="mt-2 text-2xl sm:text-3xl font-bold font-mono text-emerald-950 dark:text-emerald-100">
                {stats.pedidosConfirmados}
              </p>
            </div>
            <p className="text-[11px] text-emerald-800 dark:text-emerald-300 mt-1 font-medium">
              Empaque y envío seguro
            </p>
          </Link>

          {/* Encargos a Medida */}
          <Link
            href="/admin/encargos"
            className="rounded-2xl sm:rounded-3xl border border-border/70 bg-surface p-4 sm:p-5 shadow-xs hover:border-terracota/40 transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-chocolate">
                <span>Encargos a medida</span>
                <span>📝</span>
              </div>
              <p className="mt-2 text-2xl sm:text-3xl font-bold font-mono text-chocolate">
                Taller
              </p>
            </div>
            <p className="text-[11px] text-muted mt-1">Piezas personalizadas</p>
          </Link>

          {/* Zonas de Envío */}
          <Link
            href="/admin/logistica"
            className="rounded-2xl sm:rounded-3xl border border-border/70 bg-surface p-4 sm:p-5 shadow-xs hover:border-terracota/40 transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-chocolate">
                <span>Logística & Envíos</span>
                <span>🚚</span>
              </div>
              <p className="mt-2 text-2xl sm:text-3xl font-bold font-mono text-chocolate">
                Tarifas
              </p>
            </div>
            <p className="text-[11px] text-muted mt-1">Configurar envíos nacionales</p>
          </Link>

        </div>
      </section>

      {/* ─── 2. LOS 3 PILARES CREATIVOS ─── */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-barro font-sans flex items-center gap-1.5">
          <span>🎨</span> Disciplinas & Producción Artística
        </h2>

        <div className="grid gap-4 sm:grid-cols-3">
          {/* Cerámica */}
          <Link
            href="/admin/ceramica"
            className="group rounded-2xl sm:rounded-3xl border border-border/70 bg-gradient-to-br from-surface via-surface to-arena/30 p-5 shadow-xs transition-all hover:shadow-md hover:border-terracota/50 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <span className="text-3xl">🏺</span>
              <h3 className="text-base font-serif font-semibold text-chocolate group-hover:text-terracota transition-colors">
                Cerámica de Autor
              </h3>
              <p className="text-xs text-barro font-sans leading-relaxed">
                Catálogo de 45 formatos con aumento de precios % masivo, stock en drops y álbumes de portfolio.
              </p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs font-semibold text-terracota">
              <span>{formatosCeramica.length} formatos activos</span>
              <span>Administrar →</span>
            </div>
          </Link>

          {/* Ilustración */}
          <Link
            href="/admin/ilustracion"
            className="group rounded-2xl sm:rounded-3xl border border-border/70 bg-gradient-to-br from-surface via-surface to-rosa-buho/15 p-5 shadow-xs transition-all hover:shadow-md hover:border-rosa-buho/50 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <span className="text-3xl">🎨</span>
              <h3 className="text-base font-serif font-semibold text-chocolate group-hover:text-terracota transition-colors">
                Ilustraciones
              </h3>
              <p className="text-xs text-barro font-sans leading-relaxed">
                Láminas A4/A3, cuadros enmarcados, stock disponible y portfolio botánico/animal.
              </p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs font-semibold text-terracota">
              <span>{formatosIlustracion.length} formatos activos</span>
              <span>Administrar →</span>
            </div>
          </Link>

          {/* Obras y Proyectos */}
          <Link
            href="/admin/obras"
            className="group rounded-2xl sm:rounded-3xl border border-border/70 bg-gradient-to-br from-surface via-surface to-secondary/30 p-5 shadow-xs transition-all hover:shadow-md hover:border-terracota/50 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <span className="text-3xl">🌟</span>
              <h3 className="text-base font-serif font-semibold text-chocolate group-hover:text-terracota transition-colors">
                Obras & Proyectos
              </h3>
              <p className="text-xs text-barro font-sans leading-relaxed">
                Murales, vidrieras, esculturas 3D de mascotas, producciones para marcas y gastronomía.
              </p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs font-semibold text-terracota">
              <span>{obras.length} proyectos registrados</span>
              <span>Administrar →</span>
            </div>
          </Link>
        </div>
      </section>

      {/* ─── 3. ÚLTIMOS PEDIDOS & ESTADOS DE PAGO VISUALES ─── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-barro font-sans flex items-center gap-1.5">
            <span>📋</span> Últimos Pedidos Recibidos
          </h2>
          <Link
            href="/admin/pedidos"
            className="text-xs font-semibold text-terracota hover:underline font-sans"
          >
            Ver todos los pedidos →
          </Link>
        </div>

        {stats.ultimosPedidos.length === 0 ? (
          <div className="rounded-2xl border border-border/60 bg-arena/20 p-6 text-center text-xs text-muted">
            No hay pedidos registrados recientemente.
          </div>
        ) : (
          <div className="rounded-2xl sm:rounded-3xl border border-border/60 bg-surface divide-y divide-border/40 shadow-xs overflow-hidden">
            {stats.ultimosPedidos.slice(0, 6).map((pedido: any) => {
              const diffMs = ahora - new Date(pedido.created_at).getTime();
              const esDemorado = pedido.estado === "pendiente_pago" && diffMs > DOS_DIAS_MS;
              const dias = Math.floor(diffMs / (24 * 60 * 60 * 1000));

              return (
                <div
                  key={pedido.id}
                  className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 transition-colors ${
                    esDemorado
                      ? "bg-red-50/70 dark:bg-red-950/30 hover:bg-red-100/70"
                      : "hover:bg-arena/10"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs sm:text-sm font-semibold text-chocolate">
                        {pedido.nombre_contacto || "Cliente"}
                      </p>
                      
                      {/* Badges de Estado con Colores Contrastados */}
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
                          ✓ {pedido.estado === "confirmado" ? "Confirmado" : "Enviado"}
                        </span>
                      ) : (
                        <Badge variant="default" className="text-[10px]">
                          {pedido.estado}
                        </Badge>
                      )}

                      {pedido.metodo_pago && (
                        <span className="text-[10px] text-muted font-sans uppercase">
                          ({pedido.metodo_pago})
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-muted">
                      {new Date(pedido.created_at).toLocaleDateString("es-AR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })} · {pedido.pedido_items?.length || 1} pieza(s)
                    </p>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <span className="text-xs sm:text-sm font-mono font-bold text-chocolate">
                      {formatPrecio(pedido.total)}
                    </span>
                    <Link
                      href={`/admin/pedidos/${pedido.id}`}
                      className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs text-chocolate hover:bg-secondary/40 font-medium shadow-2xs"
                    >
                      Ver detalle →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
}
