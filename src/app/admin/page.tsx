import Link from "next/link";
import {
  getProductos,
  getFormatosCatalogo,
  getEncargos,
  getAdminPedidos,
} from "@/lib/supabase/queries";
import type { Encargo } from "@/types";

export const metadata = { title: "Panel de Control · Milideas" };

function isEncargoEntregado(encargo: Encargo): boolean {
  if (encargo.estado === "entregado") return true;
  if (!encargo.notas_admin) return false;
  try {
    const meta = JSON.parse(encargo.notas_admin);
    return meta?.archivado === true || meta?.entregado === true;
  } catch {
    return false;
  }
}

export default async function AdminDashboardPage() {
  // Cargar datos en paralelo para todas las secciones
  const [
    productos,
    formatosCeramica,
    formatosIlustracion,
    encargos,
    pedidos,
  ] = await Promise.all([
    getProductos({ includeInactive: true }).catch(() => []),
    getFormatosCatalogo("ceramica").catch(() => []),
    getFormatosCatalogo("ilustracion").catch(() => []),
    getEncargos().catch(() => []),
    getAdminPedidos().catch(() => []),
  ]);

  // ─── 1. MÉTRICAS DE ENCARGOS ───
  let encargosPendientes = 0;
  let encargosEsperaSena = 0;
  let encargosEnTaller = 0;
  let encargosListosSaldo = 0;

  for (const e of encargos) {
    if (isEncargoEntregado(e) || e.estado === "rechazado" || e.estado === "cancelado") continue;
    if (e.estado === "pendiente") encargosPendientes++;
    else if (e.estado === "aceptado") encargosEsperaSena++;
    else if (e.estado === "en_proceso") encargosEnTaller++;
    else if (e.estado === "listo") encargosListosSaldo++;
  }

  // ─── 2. MÉTRICAS DE GESTIÓN DE STOCK DE LA TIENDA (PEDIDOS/DESPACHOS) ───
  let pedidosPendientesPago = 0;
  let pedidosListosEnvio = 0;
  let pedidosListosRetiro = 0;
  let pedidosEntregados = 0;

  for (const p of pedidos) {
    const isRetiro =
      String(p.tipo_envio || "").toLowerCase().includes("retiro") ||
      Number(p.costo_envio || 0) === 0;

    if (p.estado === "pendiente_pago") {
      pedidosPendientesPago++;
    } else if (p.estado === "confirmado") {
      if (isRetiro) pedidosListosRetiro++;
      else pedidosListosEnvio++;
    } else if (p.estado === "enviado") {
      pedidosEntregados++;
    }
  }

  // ─── 3. MÉTRICAS DE STOCK TIENDA GENERAL ───
  const stockEnTienda = productos.filter((p) => p.activo && p.stock_disponible > 0).length;
  const stockBorradores = productos.filter((p) => !p.activo).length;
  const stockAgotados = productos.filter((p) => p.activo && p.stock_disponible <= 0).length;
  const stockTotalCatalogo = productos.length;

  // ─── 4. MÉTRICAS DE CERÁMICA ───
  const prodsCeramica = productos.filter((p) => p.tipo_catalogo === "ceramica");
  const ceramicaPublicadas = prodsCeramica.filter((p) => p.activo).length;
  const ceramicaBorradores = prodsCeramica.filter((p) => !p.activo).length;
  const ceramicaColecciones = new Set(
    prodsCeramica.map((p) => p.producciones?.nombre).filter(Boolean)
  ).size;
  const ceramicaCatalogo = formatosCeramica.length;

  // ─── 5. MÉTRICAS DE ILUSTRACIÓN ───
  const prodsIlustracion = productos.filter((p) => p.tipo_catalogo === "ilustraciones");
  const ilustracionPublicadas = prodsIlustracion.filter((p) => p.activo).length;
  const ilustracionBorradores = prodsIlustracion.filter((p) => !p.activo).length;
  const ilustracionColecciones = new Set(
    prodsIlustracion.map((p) => p.producciones?.nombre).filter(Boolean)
  ).size;
  const ilustracionCatalogo = formatosIlustracion.length;

  return (
    <div className="space-y-4 pb-10">
      {/* ─── Encabezado Principal ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 border-b border-border/60 pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-chocolate">
            Panel de Control
          </h1>
          <p className="text-xs text-stone-600 font-sans">
            Visión global del taller, stock en tienda, encargos y pedidos.
          </p>
        </div>
      </div>

      <div className="space-y-3.5">
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* ─── 1. GESTIÓN DE ENCARGOS ─── */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <section className="p-3.5 sm:p-4 rounded-2xl bg-[#FAF7F2]/75 border border-[#E5E0D8] space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">📝</span>
              <h2 className="text-sm sm:text-base font-serif font-bold text-chocolate">
                Gestión de Encargos
              </h2>
            </div>
            <Link
              href="/admin/encargos"
              className="text-[11px] font-bold text-chocolate hover:text-emerald-800 transition-colors flex items-center gap-1 group"
            >
              <span>Gestionar Encargos</span>
              <span className="group-hover:translate-x-0.5 transition-transform">→</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <Link
              href="/admin/encargos"
              className="p-2.5 sm:p-3 rounded-xl border-2 bg-[#FFFBEB] border-amber-300 hover:border-amber-500 text-left transition-all hover:shadow-xs cursor-pointer block"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black tracking-tight text-stone-900">
                  1. Pendientes
                </span>
                <span className="text-xs">⏳</span>
              </div>
              <p className="text-xl sm:text-2xl font-black font-sans mt-0.5 text-chocolate">
                {encargosPendientes}
              </p>
              <p className="text-[10px] font-semibold text-stone-700 truncate">
                Aceptar o rechazar
              </p>
            </Link>

            <Link
              href="/admin/encargos"
              className="p-2.5 sm:p-3 rounded-xl border-2 bg-[#F0F9FF] border-sky-300 hover:border-sky-500 text-left transition-all hover:shadow-xs cursor-pointer block"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black tracking-tight text-stone-900">
                  2. Espera de Seña
                </span>
                <span className="text-xs">💳</span>
              </div>
              <p className="text-xl sm:text-2xl font-black font-sans mt-0.5 text-chocolate">
                {encargosEsperaSena}
              </p>
              <p className="text-[10px] font-semibold text-stone-700 truncate">
                Esperando comprobante
              </p>
            </Link>

            <Link
              href="/admin/encargos"
              className="p-2.5 sm:p-3 rounded-xl border-2 bg-[#F5F3FF] border-violet-300 hover:border-violet-500 text-left transition-all hover:shadow-xs cursor-pointer block"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black tracking-tight text-stone-900">
                  3. En Taller
                </span>
                <span className="text-xs">🎨</span>
              </div>
              <p className="text-xl sm:text-2xl font-black font-sans mt-0.5 text-chocolate">
                {encargosEnTaller}
              </p>
              <p className="text-[10px] font-semibold text-stone-700 truncate">
                Producción en curso
              </p>
            </Link>

            <Link
              href="/admin/encargos"
              className="p-2.5 sm:p-3 rounded-xl border-2 bg-[#ECFDF5] border-emerald-300 hover:border-emerald-500 text-left transition-all hover:shadow-xs cursor-pointer block"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black tracking-tight text-stone-900">
                  4. Listos / Saldo
                </span>
                <span className="text-xs">✨</span>
              </div>
              <p className="text-xl sm:text-2xl font-black font-sans mt-0.5 text-chocolate">
                {encargosListosSaldo}
              </p>
              <p className="text-[10px] font-semibold text-stone-700 truncate">
                Saldo y entrega
              </p>
            </Link>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* ─── 2. GESTIÓN DE STOCK DE LA TIENDA ─── */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <section className="p-3.5 sm:p-4 rounded-2xl bg-[#FAF7F2]/75 border border-[#E5E0D8] space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">📦</span>
              <h2 className="text-sm sm:text-base font-serif font-bold text-chocolate">
                Gestión de Stock de la Tienda
              </h2>
            </div>
            <Link
              href="/admin/pedidos"
              className="text-[11px] font-bold text-chocolate hover:text-emerald-800 transition-colors flex items-center gap-1 group"
            >
              <span>Gestionar Stock de Tienda</span>
              <span className="group-hover:translate-x-0.5 transition-transform">→</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <Link
              href="/admin/pedidos"
              className="p-2.5 sm:p-3 rounded-xl border-2 bg-[#FFFBEB] border-amber-300 hover:border-amber-500 text-left transition-all hover:shadow-xs cursor-pointer block"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black tracking-tight text-stone-900">
                  1. Pendientes Transferencia
                </span>
                <span className="text-xs">💳</span>
              </div>
              <p className="text-xl sm:text-2xl font-black font-sans mt-0.5 text-chocolate">
                {pedidosPendientesPago}
              </p>
              <p className="text-[10px] font-semibold text-stone-700 truncate">
                Por conciliar
              </p>
            </Link>

            <Link
              href="/admin/pedidos"
              className="p-2.5 sm:p-3 rounded-xl border-2 bg-[#F0F9FF] border-sky-300 hover:border-sky-500 text-left transition-all hover:shadow-xs cursor-pointer block"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black tracking-tight text-stone-900">
                  2. Listos / Despacho
                </span>
                <span className="text-xs">📦</span>
              </div>
              <p className="text-xl sm:text-2xl font-black font-sans mt-0.5 text-chocolate">
                {pedidosListosEnvio}
              </p>
              <p className="text-[10px] font-semibold text-stone-700 truncate">
                Embalar y enviar
              </p>
            </Link>

            <Link
              href="/admin/pedidos"
              className="p-2.5 sm:p-3 rounded-xl border-2 bg-[#F5F3FF] border-violet-300 hover:border-violet-500 text-left transition-all hover:shadow-xs cursor-pointer block"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black tracking-tight text-stone-900">
                  3. Listos / Retiro
                </span>
                <span className="text-xs">🏺</span>
              </div>
              <p className="text-xl sm:text-2xl font-black font-sans mt-0.5 text-chocolate">
                {pedidosListosRetiro}
              </p>
              <p className="text-[10px] font-semibold text-stone-700 truncate">
                Retiro en taller
              </p>
            </Link>

            <Link
              href="/admin/pedidos"
              className="p-2.5 sm:p-3 rounded-xl border-2 bg-[#ECFDF5] border-emerald-300 hover:border-emerald-500 text-left transition-all hover:shadow-xs cursor-pointer block"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black tracking-tight text-stone-900">
                  4. Entregados / Histórico
                </span>
                <span className="text-xs">✓</span>
              </div>
              <p className="text-xl sm:text-2xl font-black font-sans mt-0.5 text-chocolate">
                {pedidosEntregados}
              </p>
              <p className="text-[10px] font-semibold text-stone-700 truncate">
                Enviados y completados
              </p>
            </Link>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* ─── 3. STOCK TIENDA ─── */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <section className="p-3.5 sm:p-4 rounded-2xl bg-[#FAF7F2]/75 border border-[#E5E0D8] space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">📦</span>
              <h2 className="text-sm sm:text-base font-serif font-bold text-chocolate">
                Stock Tienda
              </h2>
            </div>
            <Link
              href="/admin/productos"
              className="text-[11px] font-bold text-chocolate hover:text-emerald-800 transition-colors flex items-center gap-1 group"
            >
              <span>Gestionar Stock</span>
              <span className="group-hover:translate-x-0.5 transition-transform">→</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <Link
              href="/admin/productos"
              className="p-2.5 sm:p-3 rounded-xl border-2 bg-[#ECFDF5] border-emerald-300 hover:border-emerald-500 text-left transition-all hover:shadow-xs cursor-pointer block"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black tracking-tight text-stone-900">
                  1. En Tienda (Disponibles)
                </span>
                <span className="text-xs">✓</span>
              </div>
              <p className="text-xl sm:text-2xl font-black font-sans mt-0.5 text-chocolate">
                {stockEnTienda}
              </p>
              <p className="text-[10px] font-semibold text-stone-700 truncate">
                Entrega inmediata
              </p>
            </Link>

            <Link
              href="/admin/productos"
              className="p-2.5 sm:p-3 rounded-xl border-2 bg-[#FFFBEB] border-amber-300 hover:border-amber-500 text-left transition-all hover:shadow-xs cursor-pointer block"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black tracking-tight text-stone-900">
                  2. Por Estrenar (Borrador)
                </span>
                <span className="text-xs">⏳</span>
              </div>
              <p className="text-xl sm:text-2xl font-black font-sans mt-0.5 text-chocolate">
                {stockBorradores}
              </p>
              <p className="text-[10px] font-semibold text-stone-700 truncate">
                Guardadas para estrenos
              </p>
            </Link>

            <Link
              href="/admin/productos"
              className="p-2.5 sm:p-3 rounded-xl border-2 bg-[#FEE2E2] border-rose-300 hover:border-rose-500 text-left transition-all hover:shadow-xs cursor-pointer block"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black tracking-tight text-stone-900">
                  3. Agotados (Sin stock)
                </span>
                <span className="text-xs">⚠️</span>
              </div>
              <p className="text-xl sm:text-2xl font-black font-sans mt-0.5 text-chocolate">
                {stockAgotados}
              </p>
              <p className="text-[10px] font-semibold text-stone-700 truncate">
                Piezas a reponer
              </p>
            </Link>

            <Link
              href="/admin/productos"
              className="p-2.5 sm:p-3 rounded-xl border-2 bg-[#F0F9FF] border-sky-300 hover:border-sky-500 text-left transition-all hover:shadow-xs cursor-pointer block"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black tracking-tight text-stone-900">
                  4. Total Catálogo
                </span>
                <span className="text-xs">📦</span>
              </div>
              <p className="text-xl sm:text-2xl font-black font-sans mt-0.5 text-chocolate">
                {stockTotalCatalogo}
              </p>
              <p className="text-[10px] font-semibold text-stone-700 truncate">
                Modelos y piezas
              </p>
            </Link>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* ─── 4. CERÁMICA ─── */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <section className="p-3.5 sm:p-4 rounded-2xl bg-[#FAF7F2]/75 border border-[#E5E0D8] space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🏺</span>
              <h2 className="text-sm sm:text-base font-serif font-bold text-chocolate">
                Cerámica
              </h2>
            </div>
            <Link
              href="/admin/ceramica"
              className="text-[11px] font-bold text-chocolate hover:text-emerald-800 transition-colors flex items-center gap-1 group"
            >
              <span>Gestionar Cerámica</span>
              <span className="group-hover:translate-x-0.5 transition-transform">→</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <Link
              href="/admin/ceramica"
              className="p-2.5 sm:p-3 rounded-xl border-2 bg-[#ECFDF5] border-emerald-300 hover:border-emerald-500 text-left transition-all hover:shadow-xs cursor-pointer block"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black tracking-tight text-stone-900">
                  1. En Tienda (Publicadas)
                </span>
                <span className="text-xs">✓</span>
              </div>
              <p className="text-xl sm:text-2xl font-black font-sans mt-0.5 text-chocolate">
                {ceramicaPublicadas}
              </p>
              <p className="text-[10px] font-semibold text-stone-700 truncate">
                Visibles en la web
              </p>
            </Link>

            <Link
              href="/admin/ceramica"
              className="p-2.5 sm:p-3 rounded-xl border-2 bg-[#FFFBEB] border-amber-300 hover:border-amber-500 text-left transition-all hover:shadow-xs cursor-pointer block"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black tracking-tight text-stone-900">
                  2. Borradores / Por Lanzar
                </span>
                <span className="text-xs">⏳</span>
              </div>
              <p className="text-xl sm:text-2xl font-black font-sans mt-0.5 text-chocolate">
                {ceramicaBorradores}
              </p>
              <p className="text-[10px] font-semibold text-stone-700 truncate">
                Guardadas para estreno
              </p>
            </Link>

            <Link
              href="/admin/ceramica"
              className="p-2.5 sm:p-3 rounded-xl border-2 bg-[#F5F3FF] border-violet-300 hover:border-violet-500 text-left transition-all hover:shadow-xs cursor-pointer block"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black tracking-tight text-stone-900">
                  3. Colecciones Activas
                </span>
                <span className="text-xs">✨</span>
              </div>
              <p className="text-xl sm:text-2xl font-black font-sans mt-0.5 text-chocolate">
                {ceramicaColecciones}
              </p>
              <p className="text-[10px] font-semibold text-stone-700 truncate">
                Lanzamientos temáticos
              </p>
            </Link>

            <Link
              href="/admin/ceramica"
              className="p-2.5 sm:p-3 rounded-xl border-2 bg-[#F0F9FF] border-sky-300 hover:border-sky-500 text-left transition-all hover:shadow-xs cursor-pointer block"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black tracking-tight text-stone-900">
                  4. Catálogo de Cerámica
                </span>
                <span className="text-xs">📜</span>
              </div>
              <p className="text-xl sm:text-2xl font-black font-sans mt-0.5 text-chocolate">
                {ceramicaCatalogo}
              </p>
              <p className="text-[10px] font-semibold text-stone-700 truncate">
                Tarifas y medidas
              </p>
            </Link>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* ─── 5. ILUSTRACIÓN ─── */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <section className="p-3.5 sm:p-4 rounded-2xl bg-[#FAF7F2]/75 border border-[#E5E0D8] space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎨</span>
              <h2 className="text-sm sm:text-base font-serif font-bold text-chocolate">
                Ilustración
              </h2>
            </div>
            <Link
              href="/admin/ilustracion"
              className="text-[11px] font-bold text-chocolate hover:text-emerald-800 transition-colors flex items-center gap-1 group"
            >
              <span>Gestionar Ilustración</span>
              <span className="group-hover:translate-x-0.5 transition-transform">→</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <Link
              href="/admin/ilustracion"
              className="p-2.5 sm:p-3 rounded-xl border-2 bg-[#ECFDF5] border-emerald-300 hover:border-emerald-500 text-left transition-all hover:shadow-xs cursor-pointer block"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black tracking-tight text-stone-900">
                  1. En Tienda (Publicadas)
                </span>
                <span className="text-xs">✓</span>
              </div>
              <p className="text-xl sm:text-2xl font-black font-sans mt-0.5 text-chocolate">
                {ilustracionPublicadas}
              </p>
              <p className="text-[10px] font-semibold text-stone-700 truncate">
                Visibles en la web
              </p>
            </Link>

            <Link
              href="/admin/ilustracion"
              className="p-2.5 sm:p-3 rounded-xl border-2 bg-[#FFFBEB] border-amber-300 hover:border-amber-500 text-left transition-all hover:shadow-xs cursor-pointer block"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black tracking-tight text-stone-900">
                  2. Borradores / Por Lanzar
                </span>
                <span className="text-xs">⏳</span>
              </div>
              <p className="text-xl sm:text-2xl font-black font-sans mt-0.5 text-chocolate">
                {ilustracionBorradores}
              </p>
              <p className="text-[10px] font-semibold text-stone-700 truncate">
                Guardadas para estreno
              </p>
            </Link>

            <Link
              href="/admin/ilustracion"
              className="p-2.5 sm:p-3 rounded-xl border-2 bg-[#F5F3FF] border-violet-300 hover:border-violet-500 text-left transition-all hover:shadow-xs cursor-pointer block"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black tracking-tight text-stone-900">
                  3. Colecciones Activas
                </span>
                <span className="text-xs">✨</span>
              </div>
              <p className="text-xl sm:text-2xl font-black font-sans mt-0.5 text-chocolate">
                {ilustracionColecciones}
              </p>
              <p className="text-[10px] font-semibold text-stone-700 truncate">
                Lanzamientos temáticos
              </p>
            </Link>

            <Link
              href="/admin/ilustracion"
              className="p-2.5 sm:p-3 rounded-xl border-2 bg-[#F0F9FF] border-sky-300 hover:border-sky-500 text-left transition-all hover:shadow-xs cursor-pointer block"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black tracking-tight text-stone-900">
                  4. Catálogo de Ilustración
                </span>
                <span className="text-xs">📜</span>
              </div>
              <p className="text-xl sm:text-2xl font-black font-sans mt-0.5 text-chocolate">
                {ilustracionCatalogo}
              </p>
              <p className="text-[10px] font-semibold text-stone-700 truncate">
                Tarifas y medidas
              </p>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
