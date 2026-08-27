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
  updateProductoStockInlineAction,
  updateProductoColeccionInlineAction,
  saveStockPiezaDirectaAction,
  deleteStockPiezaDirectaAction,
  lanzarColeccionDropCompletaAction,
} from "@/lib/actions";
import type {
  FormatoCatalogo,
  ProductoConImagenes,
  PortfolioColeccion,
  TipoRubro,
  Categoria,
} from "@/types";

interface ArteManagerProps {
  rubro: TipoRubro;
  formatos: FormatoCatalogo[];
  productosStock: ProductoConImagenes[];
  portfolio: PortfolioColeccion[];
  categorias?: Categoria[];
  producciones?: Array<{ id: string; nombre: string; descripcion?: string | null }>;
}

export function ArteManager({
  rubro,
  formatos: initialFormatos,
  productosStock: initialStock,
  portfolio: initialPortfolio,
  categorias: initialCategorias = [],
  producciones: initialProducciones = [],
}: ArteManagerProps) {
  const [activeTab, setActiveTab] = useState<"catalogo" | "stock" | "portfolio">("catalogo");
  const [formatos, setFormatos] = useState<FormatoCatalogo[]>(initialFormatos);
  const [stockList, setStockList] = useState<ProductoConImagenes[]>(initialStock);
  const [portfolioList, setPortfolioList] = useState<PortfolioColeccion[]>(initialPortfolio);
  const [isPending, startTransition] = useTransition();

  // ─── ESTADOS DE AUMENTO MASIVO EN CATÁLOGO ───
  const [porcentajeAumento, setPorcentajeAumento] = useState<string>("5");
  const [categoriaAumento, setCategoriaAumento] = useState<string>("todas");
  const [feedbackAumento, setFeedbackAumento] = useState<string | null>(null);

  // ─── ESTADOS DE EDICIÓN INLINE CATÁLOGO ───
  const [preciosEditados, setPreciosEditados] = useState<Record<string, number>>({});
  const [guardadoId, setGuardadoId] = useState<string | null>(null);

  // ─── MODAL FORMATO (CATÁLOGO) ───
  const [modalFormato, setModalFormato] = useState<Partial<FormatoCatalogo> | null>(null);
  const [formatoFotoUrl, setFormatoFotoUrl] = useState<string>("");

  // ─── FILTRO POR COLECCIÓN EN STOCK ───
  const [filtroColeccionStock, setFiltroColeccionStock] = useState<string>("todas");

  // ─── MODAL ASIGNAR COLECCIÓN RÁPIDA A PIEZA ───
  const [asignandoColeccionProd, setAsignandoColeccionProd] = useState<ProductoConImagenes | null>(null);
  const [nuevaColeccionInput, setNuevaColeccionInput] = useState<string>("");

  // ─── MODAL PIEZA INDIVIDUAL DE STOCK ───
  const [modalStockPieza, setModalStockPieza] = useState<Partial<ProductoConImagenes> | null>(null);
  const [stockFotos, setStockFotos] = useState<string[]>([]);
  const [stockCategoriaNombre, setStockCategoriaNombre] = useState<string>("");
  const [stockColeccionNombre, setStockColeccionNombre] = useState<string>("");

  // ─── MODAL LANZAR COLECCIÓN / DROP COMPLETO ───
  const [modalLanzarDrop, setModalLanzarDrop] = useState<boolean>(false);
  const [dropNombre, setDropNombre] = useState<string>("");
  const [dropDescripcion, setDropDescripcion] = useState<string>("");
  const [dropPiezas, setDropPiezas] = useState<
    Array<{
      id: string;
      nombre: string;
      categoriaNombre: string;
      precioBase: number;
      stock: number;
      altoCm?: number | null;
      anchoCm?: number | null;
      capacidadMl?: number | null;
      fotos: string[];
    }>
  >([
    {
      id: "1",
      nombre: "",
      categoriaNombre: "",
      precioBase: 25000,
      stock: 1,
      altoCm: null,
      anchoCm: null,
      capacidadMl: null,
      fotos: [],
    },
  ]);

  // ─── MODAL PORTFOLIO ───
  const [modalPortfolio, setModalPortfolio] = useState<Partial<PortfolioColeccion> | null>(null);
  const [portfolioFotos, setPortfolioFotos] = useState<string[]>([]);
  const [portfolioDisenosInput, setPortfolioDisenosInput] = useState<string>("");

  // ─── LIGHTBOX PREVIEW ───
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Lista de Colecciones registradas (desde producciones y productos)
  const coleccionesStockUnicas = Array.from(
    new Set([
      ...initialProducciones.map((p) => p.nombre),
      ...stockList.map((p) => p.producciones?.nombre).filter(Boolean),
    ]),
  ) as string[];

  // Lista de Categorías físicas registradas (Taza, Bandeja, Mate, Cuenco...)
  const categoriasFisicasUnicas = Array.from(
    new Set([
      ...initialCategorias.map((c) => c.nombre),
      ...stockList.map((p) => p.categorias?.nombre).filter(Boolean),
      ...formatos.map((f) => f.categoria).filter(Boolean),
    ]),
  ) as string[];

  const categoriasUnicasCatalogo = Array.from(
    new Set(formatos.map((f) => f.categoria).filter(Boolean)),
  ) as string[];

  // Filtrado de stock por colección
  const stockListFiltrado = stockList.filter((p) => {
    if (filtroColeccionStock === "todas") return true;
    if (filtroColeccionStock === "sin_coleccion") return !p.producciones?.nombre;
    return p.producciones?.nombre === filtroColeccionStock;
  });

  // ─── HANDLERS DE CATÁLOGO ───
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

  // ─── HANDLERS DE STOCK / DROPS ───
  const handleModificarStockRapido = (id: string, delta: number) => {
    const target = stockList.find((p) => p.id === id);
    if (!target) return;
    const nuevo = Math.max(0, (target.stock_disponible ?? 0) + delta);

    setStockList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stock_disponible: nuevo, es_entrega_inmediata: nuevo > 0 } : p)),
    );

    startTransition(async () => {
      const res = await updateProductoStockInlineAction(id, nuevo);
      if (!res.success) {
        alert(res.error || "Error al actualizar stock");
        window.location.reload();
      }
    });
  };

  const handleGuardarColeccionAsignada = () => {
    if (!asignandoColeccionProd) return;
    const nombreColeccion = nuevaColeccionInput.trim();

    startTransition(async () => {
      const res = await updateProductoColeccionInlineAction(
        asignandoColeccionProd.id,
        nombreColeccion,
        rubro as "ceramica" | "ilustracion",
      );

      if (res.success) {
        setStockList((prev) =>
          prev.map((p) =>
            p.id === asignandoColeccionProd.id
              ? {
                  ...p,
                  producciones:
                    nombreColeccion && nombreColeccion !== "Sin colección"
                      ? ({ id: res.produccionId || "", nombre: nombreColeccion } as any)
                      : null,
                }
              : p,
          ),
        );
        setAsignandoColeccionProd(null);
      } else {
        alert(res.error || "Error al asignar colección");
      }
    });
  };

  const abrirModalStockPieza = (prod?: ProductoConImagenes) => {
    if (prod) {
      setModalStockPieza(prod);
      const fotosArr = prod.producto_imagenes?.map((img) => img.url_imagen) || [];
      setStockFotos(fotosArr);
      setStockCategoriaNombre(prod.categorias?.nombre || "");
      setStockColeccionNombre(prod.producciones?.nombre || "");
    } else {
      setModalStockPieza({ stock_disponible: 1, precio_base: 25000 });
      setStockFotos([]);
      setStockCategoriaNombre(categoriasFisicasUnicas[0] || "");
      setStockColeccionNombre(coleccionesStockUnicas[0] || "");
    }
  };

  const handleGuardarStockPiezaModal = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("rubro", rubro);
    fd.set("fotos", JSON.stringify(stockFotos));
    fd.set("categoriaNombre", stockCategoriaNombre);
    fd.set("coleccionNombre", stockColeccionNombre);

    startTransition(async () => {
      const res = await saveStockPiezaDirectaAction(fd);
      if (res.success) {
        setModalStockPieza(null);
        window.location.reload();
      } else {
        alert(res.error || "Error al guardar pieza");
      }
    });
  };

  const handleEliminarStockPieza = (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar la pieza "${nombre}" del stock?`)) return;
    startTransition(async () => {
      const res = await deleteStockPiezaDirectaAction(id);
      if (res.success) {
        setStockList((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert(res.error || "Error al eliminar pieza");
      }
    });
  };

  // ─── HANDLER LANZAR DROP / COLECCIÓN COMPLETO ───
  const handleGuardarDropCompleto = () => {
    if (!dropNombre.trim()) {
      alert("Ingresá el nombre de la colección");
      return;
    }
    const piezasValidas = dropPiezas.filter((p) => p.nombre.trim());
    if (piezasValidas.length === 0) {
      alert("Cargá al menos una pieza con nombre");
      return;
    }

    startTransition(async () => {
      const res = await lanzarColeccionDropCompletaAction({
        rubro: rubro as "ceramica" | "ilustracion",
        nombreColeccion: dropNombre.trim(),
        descripcion: dropDescripcion.trim(),
        piezas: piezasValidas,
      });

      if (res.success) {
        alert("✓ Colección publicada en Stock y agregada al Portfolio");
        setModalLanzarDrop(false);
        window.location.reload();
      } else {
        alert(res.error || "Error al lanzar colección");
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
                Control de catálogo base, stock listo para entrega inmediata y portfolio de colecciones.
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
            <span>📦 Stock / Drops ({stockList.length})</span>
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
          
          {/* Barra de Ajuste Masivo % */}
          <div className="rounded-2xl border border-terracota/30 bg-arena/30 p-4 sm:p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-chocolate flex items-center gap-1.5 font-sans">
                  <span>⚡</span> Actualización Masiva de Precios por Porcentaje
                </h3>
                <p className="text-[11px] text-muted font-sans">
                  Ajustá los precios de todo el catálogo en 1 solo clic.
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
                {categoriasUnicasCatalogo.map((cat) => (
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

          {/* Lista de Piezas del Catálogo */}
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
                      <button
                        type="button"
                        onClick={() => formato.foto_url && setPreviewImage(formato.foto_url)}
                        className="h-12 w-12 shrink-0 rounded-xl bg-arena/40 border border-border/50 overflow-hidden flex items-center justify-center text-lg cursor-zoom-in"
                      >
                        {formato.foto_url ? (
                          <img src={formato.foto_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span>{rubro === "ceramica" ? "🏺" : "🎨"}</span>
                        )}
                      </button>

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
          SUB-PESTAÑA 2: STOCK / DROPS DE COLECCIÓN (UNIFICADO EN LISTA LIMPIA)
      ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "stock" && (
        <div className="space-y-5">
          
          {/* Barra Superior de Acciones de Stock */}
          <div className="rounded-2xl border border-border/60 bg-arena/25 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-chocolate flex items-center gap-1.5">
                <span>📦</span> Inventario de Stock Disponible ({stockList.length} piezas)
              </h3>
              <p className="text-xs text-muted font-sans mt-0.5">
                Control de piezas para entrega inmediata. Asigná colecciones o lanzá drops completos.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setModalLanzarDrop(true)}
                className="rounded-full bg-terracota text-white hover:bg-terracota/90 px-4 py-2 text-xs font-semibold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <span>🚀 Lanzar Colección de Stock</span>
              </button>

              <button
                type="button"
                onClick={() => abrirModalStockPieza()}
                className="rounded-full bg-chocolate text-crema-cruda hover:bg-chocolate/90 px-4 py-2 text-xs font-semibold shadow-xs cursor-pointer"
              >
                + Cargar Pieza Suelta
              </button>
            </div>
          </div>

          {/* Filtro por Colección / Drop */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs font-semibold text-muted shrink-0">Filtrar por colección:</span>
            
            <button
              type="button"
              onClick={() => setFiltroColeccionStock("todas")}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium font-sans transition-colors shrink-0 cursor-pointer shadow-2xs",
                filtroColeccionStock === "todas"
                  ? "bg-chocolate text-crema-cruda font-semibold"
                  : "bg-surface text-muted border border-border/60 hover:bg-secondary/40",
              )}
            >
              Todas ({stockList.length})
            </button>

            {coleccionesStockUnicas.map((col) => {
              const count = stockList.filter((p) => p.producciones?.nombre === col).length;
              return (
                <button
                  key={col}
                  type="button"
                  onClick={() => setFiltroColeccionStock(col)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium font-sans transition-colors shrink-0 cursor-pointer shadow-2xs",
                    filtroColeccionStock === col
                      ? "bg-chocolate text-crema-cruda font-semibold"
                      : "bg-surface text-muted border border-border/60 hover:bg-secondary/40",
                  )}
                >
                  ✨ {col} ({count})
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setFiltroColeccionStock("sin_coleccion")}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium font-sans transition-colors shrink-0 cursor-pointer shadow-2xs",
                filtroColeccionStock === "sin_coleccion"
                  ? "bg-chocolate text-crema-cruda font-semibold"
                  : "bg-surface text-muted border border-border/60 hover:bg-secondary/40",
              )}
            >
              Piezas Sueltas ({stockList.filter((p) => !p.producciones?.nombre).length})
            </button>
          </div>

          {/* LISTA UNIFICADA DE PIEZAS DE STOCK */}
          <div className="rounded-2xl border border-border/60 bg-surface shadow-xs overflow-hidden">
            <div className="p-3 bg-arena/20 border-b border-border/40 flex items-center justify-between text-xs text-muted font-sans">
              <span>{stockListFiltrado.length} piezas en esta vista</span>
              <span>Categoría física y Colección artística claramente diferenciadas</span>
            </div>

            {stockListFiltrado.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted space-y-2">
                <p className="text-2xl">📦</p>
                <p className="font-semibold text-chocolate">No hay piezas para el filtro seleccionado.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/40 overflow-x-auto">
                {stockListFiltrado.map((prod) => {
                  const fotoPrincipal = prod.producto_imagenes?.[0]?.url_imagen;
                  const categoriaNombre = prod.categorias?.nombre;
                  const coleccionNombre = prod.producciones?.nombre;
                  const tieneStock = (prod.stock_disponible ?? 0) > 0;
                  
                  // Generar texto de medidas/capacidad si existen
                  const partesMedidas: string[] = [];
                  if (prod.alto_cm && prod.ancho_cm) {
                    partesMedidas.push(`${prod.alto_cm}x${prod.ancho_cm} cm`);
                  } else if (prod.alto_cm) {
                    partesMedidas.push(`${prod.alto_cm} cm alto`);
                  } else if (prod.ancho_cm) {
                    partesMedidas.push(`${prod.ancho_cm} cm ancho`);
                  } else if (prod.dimensiones) {
                    partesMedidas.push(prod.dimensiones);
                  }

                  if (prod.capacidad_ml) {
                    partesMedidas.push(`${prod.capacidad_ml} ml`);
                  }

                  const medidasTexto = partesMedidas.join(" · ");

                  return (
                    <div
                      key={prod.id}
                      className={`flex items-center justify-between gap-3 p-3.5 sm:p-4 transition-colors ${
                        !tieneStock ? "bg-muted/10 opacity-75" : "hover:bg-arena/10"
                      }`}
                    >
                      {/* Foto e Info de la Pieza */}
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => fotoPrincipal && setPreviewImage(fotoPrincipal)}
                          className="h-14 w-14 shrink-0 rounded-2xl bg-arena/40 border border-border/60 overflow-hidden flex items-center justify-center text-xl cursor-zoom-in"
                        >
                          {fotoPrincipal ? (
                            <img src={fotoPrincipal} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span>🏺</span>
                          )}
                        </button>

                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs sm:text-sm font-semibold text-chocolate truncate">
                              {prod.nombre}
                            </p>

                            {/* Badge de Categoría física (Taza, Bandeja, Mate...) */}
                            {categoriaNombre && (
                              <span className="rounded-full bg-secondary/80 border border-border/60 px-2 py-0.5 text-[10px] font-semibold text-barro">
                                🏷️ {categoriaNombre}
                              </span>
                            )}

                            {/* Botón Badge para Colección / Drop */}
                            <button
                              type="button"
                              onClick={() => {
                                setAsignandoColeccionProd(prod);
                                setNuevaColeccionInput(coleccionNombre || "");
                              }}
                              className="rounded-full bg-arena/60 border border-terracota/40 px-2.5 py-0.5 text-[10px] font-semibold text-terracota hover:bg-terracota hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                              title="Cambiar colección"
                            >
                              <span>✨ {coleccionNombre || "Asignar Colección"}</span>
                              <span className="text-[9px]">✎</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-2 text-xs flex-wrap">
                            <span className="font-mono font-bold text-chocolate">
                              {formatPrecio(prod.precio_base)}
                            </span>
                            
                            {medidasTexto && (
                              <>
                                <span className="text-muted text-[11px]">·</span>
                                <span className="text-[11px] text-barro font-medium">
                                  📐 {medidasTexto}
                                </span>
                              </>
                            )}

                            <span className="text-muted text-[11px]">·</span>
                            <span
                              className={`text-[11px] font-semibold ${
                                tieneStock ? "text-emerald-700" : "text-amber-700"
                              }`}
                            >
                              {tieneStock
                                ? `🟢 En stock (${prod.stock_disponible} u.)`
                                : "⚪ Agotado"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Control de Stock Rápido Inline & Acciones */}
                      <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
                        {/* Selector - / + */}
                        <div className="flex items-center gap-1.5 bg-arena/20 border border-border/80 rounded-xl p-1 shadow-2xs">
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleModificarStockRapido(prod.id, -1)}
                            className="h-7 w-7 flex items-center justify-center rounded-lg bg-surface border border-border font-bold text-xs text-chocolate hover:bg-secondary/40 cursor-pointer disabled:opacity-40"
                            title="Disminuir stock"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-xs font-mono font-bold text-chocolate">
                            {prod.stock_disponible}
                          </span>
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleModificarStockRapido(prod.id, 1)}
                            className="h-7 w-7 flex items-center justify-center rounded-lg bg-surface border border-border font-bold text-xs text-chocolate hover:bg-secondary/40 cursor-pointer disabled:opacity-40"
                            title="Aumentar stock"
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => abrirModalStockPieza(prod)}
                          className="rounded-xl border border-border/80 bg-surface px-3 py-1.5 text-xs font-medium text-chocolate hover:bg-secondary/40 cursor-pointer shadow-2xs"
                        >
                          ✏️ Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => handleEliminarStockPieza(prod.id, prod.nombre)}
                          className="text-red-500 hover:text-red-700 p-1 text-xs cursor-pointer"
                          title="Eliminar del stock"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SUB-PESTAÑA 3: PORTFOLIO DE DISEÑOS (Álbumes Visuales)
      ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "portfolio" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-chocolate">
                Colecciones del Portfolio ({portfolioList.length})
              </h3>
              <p className="text-xs text-muted font-sans">
                Álbumes visuales históricos e inspiracionales para los clientes.
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
                          <img
                            key={i}
                            src={url}
                            alt=""
                            onClick={() => setPreviewImage(url)}
                            className="h-12 w-12 rounded-xl object-cover border border-border/50 cursor-zoom-in"
                          />
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
          MODAL 1: CREAR/EDITAR FORMATO DE CATÁLOGO
      ═══════════════════════════════════════════════════════════════════════ */}
      {modalFormato && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl border border-border/80 bg-surface p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
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
                  <label className="font-semibold text-chocolate block mb-1">Medidas / Capacidad</label>
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
                label="Foto de la pieza"
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
          MODAL 2: CREAR / EDITAR PIEZA INDIVIDUAL DE STOCK
      ═══════════════════════════════════════════════════════════════════════ */}
      {modalStockPieza && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl border border-border/80 bg-surface p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-base font-serif font-semibold text-chocolate">
                {modalStockPieza.id ? "Editar Pieza en Stock" : "Nueva Pieza en Stock"}
              </h3>
              <button
                type="button"
                onClick={() => setModalStockPieza(null)}
                className="h-8 w-8 rounded-full bg-arena/50 text-muted hover:text-foreground cursor-pointer flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarStockPiezaModal} className="space-y-3 text-xs">
              {modalStockPieza.id && <input type="hidden" name="id" value={modalStockPieza.id} />}

              <div>
                <label className="font-semibold text-chocolate block mb-1">Nombre de la pieza *</label>
                <input
                  type="text"
                  name="nombre"
                  required
                  defaultValue={modalStockPieza.nombre || ""}
                  placeholder="ej. Taza Perro Salchicha, Bandeja Sol..."
                  className="w-full rounded-xl border border-border/80 bg-surface px-3 py-2 text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Categoría física */}
                <div>
                  <label className="font-semibold text-chocolate block mb-1">Categoría (Formato)</label>
                  <input
                    type="text"
                    value={stockCategoriaNombre}
                    onChange={(e) => setStockCategoriaNombre(e.target.value)}
                    placeholder="ej. Bandeja, Taza, Mate..."
                    className="w-full rounded-xl border border-border/80 bg-surface px-3 py-2 text-foreground"
                  />
                  {categoriasFisicasUnicas.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {categoriasFisicasUnicas.slice(0, 4).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setStockCategoriaNombre(c)}
                          className="rounded-full bg-arena/60 px-2 py-0.5 text-[10px] text-chocolate hover:bg-barro hover:text-white"
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Colección / Drop */}
                <div>
                  <label className="font-semibold text-chocolate block mb-1">Colección / Drop</label>
                  <input
                    type="text"
                    value={stockColeccionNombre}
                    onChange={(e) => setStockColeccionNombre(e.target.value)}
                    placeholder="ej. Colección Argentina..."
                    className="w-full rounded-xl border border-border/80 bg-surface px-3 py-2 text-foreground"
                  />
                  {coleccionesStockUnicas.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {coleccionesStockUnicas.slice(0, 3).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setStockColeccionNombre(c)}
                          className="rounded-full bg-arena/60 px-2 py-0.5 text-[10px] text-chocolate hover:bg-terracota hover:text-white"
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Fila compacta de Precio, Stock y Medidas separadas */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                <div className="col-span-1">
                  <label className="font-semibold text-chocolate block mb-1">Precio ($) *</label>
                  <input
                    type="number"
                    name="precioBase"
                    required
                    defaultValue={modalStockPieza.precio_base || 25000}
                    className="w-full rounded-xl border border-border/80 bg-surface px-2.5 py-2 font-mono font-bold text-chocolate"
                  />
                </div>

                <div className="col-span-1">
                  <label className="font-semibold text-chocolate block mb-1">Stock *</label>
                  <input
                    type="number"
                    name="stockDisponible"
                    required
                    min="0"
                    defaultValue={modalStockPieza.stock_disponible ?? 1}
                    className="w-full rounded-xl border border-border/80 bg-surface px-2.5 py-2 font-mono font-bold text-chocolate"
                  />
                </div>

                <div className="col-span-1">
                  <label className="font-semibold text-chocolate block mb-1">Alto (cm)</label>
                  <input
                    type="number"
                    step="0.5"
                    name="altoCm"
                    defaultValue={modalStockPieza.alto_cm || ""}
                    placeholder="ej. 12"
                    className="w-full rounded-xl border border-border/80 bg-surface px-2.5 py-2 text-foreground font-mono"
                  />
                </div>

                <div className="col-span-1">
                  <label className="font-semibold text-chocolate block mb-1">Ancho (cm)</label>
                  <input
                    type="number"
                    step="0.5"
                    name="anchoCm"
                    defaultValue={modalStockPieza.ancho_cm || ""}
                    placeholder="ej. 8.5"
                    className="w-full rounded-xl border border-border/80 bg-surface px-2.5 py-2 text-foreground font-mono"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="font-semibold text-chocolate block mb-1">Capacidad (ml)</label>
                  <input
                    type="number"
                    step="10"
                    name="capacidadMl"
                    defaultValue={modalStockPieza.capacidad_ml || ""}
                    placeholder="ej. 350"
                    className="w-full rounded-xl border border-border/80 bg-surface px-2.5 py-2 text-foreground font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-chocolate block mb-1">Descripción</label>
                <textarea
                  name="descripcion"
                  rows={2}
                  defaultValue={modalStockPieza.descripcion || ""}
                  placeholder="Detalles sobre el diseño y elaboración..."
                  className="w-full rounded-xl border border-border/80 bg-surface p-2.5 text-foreground"
                />
              </div>

              {/* Subida Múltiple de Fotos de la Pieza */}
              <FileImageUpload
                value={stockFotos}
                onChange={setStockFotos}
                multiple
                folder="stock"
                label="Fotos"
              />

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 rounded-full bg-chocolate text-crema-cruda py-2.5 font-semibold hover:bg-chocolate/90 cursor-pointer"
                >
                  {isPending ? "Guardando..." : "Guardar en Stock"}
                </button>
                <button
                  type="button"
                  onClick={() => setModalStockPieza(null)}
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
          MODAL 3: ASIGNAR / CAMBIAR COLECCIÓN EN 1 CLIC A UNA PIEZA EXISTENTE
      ═══════════════════════════════════════════════════════════════════════ */}
      {asignandoColeccionProd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl border border-border/80 bg-surface p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <h3 className="text-sm font-serif font-semibold text-chocolate">
                Colección de &quot;{asignandoColeccionProd.nombre}&quot;
              </h3>
              <button
                type="button"
                onClick={() => setAsignandoColeccionProd(null)}
                className="h-7 w-7 rounded-full bg-arena/50 text-muted hover:text-foreground cursor-pointer flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-chocolate block mb-1">Nombre de la colección:</label>
                <input
                  type="text"
                  value={nuevaColeccionInput}
                  onChange={(e) => setNuevaColeccionInput(e.target.value)}
                  placeholder="ej. Colección Argentina, Botánica..."
                  className="w-full rounded-xl border border-border/80 bg-surface px-3 py-2 text-foreground"
                />
              </div>

              {coleccionesStockUnicas.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[11px] text-muted block">Colecciones existentes:</span>
                  <div className="flex flex-wrap gap-1">
                    {coleccionesStockUnicas.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNuevaColeccionInput(c)}
                        className="rounded-full bg-arena/60 px-2.5 py-1 text-xs text-chocolate hover:bg-terracota hover:text-white transition-colors cursor-pointer"
                      >
                        {c}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setNuevaColeccionInput("")}
                      className="rounded-full bg-muted/20 px-2.5 py-1 text-xs text-muted hover:bg-red-100 hover:text-red-700 transition-colors cursor-pointer"
                    >
                      Sin colección
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={isPending}
                  onClick={handleGuardarColeccionAsignada}
                  className="flex-1 rounded-full bg-terracota text-white py-2 font-semibold hover:bg-terracota/90 cursor-pointer shadow-2xs"
                >
                  {isPending ? "Guardando..." : "Guardar"}
                </button>
                <button
                  type="button"
                  onClick={() => setAsignandoColeccionProd(null)}
                  className="rounded-full border border-border bg-surface px-3 py-2 font-medium text-muted cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL 4: LANZAMIENTO DE COLECCIÓN / DROP COMPLETO (AMPLIO Y LIMPIO)
      ═══════════════════════════════════════════════════════════════════════ */}
      {modalLanzarDrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-3xl rounded-3xl border border-border/80 bg-surface p-6 sm:p-8 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <span className="text-[11px] font-semibold text-terracota uppercase tracking-wider">Lanzamiento</span>
                <h3 className="text-lg sm:text-xl font-serif font-semibold text-chocolate">
                  Lanzar Nueva Colección
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalLanzarDrop(false)}
                className="h-8 w-8 rounded-full bg-arena/50 text-muted hover:text-foreground cursor-pointer flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-chocolate block mb-1">Nombre de la Colección *</label>
                  <input
                    type="text"
                    value={dropNombre}
                    onChange={(e) => setDropNombre(e.target.value)}
                    placeholder="ej. Colección Patagonia, Drops de Primavera..."
                    className="w-full rounded-xl border border-border/80 bg-surface px-3.5 py-2 text-foreground font-medium"
                  />
                </div>

                <div>
                  <label className="font-semibold text-chocolate block mb-1">Descripción</label>
                  <input
                    type="text"
                    value={dropDescripcion}
                    onChange={(e) => setDropDescripcion(e.target.value)}
                    placeholder="ej. Inspirada en los colores y flores de la estación..."
                    className="w-full rounded-xl border border-border/80 bg-surface px-3.5 py-2 text-foreground"
                  />
                </div>
              </div>

              {/* Lista dinámica de piezas para la colección */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                  <p className="font-semibold text-chocolate text-sm">Piezas de la Colección ({dropPiezas.length}):</p>
                  <button
                    type="button"
                    onClick={() =>
                      setDropPiezas((prev) => [
                        ...prev,
                        {
                          id: Date.now().toString(),
                          nombre: "",
                          categoriaNombre: "",
                          precioBase: 25000,
                          stock: 1,
                          altoCm: null,
                          anchoCm: null,
                          capacidadMl: null,
                          fotos: [],
                        },
                      ])
                    }
                    className="text-xs font-semibold text-terracota hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>+ Agregar otra pieza</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {dropPiezas.map((pieza, pIdx) => (
                    <div
                      key={pieza.id}
                      className="rounded-2xl border border-border/80 bg-arena/20 p-4 space-y-3 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-chocolate text-xs">Pieza #{pIdx + 1}</span>
                        {dropPiezas.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setDropPiezas((prev) => prev.filter((_, i) => i !== pIdx))}
                            className="text-red-500 hover:text-red-700 text-xs cursor-pointer font-medium"
                          >
                            Quitar pieza ✕
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                        <div className="col-span-2 sm:col-span-2">
                          <label className="font-medium text-muted block text-[11px] mb-0.5">Nombre *</label>
                          <input
                            type="text"
                            value={pieza.nombre}
                            onChange={(e) =>
                              setDropPiezas((prev) =>
                                prev.map((p, i) => (i === pIdx ? { ...p, nombre: e.target.value } : p)),
                              )
                            }
                            placeholder="ej. Taza Glaciar"
                            className="w-full rounded-xl border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground"
                          />
                        </div>

                        <div>
                          <label className="font-medium text-muted block text-[11px] mb-0.5">Categoría</label>
                          <input
                            type="text"
                            value={pieza.categoriaNombre}
                            onChange={(e) =>
                              setDropPiezas((prev) =>
                                prev.map((p, i) => (i === pIdx ? { ...p, categoriaNombre: e.target.value } : p)),
                              )
                            }
                            placeholder="Taza, Mate..."
                            className="w-full rounded-xl border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground"
                          />
                        </div>

                        <div>
                          <label className="font-medium text-muted block text-[11px] mb-0.5">Precio ($)</label>
                          <input
                            type="number"
                            value={pieza.precioBase}
                            onChange={(e) =>
                              setDropPiezas((prev) =>
                                prev.map((p, i) =>
                                  i === pIdx ? { ...p, precioBase: parseFloat(e.target.value) || 0 } : p,
                                ),
                              )
                            }
                            className="w-full rounded-xl border border-border bg-surface px-2.5 py-1.5 text-xs font-mono font-bold text-chocolate"
                          />
                        </div>

                        <div>
                          <label className="font-medium text-muted block text-[11px] mb-0.5">Stock</label>
                          <input
                            type="number"
                            min="1"
                            value={pieza.stock}
                            onChange={(e) =>
                              setDropPiezas((prev) =>
                                prev.map((p, i) =>
                                  i === pIdx ? { ...p, stock: parseInt(e.target.value) || 1 } : p,
                                ),
                              )
                            }
                            className="w-full rounded-xl border border-border bg-surface px-2.5 py-1.5 text-xs font-mono font-bold text-chocolate"
                          />
                        </div>

                        <div>
                          <label className="font-medium text-muted block text-[11px] mb-0.5">Alto (cm)</label>
                          <input
                            type="number"
                            step="0.5"
                            value={pieza.altoCm ?? ""}
                            onChange={(e) =>
                              setDropPiezas((prev) =>
                                prev.map((p, i) =>
                                  i === pIdx ? { ...p, altoCm: parseFloat(e.target.value) || null } : p,
                                ),
                              )
                            }
                            placeholder="12"
                            className="w-full rounded-xl border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground font-mono"
                          />
                        </div>

                        <div>
                          <label className="font-medium text-muted block text-[11px] mb-0.5">Ancho (cm)</label>
                          <input
                            type="number"
                            step="0.5"
                            value={pieza.anchoCm ?? ""}
                            onChange={(e) =>
                              setDropPiezas((prev) =>
                                prev.map((p, i) =>
                                  i === pIdx ? { ...p, anchoCm: parseFloat(e.target.value) || null } : p,
                                ),
                              )
                            }
                            placeholder="8"
                            className="w-full rounded-xl border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground font-mono"
                          />
                        </div>

                        <div className="col-span-2 sm:col-span-5">
                          <label className="font-medium text-muted block text-[11px] mb-0.5">Capacidad (ml) - Opcional</label>
                          <input
                            type="number"
                            step="10"
                            value={pieza.capacidadMl ?? ""}
                            onChange={(e) =>
                              setDropPiezas((prev) =>
                                prev.map((p, i) =>
                                  i === pIdx ? { ...p, capacidadMl: parseFloat(e.target.value) || null } : p,
                                ),
                              )
                            }
                            placeholder="ej. 350 ml"
                            className="w-full max-w-[200px] rounded-xl border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground font-mono"
                          />
                        </div>
                      </div>

                      {/* Fotos de la pieza */}
                      <FileImageUpload
                        value={pieza.fotos}
                        onChange={(newFotos) =>
                          setDropPiezas((prev) =>
                            prev.map((p, i) => (i === pIdx ? { ...p, fotos: newFotos } : p)),
                          )
                        }
                        multiple
                        folder="drops"
                        label="Fotos"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-border/60 flex gap-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleGuardarDropCompleto}
                  className="flex-1 rounded-full bg-terracota text-white py-3 font-semibold text-xs hover:bg-terracota/90 cursor-pointer shadow-xs"
                >
                  {isPending ? "Publicando..." : "Publicar Colección"}
                </button>
                <button
                  type="button"
                  onClick={() => setModalLanzarDrop(false)}
                  className="rounded-full border border-border bg-surface px-5 py-3 font-medium text-muted cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL 5: CREAR/EDITAR PORTFOLIO MANUAL
      ═══════════════════════════════════════════════════════════════════════ */}
      {modalPortfolio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl border border-border/80 bg-surface p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
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
                <label className="font-semibold text-chocolate block mb-1">Descripción</label>
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
                label="Fotos"
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

      {/* ─── Preview Zoom Lightbox ─── */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 cursor-zoom-out animate-in fade-in duration-150"
        >
          <div className="relative max-w-lg w-full rounded-3xl overflow-hidden bg-surface p-2 shadow-2xl">
            <img src={previewImage} alt="" className="h-full w-full object-contain rounded-2xl max-h-[80vh]" />
          </div>
        </div>
      )}

    </div>
  );
}
