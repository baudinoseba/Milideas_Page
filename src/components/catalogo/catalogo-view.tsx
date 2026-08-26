"use client";

import { useState } from "react";
import { ProductCard } from "@/components/product/product-card";
import { formatPrecio } from "@/lib/pricing";
import { cn } from "@/lib/utils/cn";
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
  
  // Estado para modal de encargo
  const [encargoModalFormato, setEncargoModalFormato] = useState<FormatoCatalogo | null>(null);
  const [cantidad, setCantidad] = useState<number>(1);
  const [disenoTipo, setDisenoTipo] = useState<"a_coordinar" | "portfolio" | "personalizado">("a_coordinar");
  const [nombreDisenoPortfolio, setNombreDisenoPortfolio] = useState<string>("");
  const [detallePersonalizado, setDetallePersonalizado] = useState<string>("");
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
    setDisenoTipo("a_coordinar");
    setNombreDisenoPortfolio(todosLosDisenos[0] || "Diseño a elección");
    setDetallePersonalizado("");
    setAgregadoExitoso(false);
    setConfirmandoWhatsapp(false);
  };

  const getDisenoTexto = () => {
    if (disenoTipo === "personalizado") {
      return `Personalizado (+15%): ${detallePersonalizado || "A coordinar"}`;
    }
    if (disenoTipo === "portfolio") {
      return `Diseño Portfolio: ${nombreDisenoPortfolio || "A elección"}`;
    }
    return "Diseño a coordinar por WhatsApp";
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

    window.open(`https://wa.me/5493493668308?text=${encodeURIComponent(mensaje)}`, "_blank");
    setEncargoModalFormato(null);
    setConfirmandoWhatsapp(false);
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* ─── Encabezado de Sección ─── */}
      <div className="border-b border-border/60 pb-5 space-y-3">
        <div className="flex items-center gap-2.5">
          <span className="text-3xl sm:text-4xl">{rubro === "ceramica" ? "🏺" : "🎨"}</span>
          <div>
            <h1 className="text-2xl sm:text-4xl font-serif font-medium text-chocolate">
              {rubro === "ceramica" ? "Cerámica de Autor" : "Ilustraciones"}
            </h1>
            <p className="text-xs sm:text-sm text-barro font-sans">
              {rubro === "ceramica"
                ? "Piezas listas en stock, catálogo de formatos para encargar y portfolio de colecciones."
                : "Láminas originales, cuadros enmarcados y diseños ilustrados por Mili Ferrero."}
            </p>
          </div>
        </div>

        {/* ─── Navegación de Secciones (Pestañas Claras en Orden: Stock -> Catálogo -> Portfolio) ─── */}
        <div className="flex gap-2 pt-2 overflow-x-auto scrollbar-none">
          
          {/* 1. STOCK DISPONIBLE (Primero por defecto) */}
          <button
            type="button"
            onClick={() => setActiveTab("stock")}
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
            onClick={() => setActiveTab("catalogo")}
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
            onClick={() => setActiveTab("portfolio")}
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
                Piezas únicas y pequeñas ediciones listas para despacho en 24-48 hs.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("catalogo")}
              className="text-xs font-semibold text-terracota hover:underline cursor-pointer self-start sm:self-auto shrink-0"
            >
              ¿Buscás hacer un encargo a medida? Ver Catálogo →
            </button>
          </div>

          {productosStock.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-3xl border border-border/60 bg-arena/25 p-8 space-y-3">
              <span className="text-4xl">🏺</span>
              <h3 className="text-lg font-medium font-serif text-chocolate">
                No hay piezas en stock de entrega inmediata actualmente
              </h3>
              <p className="max-w-md text-xs sm:text-sm text-barro font-sans leading-relaxed">
                Todas las piezas del último lanzamiento fueron adquiridas. Podés encargar cualquier formato desde el **Catálogo** y coordinar el diseño que más te guste.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("catalogo")}
                className="mt-2 rounded-full bg-terracota text-white px-5 py-2 text-xs font-semibold hover:bg-terracota/90 transition-all cursor-pointer shadow-xs"
              >
                Ver Catálogo de Formatos →
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
              <p className="text-[11px] text-muted leading-tight">Elegí del portfolio o de nuestro Instagram.</p>
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
                        className="h-full w-full object-cover rounded-2xl group-hover/img:scale-105 transition-transform"
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

      {/* ═══════════════════════════════════════════════════════════════════════
          PESTAÑA 3: PORTFOLIO (Galería visual limpia y lightbox para ver fotos)
      ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "portfolio" && (
        <div className="space-y-6">
          <p className="text-xs sm:text-sm text-barro font-sans">
            Archivo visual de colecciones y estilos creados por Mili. Hacé clic en cualquier foto para verla en pantalla completa e inspirarte para tu próximo encargo:
          </p>

          <div className="space-y-6">
            {portfolio.map((coleccion) => {
              const fotosList = Array.isArray(coleccion.fotos) && coleccion.fotos.length > 0
                ? coleccion.fotos
                : [coleccion.portada_url || ""].filter(Boolean);

              return (
                <div
                  key={coleccion.id}
                  className="rounded-2xl sm:rounded-3xl border border-border/60 bg-surface p-4 sm:p-6 shadow-xs space-y-4"
                >
                  <div className="border-b border-border/40 pb-2">
                    <h3 className="text-base sm:text-lg font-serif font-medium text-chocolate">
                      ✨ {coleccion.nombre}
                    </h3>
                    {coleccion.descripcion && (
                      <p className="text-xs text-barro font-sans mt-0.5">{coleccion.descripcion}</p>
                    )}
                  </div>

                  {/* Carrusel / Tira de fotos de la colección */}
                  {fotosList.length > 0 ? (
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                      {fotosList.map((fotoUrl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() =>
                            setLightboxImage({
                              url: fotoUrl,
                              titulo: coleccion.nombre,
                              descripcion: `Foto ${idx + 1} de ${fotosList.length}`,
                            })
                          }
                          className="group/photo relative h-28 w-28 sm:h-36 sm:w-36 shrink-0 rounded-2xl overflow-hidden bg-arena/30 border border-border/50 shadow-2xs cursor-zoom-in transition-transform hover:scale-105"
                        >
                          <img
                            src={fotoUrl}
                            alt={`${coleccion.nombre} ${idx + 1}`}
                            className="h-full w-full object-cover rounded-2xl"
                          />
                          <span className="absolute inset-0 bg-black/20 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold">
                            🔍 Ampliar
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-arena/20 border border-border/40 text-xs text-muted">
                      <span>🎨</span>
                      <span>Colección registrada. Las fotos de archivo se están digitalizando.</span>
                    </div>
                  )}
                </div>
              );
            })}
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
            <div className="space-y-2">
              <label className="text-xs font-semibold text-chocolate block">
                🎨 ¿Cómo te gustaría el diseño?
              </label>

              <div className="space-y-1.5">
                {/* Opción 1: A coordinar por WhatsApp (Por defecto) */}
                <label className={cn(
                  "flex items-center gap-2.5 rounded-xl border p-2.5 text-xs transition-all cursor-pointer",
                  disenoTipo === "a_coordinar"
                    ? "border-terracota bg-terracota/10 font-semibold text-chocolate ring-1 ring-terracota/40"
                    : "border-border/60 bg-surface text-muted",
                )}>
                  <input
                    type="radio"
                    name="disenoTipo"
                    checked={disenoTipo === "a_coordinar"}
                    onChange={() => setDisenoTipo("a_coordinar")}
                    className="accent-terracota"
                  />
                  <div>
                    <p className="font-semibold text-foreground">A coordinar por WhatsApp (Recomendado)</p>
                    <p className="text-[10px] text-muted">Hablamos directamente con Mili y acordamos el diseño</p>
                  </div>
                </label>

                {/* Opción 2: Elegir del Portfolio */}
                <label className={cn(
                  "flex items-center gap-2.5 rounded-xl border p-2.5 text-xs transition-all cursor-pointer",
                  disenoTipo === "portfolio"
                    ? "border-terracota bg-terracota/10 font-semibold text-chocolate ring-1 ring-terracota/40"
                    : "border-border/60 bg-surface text-muted",
                )}>
                  <input
                    type="radio"
                    name="disenoTipo"
                    checked={disenoTipo === "portfolio"}
                    onChange={() => setDisenoTipo("portfolio")}
                    className="accent-terracota"
                  />
                  <div>
                    <p className="font-semibold text-foreground">Diseño de una Colección</p>
                    <p className="text-[10px] text-muted">Elegir un diseño de los vistos en el Portfolio</p>
                  </div>
                </label>

                {/* Opción 3: Personalizado (+15%) */}
                <label className={cn(
                  "flex items-center gap-2.5 rounded-xl border p-2.5 text-xs transition-all cursor-pointer",
                  disenoTipo === "personalizado"
                    ? "border-terracota bg-terracota/10 font-semibold text-chocolate ring-1 ring-terracota/40"
                    : "border-border/60 bg-surface text-muted",
                )}>
                  <input
                    type="radio"
                    name="disenoTipo"
                    checked={disenoTipo === "personalizado"}
                    onChange={() => setDisenoTipo("personalizado")}
                    className="accent-terracota"
                  />
                  <div>
                    <p className="font-semibold text-foreground">Diseño Personalizado (+15%)</p>
                    <p className="text-[10px] text-muted">Visto en Instagram o composición exclusiva</p>
                  </div>
                </label>
              </div>

              {/* Detalle según selección */}
              {disenoTipo === "portfolio" && (
                <div className="pt-1">
                  <label className="text-[11px] text-muted block mb-1">Elegí el diseño:</label>
                  <select
                    value={nombreDisenoPortfolio}
                    onChange={(e) => setNombreDisenoPortfolio(e.target.value)}
                    className="w-full rounded-xl border border-border/80 bg-surface px-3 py-2 text-xs text-foreground focus:ring-2 focus:ring-terracota/40"
                  >
                    {todosLosDisenos.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                    <option value="Diseño visto en portfolio">Diseño visto en portfolio</option>
                  </select>
                </div>
              )}

              {disenoTipo === "personalizado" && (
                <div className="pt-1">
                  <label className="text-[11px] text-muted block mb-1">Describí tu idea o link de Instagram:</label>
                  <input
                    type="text"
                    value={detallePersonalizado}
                    onChange={(e) => setDetallePersonalizado(e.target.value)}
                    placeholder="ej. Motivo floral lila / link al post..."
                    className="w-full rounded-xl border border-border/80 bg-surface px-3 py-2 text-xs text-foreground focus:ring-2 focus:ring-terracota/40"
                  />
                </div>
              )}
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

      {/* ═══════════════════════════════════════════════════════════════════════
          LIGHTBOX / POPUP PARA AMPLIAR FOTOS (Tanto de catálogo como de portfolio)
      ═══════════════════════════════════════════════════════════════════════ */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200 cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-lg w-full rounded-3xl bg-surface p-4 shadow-2xl space-y-3 cursor-default"
          >
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black cursor-pointer z-10"
            >
              ✕
            </button>

            <div className="relative aspect-square sm:aspect-[4/3] rounded-2xl overflow-hidden bg-arena/30 flex items-center justify-center">
              {lightboxImage.url ? (
                <img
                  src={lightboxImage.url}
                  alt={lightboxImage.titulo}
                  className="h-full w-full object-contain rounded-2xl"
                />
              ) : (
                <span className="text-6xl">{rubro === "ceramica" ? "🏺" : "🎨"}</span>
              )}
            </div>

            <div className="px-1 text-center">
              <h4 className="text-base font-serif font-medium text-chocolate">
                {lightboxImage.titulo}
              </h4>
              {lightboxImage.descripcion && (
                <p className="text-xs text-muted font-sans mt-0.5">
                  {lightboxImage.descripcion}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
