"use client";

import { useState, useEffect } from "react";
import { ProductCard } from "@/components/product/product-card";
import { formatPrecio } from "@/lib/pricing";
import { cn } from "@/lib/utils/cn";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { PortfolioCarouselCard } from "./portfolio-carousel-card";
import { useEncargosCartStore } from "@/stores/encargos-cart-store";
import type { FormatoCatalogo, ProductoConImagenes, PortfolioColeccion, TipoRubro } from "@/types";

interface CatalogoViewProps {
  rubro: TipoRubro;
  formatos: FormatoCatalogo[];
  productosStock: ProductoConImagenes[];
  portfolio: PortfolioColeccion[];
  tabInicial?: "stock" | "catalogo" | "portfolio";
}

export function CatalogoView({
  rubro,
  formatos,
  productosStock,
  portfolio,
  tabInicial = "stock",
}: CatalogoViewProps) {
  const [activeTab, setActiveTab] = useState<"stock" | "catalogo" | "portfolio">(tabInicial);
  const [selectedCategoria, setSelectedCategoria] = useState<string>("todas");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    setActiveTab(tabInicial);
  }, [tabInicial]);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path.includes("/catalogo")) {
        setActiveTab("catalogo");
      } else if (path.includes("/portfolio")) {
        setActiveTab("portfolio");
      } else if (path.includes("/stock")) {
        setActiveTab("stock");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleTabChange = (newTab: "stock" | "catalogo" | "portfolio") => {
    setActiveTab(newTab);
    const newPath = `/${rubro}/${newTab}`;
    if (typeof window !== "undefined" && window.location.pathname !== newPath) {
      window.history.pushState(null, "", newPath);
    }
  };
  
  // Estado para modal de encargo con memoria inteligente
  const [encargoModalFormato, setEncargoModalFormato] = useState<FormatoCatalogo | null>(null);
  const [cantidad, setCantidad] = useState<number>(1);
  const [disenoTipo, setDisenoTipo] = useState<"coleccion" | "personalizado">("coleccion");
  const [agregadoExitoso, setAgregadoExitoso] = useState<boolean>(false);
  const [confirmandoWhatsapp, setConfirmandoWhatsapp] = useState<boolean>(false);

  // Estado para lightbox de imagen (ampliar foto)
  const [lightboxImage, setLightboxImage] = useState<{ url: string; titulo: string; descripcion?: string } | null>(null);

  const addEncargoItem = useEncargosCartStore((s) => s.addEncargoItem);

  // Categorías únicas
  const categoriasUnicas = Array.from(
    new Set(formatos.map((f) => f.categoria).filter(Boolean)),
  ) as string[];

  // Diseños disponibles en portfolio
  const todosLosDisenos = Array.from(
    new Set(portfolio.flatMap((c) => (Array.isArray(c.disenos_disponibles) ? c.disenos_disponibles : []))),
  );

  // Filtrado de formatos
  const formatosFiltrados = formatos.filter((f) => {
    const matchCat = selectedCategoria === "todas" || f.categoria === selectedCategoria;
    const matchSearch =
      !searchQuery ||
      f.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.medidas && f.medidas.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchSearch;
  });

  const abrirModalEncargo = (formato: FormatoCatalogo) => {
    setEncargoModalFormato(formato);
    setCantidad(1);
    // Memoria inteligente: se mantiene disenoTipo previamente seleccionado
    setAgregadoExitoso(false);
    setConfirmandoWhatsapp(false);
  };

  const getDisenoTexto = () => {
    if (disenoTipo === "personalizado") {
      return "Personalizado a medida (+15%) (te cuento mi idea)";
    }
    return "Colección existente (te paso captura del que me gustó)";
  };

  const handleAgregarAlCarrito = () => {
    if (!encargoModalFormato) return;
    const esCustom = disenoTipo === "personalizado";
    const disenoTexto = getDisenoTexto();

    addEncargoItem({
      productoId: encargoModalFormato.id,
      slug: encargoModalFormato.id,
      nombre: encargoModalFormato.nombre,
      imagenUrl: encargoModalFormato.foto_url,
      tipoCatalogo: rubro === "ceramica" ? "ceramica" : "ilustraciones",
      precioBase: encargoModalFormato.precio_base,
      esPersonalizado: esCustom,
      detallePersonalizacion: disenoTexto,
      medidaSeleccionada: encargoModalFormato.medidas,
      adicionalMedida: 0,
      conMarco: false,
      adicionalMarco: 0,
      recargoPersonalizado: esCustom ? encargoModalFormato.precio_base * 0.15 : 0,
      precioUnitarioFinal: esCustom
        ? encargoModalFormato.precio_base * 1.15
        : encargoModalFormato.precio_base,
      cantidad,
    });

    setAgregadoExitoso(true);
    setTimeout(() => {
      setEncargoModalFormato(null);
      setAgregadoExitoso(false);
    }, 1200);
  };

  const ejecutarEnvioWhatsapp = () => {
    if (!encargoModalFormato) return;
    const esCustom = disenoTipo === "personalizado";
    const disenoTexto = getDisenoTexto();
    const precioUnit = esCustom ? encargoModalFormato.precio_base * 1.15 : encargoModalFormato.precio_base;
    const precioTotal = precioUnit * cantidad;

    const mensaje = `¡Hola Mili! Me gustaría encargar una pieza a medida desde la web:
- *Pieza:* ${encargoModalFormato.nombre} (${encargoModalFormato.medidas || "Formato base"})
- *Cantidad:* ${cantidad}
- *Diseño:* ${disenoTexto}
- *Precio estimado:* ${formatPrecio(precioTotal)}

¿Cómo coordinamos el plazo de entrega y la seña? ¡Muchas gracias!`;

    const vendorWa = process.env.NEXT_PUBLIC_VENDOR_WHATSAPP || "5493493664420";
    window.open(`https://wa.me/${vendorWa}?text=${encodeURIComponent(mensaje)}`, "_blank");
    setEncargoModalFormato(null);
    setConfirmandoWhatsapp(false);
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* ─── Cabecera Principal de Página Centrada ─── */}
      <div className="space-y-3 text-center flex flex-col items-center">
        <div className="flex items-center justify-center gap-2.5">
          <span className="text-2xl sm:text-3xl">{rubro === "ceramica" ? "🏺" : "🎨"}</span>
          <h1 className="text-3xl sm:text-4xl font-serif font-medium text-chocolate">
            {rubro === "ceramica" ? "Cerámica de Autor" : "Ilustración de Autor"}
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-barro font-sans max-w-lg mx-auto leading-relaxed">
          {rubro === "ceramica"
            ? "Piezas únicas y en pequeñas ediciones listas para entregar."
            : "Pinturas y dibujos originales en acuarela, cuadros enmarcados a mano por Mili Ferrero."}
        </p>

        {/* ─── Navegación de Secciones Centrada (Pestañas Claras en Orden: Stock -> Catálogo -> Portfolio) ─── */}
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          
          {/* 1. STOCK DISPONIBLE (Primero por defecto) */}
          <button
            type="button"
            onClick={() => handleTabChange("stock")}
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold font-sans transition-all cursor-pointer shadow-xs shrink-0",
              activeTab === "stock"
                ? "bg-terracota text-white shadow-sm"
                : "bg-surface text-chocolate border border-border/70 hover:bg-secondary/40",
            )}
          >
            <span>📦 Stock Disponible</span>
            <span className={cn("rounded-full px-1.5 py-0.2 text-[10px]", activeTab === "stock" ? "bg-white/25 text-white" : "bg-arena text-barro")}>
              {productosStock.length}
            </span>
          </button>

          {/* 2. CATÁLOGO (Nombre directo) */}
          <button
            type="button"
            onClick={() => handleTabChange("catalogo")}
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold font-sans transition-all cursor-pointer shadow-xs shrink-0",
              activeTab === "catalogo"
                ? "bg-terracota text-white shadow-sm"
                : "bg-surface text-chocolate border border-border/70 hover:bg-secondary/40",
            )}
          >
            <span>📋 Catálogo</span>
            <span className={cn("rounded-full px-1.5 py-0.2 text-[10px]", activeTab === "catalogo" ? "bg-white/25 text-white" : "bg-arena text-barro")}>
              {formatos.length}
            </span>
          </button>

          {/* 3. PORTFOLIO */}
          <button
            type="button"
            onClick={() => handleTabChange("portfolio")}
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold font-sans transition-all cursor-pointer shadow-xs shrink-0",
              activeTab === "portfolio"
                ? "bg-terracota text-white shadow-sm"
                : "bg-surface text-chocolate border border-border/70 hover:bg-secondary/40",
            )}
          >
            <span>🎨 Portfolio</span>
            <span className={cn("rounded-full px-1.5 py-0.2 text-[10px]", activeTab === "portfolio" ? "bg-white/25 text-white" : "bg-arena text-barro")}>
              {portfolio.length}
            </span>
          </button>

        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          PESTAÑA 1: STOCK DISPONIBLE (Lanzamiento para compra inmediata)
      ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "stock" && (
        <div className="space-y-6">
          <div className="bg-arena/25 border border-border/50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs sm:text-sm font-semibold text-chocolate">
                ✨ Piezas listas para entrega inmediata
              </p>
              <p className="text-xs text-muted font-sans mt-0.5">
                Piezas únicas y pequeñas ediciones listas para retirar en el momento o despachar en la semana.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleTabChange("catalogo")}
              className="text-xs font-semibold text-terracota hover:underline cursor-pointer self-start sm:self-auto shrink-0"
            >
              ¿Buscás hacer un encargo a medida? Ver Catálogo →
            </button>
          </div>

          {productosStock.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-3xl border border-border/60 bg-arena/25 p-8 space-y-3">
              <span className="text-4xl">{rubro === "ceramica" ? "🏺" : "🎨"}</span>
              <h3 className="text-lg font-medium font-serif text-chocolate">
                No hay piezas en stock de entrega inmediata actualmente
              </h3>
              <p className="max-w-md text-xs sm:text-sm text-barro font-sans leading-relaxed">
                Todas las piezas del último lanzamiento fueron adquiridas. Podés encargar cualquier formato desde el{" "}
                <strong className="font-bold text-chocolate">Catálogo</strong> y coordinar el diseño que más te guste.
              </p>
              <button
                type="button"
                onClick={() => handleTabChange("catalogo")}
                className="mt-2 rounded-full bg-terracota text-white px-5 py-2 text-xs font-semibold hover:bg-terracota/90 transition-all cursor-pointer shadow-xs"
              >
                {rubro === "ceramica" ? "Ver Catálogo de Formatos →" : "Ver Catálogo de Ilustraciones →"}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-5">
              {productosStock.map((producto) => (
                <ProductCard key={producto.id} producto={producto} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          PESTAÑA 2: CATÁLOGO DE PIEZAS BASE (Lista Interactiva con fotos grandes)
      ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "catalogo" && (
        <div className="space-y-6">
          
          {/* Micro-Tips Contextuales del PDF */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
            <div className="rounded-xl border border-border/60 bg-arena/30 p-3 text-left">
              <span className="text-base">🎨</span>
              <p className="text-xs font-semibold text-chocolate mt-1">Diseño a Elección</p>
              <p className="text-[11px] text-muted leading-tight">Elegí del portfolio o de mi Instagram.</p>
            </div>

            <div className="rounded-xl border border-border/60 bg-arena/30 p-3 text-left">
              <span className="text-base">⏱️</span>
              <p className="text-xs font-semibold text-chocolate mt-1">Plazo de Producción</p>
              <p className="text-[11px] text-muted leading-tight">Aprox. 30 días según demanda del taller.</p>
            </div>

            <div className="rounded-xl border border-border/60 bg-arena/30 p-3 text-left">
              <span className="text-base">🚚</span>
              <p className="text-xs font-semibold text-chocolate mt-1">Envíos Seguros</p>
              <p className="text-[11px] text-muted leading-tight">A todo el país vía encomienda (abona en destino).</p>
            </div>

            <div className="rounded-xl border border-border/60 bg-arena/30 p-3 text-left">
              <span className="text-base">🏷️</span>
              <p className="text-xs font-semibold text-chocolate mt-1">Descuentos Mayoristas</p>
              <p className="text-[11px] text-muted leading-tight">-10% (15u), -15% (20u), -20% (35u).</p>
            </div>
          </div>

          {/* Filtros de Categoría & Buscador */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por pieza o medida (ej. mate, 30x16, taza, cuenco)..."
                className="w-full sm:max-w-xs rounded-full border border-border/80 bg-surface px-4 py-2 text-xs font-sans text-foreground placeholder:text-muted focus:outline-hidden focus:ring-2 focus:ring-terracota/40 shadow-xs"
              />

              <p className="text-xs text-barro font-sans">
                {formatosFiltrados.length} {formatosFiltrados.length === 1 ? "pieza en catálogo" : "piezas en catálogo"}
              </p>
            </div>

            {categoriasUnicas.length > 0 && (
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setSelectedCategoria("todas")}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium font-sans transition-colors shrink-0 cursor-pointer shadow-2xs",
                    selectedCategoria === "todas"
                      ? "bg-chocolate text-crema-cruda font-semibold"
                      : "bg-surface text-muted border border-border/60 hover:bg-secondary/40",
                  )}
                >
                  Todas
                </button>
                {categoriasUnicas.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategoria(cat)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium font-sans transition-colors shrink-0 cursor-pointer shadow-2xs",
                      selectedCategoria === cat
                        ? "bg-chocolate text-crema-cruda font-semibold"
                        : "bg-surface text-muted border border-border/60 hover:bg-secondary/40",
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 📋 LISTA/TABLA DE FORMATOS (Con fotos amplias y click para ver grande) */}
          <div className="rounded-2xl border border-border/60 bg-surface divide-y divide-border/40 shadow-xs overflow-hidden">
            {formatosFiltrados.map((formato) => (
              <div
                key={formato.id}
                className="flex items-center justify-between gap-3 p-3.5 sm:p-4 hover:bg-arena/20 transition-colors"
              >
                {/* Info de la pieza + Foto grande */}
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  
                  {/* Foto de la pieza (más grande y clickeable) */}
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxImage({
                        url: formato.foto_url || "",
                        titulo: formato.nombre,
                        descripcion: `Medidas: ${formato.medidas || "Formato base"} · Precio base: ${formatPrecio(formato.precio_base)}`,
                      })
                    }
                    className="group/img relative flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-2xl bg-arena/40 border border-border/60 overflow-hidden shadow-2xs cursor-zoom-in transition-transform active:scale-95"
                    title="Click para ampliar foto"
                  >
                    {formato.foto_url ? (
                      <img
                        src={formato.foto_url}
                        alt={formato.nombre}
                        className="h-full w-full object-contain p-1 rounded-2xl group-hover/img:scale-105 transition-transform"
                      />
                    ) : (
                      <span className="text-2xl sm:text-3xl">{rubro === "ceramica" ? "🏺" : "🎨"}</span>
                    )}
                    <span className="absolute bottom-1 right-1 rounded-full bg-black/50 text-white p-0.5 text-[9px] opacity-0 group-hover/img:opacity-100 transition-opacity">
                      🔍
                    </span>
                  </button>

                  {/* Nombre y medidas */}
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs sm:text-sm font-semibold text-chocolate truncate">
                        {formato.nombre}
                      </p>
                      {formato.categoria && (
                        <span className="rounded-full bg-secondary/60 px-2 py-0.5 text-[10px] font-medium text-barro">
                          {formato.categoria}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted">
                      Medidas: <strong className="text-foreground font-medium">{formato.medidas || "A elección"}</strong>
                    </p>
                  </div>
                </div>

                {/* Precio y Botón Encargar */}
                <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
                  <span className="text-xs sm:text-sm font-bold text-chocolate font-mono">
                    {formatPrecio(formato.precio_base)}
                  </span>

                  <button
                    type="button"
                    onClick={() => abrirModalEncargo(formato)}
                    className="rounded-full bg-terracota text-white hover:bg-terracota/90 px-3.5 py-1.5 text-xs font-semibold shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1"
                  >
                    <span>Encargar</span>
                    <span>+</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ─── PESTAÑA 3: PORTFOLIO (Carrusel interactivo y lightbox completo) ─── */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "portfolio" && (
        <div className="space-y-6">
          <p className="text-xs sm:text-sm text-barro font-sans">
            Archivo visual de colecciones y estilos creados por Mili. Hacé clic en cualquier foto para verla en pantalla completa e inspirarte para tu próximo encargo:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {portfolio.map((coleccion) => (
              <PortfolioCarouselCard key={coleccion.id} coleccion={coleccion} rubro={rubro} />
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL / POPUP DE ENCARGO A MEDIDA (Con valor por defecto 'A coordinar por WhatsApp')
      ═══════════════════════════════════════════════════════════════════════ */}
      {encargoModalFormato && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-border/80 bg-surface p-5 sm:p-6 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200">
            
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <span className="text-[11px] font-semibold text-terracota uppercase tracking-wider">Encargo a Medida</span>
                <h3 className="text-lg font-serif font-medium text-chocolate">
                  {encargoModalFormato.nombre}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEncargoModalFormato(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-arena/50 text-muted hover:text-foreground cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-barro space-y-1 bg-arena/20 p-3 rounded-xl border border-border/40">
              <p>📐 <strong>Medidas:</strong> {encargoModalFormato.medidas || "Formato artesanal"}</p>
              <p>💰 <strong>Precio base:</strong> {formatPrecio(encargoModalFormato.precio_base)}</p>
            </div>

            {/* Selector de Diseño (Por defecto: A coordinar por WhatsApp) */}
            {/* Selector de Diseño (2 Opciones Claras y Directas) */}
            <div className="space-y-2.5">
              <label className="text-xs font-semibold text-chocolate block">
                🎨 ¿Cómo te gustaría el diseño?
              </label>

              <div className="space-y-2">
                {/* Opción 1: Colección / Catálogo */}
                <label className={cn(
                  "flex items-start gap-2.5 rounded-xl border p-3 text-xs transition-all cursor-pointer",
                  disenoTipo === "coleccion"
                    ? "border-terracota bg-terracota/10 font-semibold text-chocolate ring-1 ring-terracota/40 shadow-2xs"
                    : "border-border/60 bg-surface text-muted hover:border-terracota/40",
                )}>
                  <input
                    type="radio"
                    name="disenoTipo"
                    checked={disenoTipo === "coleccion"}
                    onChange={() => setDisenoTipo("coleccion")}
                    className="accent-terracota mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-foreground">🌿 Diseño de Catálogo / Colección</p>
                      <span className="text-[11px] font-bold text-chocolate bg-surface/90 px-2 py-0.5 rounded-md border border-border/40 shrink-0">
                        {formatPrecio(encargoModalFormato.precio_base)}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted font-normal mt-0.5">
                      Elegís cualquier diseño ya existente de Mili visto en la web o Instagram.
                    </p>
                  </div>
                </label>

                {/* Opción 2: Personalizado (+15%) */}
                <label className={cn(
                  "flex items-start gap-2.5 rounded-xl border p-3 text-xs transition-all cursor-pointer",
                  disenoTipo === "personalizado"
                    ? "border-terracota bg-terracota/10 font-semibold text-chocolate ring-1 ring-terracota/40 shadow-2xs"
                    : "border-border/60 bg-surface text-muted hover:border-terracota/40",
                )}>
                  <input
                    type="radio"
                    name="disenoTipo"
                    checked={disenoTipo === "personalizado"}
                    onChange={() => setDisenoTipo("personalizado")}
                    className="accent-terracota mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-foreground">✨ Diseño Personalizado Exclusivo (+15%)</p>
                      <span className="text-[11px] font-bold text-terracota bg-terracota/10 px-2 py-0.5 rounded-md border border-terracota/30 shrink-0">
                        {formatPrecio(encargoModalFormato.precio_base * 1.15)}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted font-normal mt-0.5">
                      Ilustración nueva a medida (nombres, mascotas, motivo especial).
                    </p>
                  </div>
                </label>
              </div>

              {/* Cartelito amigable */}
              <div className="flex items-start gap-2 rounded-xl bg-arena/30 p-2.5 text-[11px] text-barro border border-border/40 font-sans">
                <span className="text-sm shrink-0">💬</span>
                <p className="leading-snug">
                  El diseño exacto y los detalles se coordinan directamente con Mili por WhatsApp al confirmar.
                </p>
              </div>
            </div>

            {/* Cantidad */}
            <div className="flex items-center justify-between border-t border-border/40 pt-3">
              <span className="text-xs font-semibold text-chocolate">Cantidad:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCantidad((prev) => Math.max(1, prev - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface text-foreground font-bold cursor-pointer"
                >
                  -
                </button>
                <span className="w-8 text-center text-xs font-bold font-mono">{cantidad}</span>
                <button
                  type="button"
                  onClick={() => setCantidad((prev) => prev + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface text-foreground font-bold cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {/* Pop-up de Confirmación antes de ir a WhatsApp */}
            {confirmandoWhatsapp ? (
              <div className="rounded-2xl bg-arena/40 border border-terracota/40 p-3.5 space-y-2.5 animate-in fade-in duration-150">
                <p className="text-xs font-semibold text-chocolate">
                  💬 ¿Confirmar envío por WhatsApp?
                </p>
                <p className="text-[11px] text-barro">
                  Se abrirá tu WhatsApp para enviarle el mensaje a Mili con el encargo de <strong>{encargoModalFormato.nombre} x {cantidad}</strong>.
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={ejecutarEnvioWhatsapp}
                    className="flex-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 text-xs font-semibold shadow-xs cursor-pointer"
                  >
                    Confirmar y Abrir
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmandoWhatsapp(false)}
                    className="rounded-full border border-border bg-surface px-4 py-2 text-xs font-medium text-muted hover:text-foreground cursor-pointer"
                  >
                    Volver
                  </button>
                </div>
              </div>
            ) : (
              /* Botones de acción normales */
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleAgregarAlCarrito}
                  className={cn(
                    "w-full rounded-full py-2.5 text-xs font-semibold text-white transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2",
                    agregadoExitoso ? "bg-emerald-600" : "bg-chocolate hover:bg-chocolate/90",
                  )}
                >
                  {agregadoExitoso ? "✓ ¡Agregado al Carrito de Encargos!" : "Agregar al Carrito de Encargos"}
                </button>

                <button
                  type="button"
                  onClick={() => setConfirmandoWhatsapp(true)}
                  className="w-full rounded-full border border-terracota/40 bg-terracota/10 py-2.5 text-xs font-semibold text-terracota hover:bg-terracota hover:text-white transition-all shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Encargar directo por WhatsApp</span>
                  <span>↗</span>
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Lightbox / Popup con Zoom para Fotos */}
      <ImageLightbox
        images={
          lightboxImage
            ? [
                {
                  url: lightboxImage.url,
                  title: lightboxImage.titulo,
                  subtitle: lightboxImage.descripcion,
                },
              ]
            : []
        }
        isOpen={!!lightboxImage}
        onClose={() => setLightboxImage(null)}
      />

    </div>
  );
}
