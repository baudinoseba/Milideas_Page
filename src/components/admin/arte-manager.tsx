"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { formatPrecio } from "@/lib/pricing";
import { cn } from "@/lib/utils/cn";
import { FileImageUpload } from "@/components/admin/file-image-upload";
import {
  updateFormatoPrecioAction,
  saveFormatoAction,
  deleteFormatoAction,
  aumentarPreciosMasivoAction,
  savePortfolioColeccionAction,
  deletePortfolioColeccionAction,
} from "@/lib/actions";
import type { FormatoCatalogo, ProductoConImagenes, PortfolioColeccion, TipoRubro } from "@/types";

interface ArteManagerProps {
  rubro: TipoRubro;
  formatos: FormatoCatalogo[];
  productosStock: ProductoConImagenes[];
  portfolio: PortfolioColeccion[];
}

export function ArteManager({
  rubro,
  formatos: initialFormatos,
  productosStock,
  portfolio: initialPortfolio,
}: ArteManagerProps) {
  const [activeTab, setActiveTab] = useState<"catalogo" | "stock" | "portfolio">("catalogo");
  const [formatos, setFormatos] = useState<FormatoCatalogo[]>(initialFormatos);
  const [portfolioList, setPortfolioList] = useState<PortfolioColeccion[]>(initialPortfolio);
  const [isPending, startTransition] = useTransition();

  // Estados para aumento masivo
  const [porcentajeAumento, setPorcentajeAumento] = useState<string>("5");
  const [categoriaAumento, setCategoriaAumento] = useState<string>("todas");
  const [feedbackAumento, setFeedbackAumento] = useState<string | null>(null);

  // Estados para edición inline de precios
  const [preciosEditados, setPreciosEditados] = useState<Record<string, number>>({});
  const [guardadoId, setGuardadoId] = useState<string | null>(null);

  // Estados para modal crear/editar Formato
  const [modalFormato, setModalFormato] = useState<Partial<FormatoCatalogo> | null>(null);
  const [formatoFotoUrl, setFormatoFotoUrl] = useState<string>("");

  // Estados para modal crear/editar Portfolio
  const [modalPortfolio, setModalPortfolio] = useState<Partial<PortfolioColeccion> | null>(null);
  const [portfolioFotos, setPortfolioFotos] = useState<string[]>([]);
  const [portfolioDisenosInput, setPortfolioDisenosInput] = useState<string>("");

  const categoriasUnicas = Array.from(
    new Set(formatos.map((f) => f.categoria).filter(Boolean)),
  ) as string[];

  // ─── HANDLERS DE FORMATO ───
  const abrirModalFormato = (formato?: FormatoCatalogo) => {
    if (formato) {
      setModalFormato(formato);
      setFormatoFotoUrl(formato.foto_url || "");
    } else {
      setModalFormato({ rubro, activo: true });
      setFormatoFotoUrl("");
    }
  };

  const handleGuardarPrecioInline = (formatoId: string) => {
    const nuevoPrecio = preciosEditados[formatoId];
    if (nuevoPrecio === undefined) return;

    startTransition(async () => {
      const res = await updateFormatoPrecioAction(formatoId, nuevoPrecio);
      if (res.success) {
        setFormatos((prev) =>
          prev.map((f) => (f.id === formatoId ? { ...f, precio_base: nuevoPrecio } : f)),
        );
        setGuardadoId(formatoId);
        setTimeout(() => setGuardadoId(null), 2000);
      } else {
        alert(res.error || "Error al actualizar precio");
      }
    });
  };

  const handleAplicarAumentoMasivo = () => {
    const p = parseFloat(porcentajeAumento);
    if (isNaN(p) || p === 0) {
      alert("Ingresá un porcentaje válido");
      return;
    }

    const catTexto = categoriaAumento === "todas" ? "TODAS las piezas" : `las piezas de "${categoriaAumento}"`;
    if (!confirm(`¿Confirmás aumentar un ${p}% a ${catTexto} del catálogo de ${rubro}?`)) {
      return;
    }

    startTransition(async () => {
      const res = await aumentarPreciosMasivoAction(rubro, p, categoriaAumento);
      if (res.success) {
        setFeedbackAumento(`✓ ¡Se actualizaron ${res.actualizados} piezas con +${p}%!`);
        const factor = 1 + p / 100;
        setFormatos((prev) =>
          prev.map((f) => {
            if (categoriaAumento !== "todas" && f.categoria !== categoriaAumento) return f;
            return { ...f, precio_base: Math.round(f.precio_base * factor) };
          }),
        );
        setTimeout(() => setFeedbackAumento(null), 4000);
      } else {
        alert(res.error || "Error al aplicar aumento");
      }
    });
  };

  const handleGuardarFormatoModal = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("rubro", rubro);
    fd.set("fotoUrl", formatoFotoUrl);

    startTransition(async () => {
      const res = await saveFormatoAction(fd);
      if (res.success) {
        setModalFormato(null);
        window.location.reload();
      } else {
        alert(res.error || "Error al guardar");
      }
    });
  };

  const handleEliminarFormato = (id: string, nombre: string) => {
    if (!confirm(`¿Seguro que deseas eliminar "${nombre}" del catálogo?`)) return;
    startTransition(async () => {
      const res = await deleteFormatoAction(id);
      if (res.success) {
        setFormatos((prev) => prev.filter((f) => f.id !== id));
      } else {
        alert(res.error || "Error al eliminar");
      }
    });
  };

  // ─── HANDLERS DE PORTFOLIO ───
  const abrirModalPortfolio = (item?: PortfolioColeccion) => {
    if (item) {
      setModalPortfolio(item);
      setPortfolioFotos(Array.isArray(item.fotos) ? item.fotos : [item.portada_url || ""].filter(Boolean));
      setPortfolioDisenosInput(
        Array.isArray(item.disenos_disponibles) ? item.disenos_disponibles.join(", ") : "",
      );
    } else {
      setModalPortfolio({});
      setPortfolioFotos([]);
      setPortfolioDisenosInput("");
    }
  };

  const handleGuardarPortfolioModal = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("rubro", rubro);
    fd.set("fotos", JSON.stringify(portfolioFotos));
    fd.set("portadaUrl", portfolioFotos[0] || "");

    const disenosArr = portfolioDisenosInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    fd.set("disenosDisponibles", JSON.stringify(disenosArr));

    startTransition(async () => {
      const res = await savePortfolioColeccionAction(fd);
      if (res.success) {
        setModalPortfolio(null);
        window.location.reload();
      } else {
        alert(res.error || "Error al guardar colección");
      }
    });
  };

  const handleEliminarPortfolio = (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar la colección "${nombre}" del portfolio?`)) return;
    startTransition(async () => {
      const res = await deletePortfolioColeccionAction(id);
      if (res.success) {
        setPortfolioList((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert(res.error || "Error al eliminar");
      }
    });
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* ─── Botón Volver & Header del Rubro ─── */}
      <div className="border-b border-border/60 pb-4 space-y-3">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-chocolate font-sans"
        >
          <span>← Volver al Dashboard</span>
        </Link>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-3xl sm:text-4xl">{rubro === "ceramica" ? "🏺" : "🎨"}</span>
            <div>
              <h1 className="text-xl sm:text-2xl font-serif font-semibold text-chocolate">
                Gestión de {rubro === "ceramica" ? "Cerámica" : "Ilustraciones"}
              </h1>
              <p className="text-xs text-muted font-sans">
                Administrá el catálogo de piezas a pedido, el stock en drops y el portfolio visual.
              </p>
            </div>
          </div>
        </div>

        {/* ─── 3 Sub-pestañas Claras ─── */}
        <div className="flex gap-2 pt-1 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab("catalogo")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold font-sans transition-all cursor-pointer shadow-xs",
              activeTab === "catalogo"
                ? "bg-chocolate text-crema-cruda shadow-sm"
                : "bg-surface text-chocolate border border-border/70 hover:bg-secondary/40",
            )}
          >
            <span>📋 Catálogo ({formatos.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("stock")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold font-sans transition-all cursor-pointer shadow-xs",
              activeTab === "stock"
                ? "bg-chocolate text-crema-cruda shadow-sm"
                : "bg-surface text-chocolate border border-border/70 hover:bg-secondary/40",
            )}
          >
            <span>📦 Stock / Drops ({productosStock.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("portfolio")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold font-sans transition-all cursor-pointer shadow-xs",
              activeTab === "portfolio"
                ? "bg-chocolate text-crema-cruda shadow-sm"
                : "bg-surface text-chocolate border border-border/70 hover:bg-secondary/40",
            )}
          >
            <span>🎨 Portfolio ({portfolioList.length})</span>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SUB-PESTAÑA 1: CATÁLOGO DE PIEZAS (Con Aumento Masivo de Precios %)
      ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "catalogo" && (
        <div className="space-y-5">
          
          {/* Barra de Ajuste de Precios Masivo % */}
          <div className="rounded-2xl border border-terracota/30 bg-arena/30 p-4 sm:p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-chocolate flex items-center gap-1.5 font-sans">
                  <span>⚡</span> Actualización Masiva de Precios por Porcentaje
                </h3>
                <p className="text-[11px] text-muted font-sans">
                  Aumentá los precios de todo el catálogo en 1 clic aplicando un porcentaje directo.
                </p>
              </div>

              <button
                type="button"
                onClick={() => abrirModalFormato()}
                className="rounded-full bg-chocolate text-crema-cruda hover:bg-chocolate/90 px-4 py-1.5 text-xs font-semibold shadow-xs cursor-pointer self-start sm:self-auto"
              >
                + Nueva Pieza en Catálogo
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <div className="flex items-center gap-1.5 bg-surface border border-border/80 rounded-xl px-3 py-1.5 shadow-2xs">
                <span className="text-xs font-semibold text-chocolate">Aumento:</span>
                <input
                  type="number"
                  step="0.5"
                  value={porcentajeAumento}
                  onChange={(e) => setPorcentajeAumento(e.target.value)}
                  className="w-14 text-xs font-mono font-bold text-terracota focus:outline-hidden"
                />
                <span className="text-xs font-bold text-chocolate">%</span>
              </div>

              <select
                value={categoriaAumento}
                onChange={(e) => setCategoriaAumento(e.target.value)}
                className="rounded-xl border border-border/80 bg-surface px-3 py-1.5 text-xs text-foreground shadow-2xs focus:ring-2 focus:ring-terracota/40"
              >
                <option value="todas">Aplicar a TODAS las categorías</option>
                {categoriasUnicas.map((cat) => (
                  <option key={cat} value={cat}>
                    Solo en &quot;{cat}&quot;
                  </option>
                ))}
              </select>

              <button
                type="button"
                disabled={isPending}
                onClick={handleAplicarAumentoMasivo}
                className="rounded-xl bg-terracota text-white hover:bg-terracota/90 px-4 py-1.5 text-xs font-semibold shadow-xs cursor-pointer transition-all disabled:opacity-50"
              >
                {isPending ? "Actualizando..." : "Aplicar Aumento %"}
              </button>

              {feedbackAumento && (
                <span className="text-xs font-semibold text-emerald-700 font-sans animate-in fade-in">
                  {feedbackAumento}
                </span>
              )}
            </div>
          </div>

          {/* Tabla de Piezas del Catálogo */}
          <div className="rounded-2xl border border-border/60 bg-surface shadow-xs overflow-hidden">
            <div className="p-3 bg-arena/20 border-b border-border/40 flex items-center justify-between text-xs text-muted font-sans">
              <span>{formatos.length} formatos registrados</span>
              <span>Podés editar el precio directamente en cada fila</span>
            </div>

            <div className="divide-y divide-border/40 overflow-x-auto">
              {formatos.map((formato) => {
                const precioLocal = preciosEditados[formato.id] ?? formato.precio_base;
                const cambioPendiente =
                  preciosEditados[formato.id] !== undefined &&
                  preciosEditados[formato.id] !== formato.precio_base;

                return (
                  <div
                    key={formato.id}
                    className="flex items-center justify-between gap-3 p-3 sm:p-4 hover:bg-arena/10 transition-colors"
                  >
                    {/* Foto e Info */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="h-12 w-12 shrink-0 rounded-xl bg-arena/40 border border-border/50 overflow-hidden flex items-center justify-center text-lg">
                        {formato.foto_url ? (
                          <img src={formato.foto_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span>{rubro === "ceramica" ? "🏺" : "🎨"}</span>
                        )}
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs sm:text-sm font-semibold text-chocolate truncate">
                            {formato.nombre}
                          </p>
                          {formato.categoria && (
                            <span className="rounded-full bg-secondary/60 px-2 py-0.2 text-[10px] font-medium text-barro">
                              {formato.categoria}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted">
                          Medidas: <span className="text-foreground">{formato.medidas || "A elección"}</span>
                        </p>
                      </div>
                    </div>

                    {/* Editor de Precio Inline & Acciones */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1 bg-surface border border-border/80 rounded-xl px-2.5 py-1 shadow-2xs">
                        <span className="text-xs text-muted font-mono">$</span>
                        <input
                          type="number"
                          value={precioLocal}
                          onChange={(e) =>
                            setPreciosEditados((prev) => ({
                              ...prev,
                              [formato.id]: parseFloat(e.target.value) || 0,
                            }))
                          }
                          className="w-20 text-xs font-mono font-bold text-chocolate focus:outline-hidden"
                        />
                      </div>

                      {cambioPendiente && (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleGuardarPrecioInline(formato.id)}
                          className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 text-xs font-semibold shadow-xs cursor-pointer animate-in fade-in"
                        >
                          Guardar
                        </button>
                      )}

                      {guardadoId === formato.id && (
                        <span className="text-xs text-emerald-600 font-bold animate-in fade-in">✓</span>
                      )}

                      <button
                        type="button"
                        onClick={() => abrirModalFormato(formato)}
                        className="rounded-xl border border-border/80 bg-surface px-2.5 py-1 text-xs font-medium text-chocolate hover:bg-secondary/40 cursor-pointer shadow-2xs"
                      >
                        ✏️ Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => handleEliminarFormato(formato.id, formato.nombre)}
                        className="text-red-500 hover:text-red-700 p-1 text-xs cursor-pointer"
                        title="Eliminar formato"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SUB-PESTAÑA 2: STOCK / DROPS DE COLECCIÓN
      ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "stock" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-chocolate">
                Piezas Listas de Stock ({productosStock.length})
              </h3>
              <p className="text-xs text-muted font-sans">
                Piezas disponibles para despacho inmediato en la tienda online.
              </p>
            </div>

            <Link
              href={`/admin/productos?rubro=${rubro}`}
              className="rounded-full bg-chocolate text-crema-cruda hover:bg-chocolate/90 px-4 py-2 text-xs font-semibold shadow-xs self-start sm:self-auto"
            >
              + Gestionar y Cargar Piezas en Stock
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {productosStock.map((prod) => (
              <div
                key={prod.id}
                className="rounded-2xl border border-border/60 bg-surface p-4 shadow-xs flex items-center gap-3 justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-14 w-14 shrink-0 rounded-xl bg-arena/30 overflow-hidden border border-border/50">
                    {prod.producto_imagenes?.[0]?.url_imagen ? (
                      <img src={prod.producto_imagenes[0].url_imagen} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-xl">🏺</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-chocolate truncate">{prod.nombre}</p>
                    <p className="text-xs text-terracota font-mono font-bold">{formatPrecio(prod.precio_base)}</p>
                    <p className="text-[11px] text-muted">Stock: {prod.stock_disponible} u.</p>
                  </div>
                </div>

                <Link
                  href={`/admin/productos/${prod.id}`}
                  className="rounded-xl border border-border bg-surface px-2.5 py-1 text-xs text-chocolate hover:bg-secondary/40 font-medium shrink-0"
                >
                  Editar
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SUB-PESTAÑA 3: PORTFOLIO DE DISEÑOS
      ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "portfolio" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-chocolate">
                Colecciones del Portfolio ({portfolioList.length})
              </h3>
              <p className="text-xs text-muted font-sans">
                Álbumes visuales para inspirar a los clientes en sus encargos.
              </p>
            </div>

            <button
              type="button"
              onClick={() => abrirModalPortfolio()}
              className="rounded-full bg-chocolate text-crema-cruda hover:bg-chocolate/90 px-4 py-1.5 text-xs font-semibold shadow-xs cursor-pointer"
            >
              + Nueva Colección
            </button>
          </div>

          <div className="space-y-3">
            {portfolioList.map((col) => {
              const fotos = Array.isArray(col.fotos) ? col.fotos : [];
              return (
                <div
                  key={col.id}
                  className="rounded-2xl border border-border/60 bg-surface p-4 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-serif font-semibold text-chocolate">✨ {col.nombre}</h4>
                      <span className="text-[10px] text-muted font-sans">({fotos.length} fotos)</span>
                    </div>
                    {col.descripcion && <p className="text-xs text-barro line-clamp-1">{col.descripcion}</p>}
                    
                    {fotos.length > 0 && (
                      <div className="flex gap-2 pt-1 overflow-x-auto pb-1 scrollbar-none">
                        {fotos.map((url, i) => (
                          <img key={i} src={url} alt="" className="h-10 w-10 rounded-lg object-cover border border-border/50" />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => abrirModalPortfolio(col)}
                      className="rounded-xl border border-border bg-surface px-3 py-1 text-xs text-chocolate hover:bg-secondary/40 font-medium cursor-pointer"
                    >
                      ✏️ Editar Álbum
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEliminarPortfolio(col.id, col.nombre)}
                      className="text-red-500 hover:text-red-700 p-1 text-xs cursor-pointer"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL CREAR/EDITAR FORMATO DE CATÁLOGO (Con Subida Directa de Fotos)
      ═══════════════════════════════════════════════════════════════════════ */}
      {modalFormato && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-border/80 bg-surface p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-base font-serif font-semibold text-chocolate">
                {modalFormato.id ? "Editar Pieza del Catálogo" : "Nueva Pieza en Catálogo"}
              </h3>
              <button
                type="button"
                onClick={() => setModalFormato(null)}
                className="h-8 w-8 rounded-full bg-arena/50 text-muted hover:text-foreground cursor-pointer flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarFormatoModal} className="space-y-3 text-xs">
              {modalFormato.id && <input type="hidden" name="id" value={modalFormato.id} />}

              <div>
                <label className="font-semibold text-chocolate block mb-1">Nombre de la pieza *</label>
                <input
                  type="text"
                  name="nombre"
                  required
                  defaultValue={modalFormato.nombre || ""}
                  placeholder="ej. Mate Clásico, Taza XXL, Cuenco..."
                  className="w-full rounded-xl border border-border/80 bg-surface px-3 py-2 text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-chocolate block mb-1">Categoría</label>
                  <input
                    type="text"
                    name="categoria"
                    defaultValue={modalFormato.categoria || ""}
                    placeholder="ej. Mates, Tazas, Cuencos..."
                    className="w-full rounded-xl border border-border/80 bg-surface px-3 py-2 text-foreground"
                  />
                </div>

                <div>
                  <label className="font-semibold text-chocolate block mb-1">Medidas</label>
                  <input
                    type="text"
                    name="medidas"
                    defaultValue={modalFormato.medidas || ""}
                    placeholder="ej. 30x16 cm, 400ml..."
                    className="w-full rounded-xl border border-border/80 bg-surface px-3 py-2 text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-chocolate block mb-1">Precio Base ($) *</label>
                <input
                  type="number"
                  name="precioBase"
                  required
                  defaultValue={modalFormato.precio_base || 0}
                  className="w-full rounded-xl border border-border/80 bg-surface px-3 py-2 font-mono font-bold text-chocolate"
                />
              </div>

              {/* Subida Directa de Foto */}
              <FileImageUpload
                value={formatoFotoUrl}
                onChange={setFormatoFotoUrl}
                folder="catalogo"
                label="Foto de la pieza (Subir desde el dispositivo)"
              />

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 rounded-full bg-chocolate text-crema-cruda py-2.5 font-semibold hover:bg-chocolate/90 cursor-pointer"
                >
                  {isPending ? "Guardando..." : "Guardar Pieza"}
                </button>
                <button
                  type="button"
                  onClick={() => setModalFormato(null)}
                  className="rounded-full border border-border bg-surface px-4 py-2.5 font-medium text-muted cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL CREAR/EDITAR PORTFOLIO (Con Subida Múltiple de Fotos)
      ═══════════════════════════════════════════════════════════════════════ */}
      {modalPortfolio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-border/80 bg-surface p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-base font-serif font-semibold text-chocolate">
                {modalPortfolio.id ? "Editar Colección del Portfolio" : "Nueva Colección"}
              </h3>
              <button
                type="button"
                onClick={() => setModalPortfolio(null)}
                className="h-8 w-8 rounded-full bg-arena/50 text-muted hover:text-foreground cursor-pointer flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarPortfolioModal} className="space-y-3 text-xs">
              {modalPortfolio.id && <input type="hidden" name="id" value={modalPortfolio.id} />}

              <div>
                <label className="font-semibold text-chocolate block mb-1">Nombre de la Colección *</label>
                <input
                  type="text"
                  name="nombre"
                  required
                  defaultValue={modalPortfolio.nombre || ""}
                  placeholder="ej. Colección Botánica & Jardín"
                  className="w-full rounded-xl border border-border/80 bg-surface px-3 py-2 text-foreground"
                />
              </div>

              <div>
                <label className="font-semibold text-chocolate block mb-1">Descripción breve</label>
                <input
                  type="text"
                  name="descripcion"
                  defaultValue={modalPortfolio.descripcion || ""}
                  placeholder="ej. Inspirada en la flora autóctona..."
                  className="w-full rounded-xl border border-border/80 bg-surface px-3 py-2 text-foreground"
                />
              </div>

              {/* Subida Múltiple de Fotos del Álbum */}
              <FileImageUpload
                value={portfolioFotos}
                onChange={setPortfolioFotos}
                multiple
                folder="portfolio"
                label="Fotos del Álbum (Subir fotos desde tus archivos)"
              />

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 rounded-full bg-chocolate text-crema-cruda py-2.5 font-semibold hover:bg-chocolate/90 cursor-pointer"
                >
                  {isPending ? "Guardando..." : "Guardar Colección"}
                </button>
                <button
                  type="button"
                  onClick={() => setModalPortfolio(null)}
                  className="rounded-full border border-border bg-surface px-4 py-2.5 font-medium text-muted cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
