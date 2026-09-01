"use client";

import { useState, useTransition, useMemo } from "react";
import { formatPrecio } from "@/lib/pricing";
import { FileImageUpload } from "@/components/admin/file-image-upload";
import {
  updateFormatoPrecioAction,
  saveFormatoAction,
  deleteFormatoAction,
  aumentarPreciosMasivoAction,
  savePortfolioColeccionAction,
  deletePortfolioColeccionAction,
  updateProductoStockInlineAction,
  saveStockPiezaDirectaAction,
  deleteStockPiezaDirectaAction,
  lanzarColeccionDropCompletaAction,
  publicarColeccionAction,
  publicarTodasLasColeccionesAction,
  togglePublicarProductoAction,
  saveCategoriaAction,
  deleteCategoriaAction,
} from "@/lib/actions";
import type {
  FormatoCatalogo,
  ProductoConImagenes,
  PortfolioColeccion,
  TipoRubro,
  Categoria,
} from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { toast } from "@/stores/toast-store";

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
  const [activeTab, setActiveTab] = useState<"stock" | "catalogo" | "portfolio">("stock");
  const [formatos, setFormatos] = useState<FormatoCatalogo[]>(initialFormatos);
  const [stockList, setStockList] = useState<ProductoConImagenes[]>(initialStock);
  const [portfolioList, setPortfolioList] = useState<PortfolioColeccion[]>(initialPortfolio);
  const [categoriasList, setCategoriasList] = useState<Categoria[]>(initialCategorias);
  const [isPending, startTransition] = useTransition();

  // Sub-filter inside Stock: Todos vs Publicados vs Borradores
  const [subFiltroStock, setSubFiltroStock] = useState<"todos" | "publicados" | "borradores">("todos");
  const [filtroColeccionStock, setFiltroColeccionStock] = useState<string>("todas");
  const [busquedaStock, setBusquedaStock] = useState<string>("");
  const [busquedaCatalogo, setBusquedaCatalogo] = useState<string>("");

  // ─── GESTIÓN DE CATEGORÍAS (MODAL & EDICIÓN) ───
  const [modalCategoriasAbierto, setModalCategoriasAbierto] = useState<boolean>(false);
  const [nuevaCategoriaInput, setNuevaCategoriaInput] = useState<string>("");
  const [categoriaEditandoId, setCategoriaEditandoId] = useState<string | null>(null);
  const [categoriaEditandoNombre, setCategoriaEditandoNombre] = useState<string>("");
  const [confirmDeleteCategoria, setConfirmDeleteCategoria] = useState<{ id: string; nombre: string } | null>(null);

  // ─── ESTADOS DE AUMENTO MASIVO EN CATÁLOGO ───
  const [porcentajeAumento, setPorcentajeAumento] = useState<string>("5");
  const [categoriaAumento, setCategoriaAumento] = useState<string>("todas");
  const [feedbackAumento, setFeedbackAumento] = useState<string | null>(null);

  // Modal estético de confirmación de Aumento Masivo
  const [confirmAumentoModal, setConfirmAumentoModal] = useState<{
    porcentaje: number;
    categoria: string;
    catTexto: string;
  } | null>(null);

  // ─── ESTADOS DE EDICIÓN INLINE CATÁLOGO ───
  const [preciosEditados, setPreciosEditados] = useState<Record<string, number>>({});
  const [guardadoId, setGuardadoId] = useState<string | null>(null);

  // ─── MODAL FORMATO (CATÁLOGO) ───
  const [modalFormato, setModalFormato] = useState<Partial<FormatoCatalogo> | null>(null);
  const [formatoFotoUrl, setFormatoFotoUrl] = useState<string>("");
  const [formatoPrecioInput, setFormatoPrecioInput] = useState<string>("20000");

  // ─── MODALES ESTÉTICOS DE ELIMINACIÓN ───
  const [confirmDeleteFormato, setConfirmDeleteFormato] = useState<{ id: string; nombre: string } | null>(null);
  const [confirmDeleteStock, setConfirmDeleteStock] = useState<{ id: string; nombre: string } | null>(null);
  const [confirmDeletePortfolio, setConfirmDeletePortfolio] = useState<{ id: string; nombre: string } | null>(null);

  // ─── MODAL PIEZA INDIVIDUAL DE STOCK ───
  const [modalStockPieza, setModalStockPieza] = useState<Partial<ProductoConImagenes> | null>(null);
  const [stockFotos, setStockFotos] = useState<string[]>([]);
  const [stockPublicarInmediato, setStockPublicarInmediato] = useState<boolean>(false);
  const [stockHechoEnTorno, setStockHechoEnTorno] = useState<boolean>(false);
  
  // Inputs fluidos
  const [stockPrecioInput, setStockPrecioInput] = useState<string>("20000");
  const [stockStockInput, setStockStockInput] = useState<string>("1");
  const [stockAltoInput, setStockAltoInput] = useState<string>("");
  const [stockAnchoInput, setStockAnchoInput] = useState<string>("");
  const [stockCapacidadInput, setStockCapacidadInput] = useState<string>("");

  // Categoría física en modal
  const [stockCategoriaSelect, setStockCategoriaSelect] = useState<string>("");
  const [stockCategoriaCustom, setStockCategoriaCustom] = useState<string>("");

  // Colección en modal
  const [stockColeccionSelect, setStockColeccionSelect] = useState<string>("");
  const [stockColeccionCustom, setStockColeccionCustom] = useState<string>("");

  // ─── MODAL NUEVA COLECCIÓN / DROP COMPLETO (SIEMPRE GUARDA EN BORRADOR) ───
  const [modalLanzarDrop, setModalLanzarDrop] = useState<boolean>(false);
  const [dropNombre, setDropNombre] = useState<string>("");
  const [dropDescripcion, setDropDescripcion] = useState<string>("");
  const [dropPiezas, setDropPiezas] = useState<
    Array<{
      id: string;
      nombre: string;
      categoriaSelect: string;
      categoriaCustom: string;
      precioStr: string;
      stockStr: string;
      altoStr: string;
      anchoStr: string;
      capacidadStr: string;
      hechoEnTorno: boolean;
      fotos: string[];
      descripcion: string;
    }>
  >([
    {
      id: "1",
      nombre: "",
      categoriaSelect: "",
      categoriaCustom: "",
      precioStr: "25000",
      stockStr: "1",
      altoStr: "",
      anchoStr: "",
      capacidadStr: "",
      hechoEnTorno: false,
      fotos: [],
      descripcion: "",
    },
  ]);

  // Modal Confirmación Lanzar Colección Guardada
  const [confirmLaunchColeccion, setConfirmLaunchColeccion] = useState<{ id: string; nombre: string; cant: number } | null>(null);
  const [confirmLaunchAll, setConfirmLaunchAll] = useState<boolean>(false);

  // ─── MODAL PORTFOLIO ───
  const [modalPortfolio, setModalPortfolio] = useState<Partial<PortfolioColeccion> | null>(null);
  const [portfolioFotos, setPortfolioFotos] = useState<string[]>([]);

  // ─── LIGHTBOX PREVIEW (ZOOM & ALTA RESOLUCIÓN) ───
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [galleryLightbox, setGalleryLightbox] = useState<{
    isOpen: boolean;
    images: { url: string; title?: string; tag?: string }[];
    initialIndex: number;
  }>({
    isOpen: false,
    images: [],
    initialIndex: 0,
  });

  const isCeramica = rubro === "ceramica";
  const tipoCatalogoDb = isCeramica ? "ceramica" : "ilustraciones";

  // Counts for KPIs
  const counts = useMemo(() => {
    const publicados = stockList.filter((p) => p.activo).length;
    const borradores = stockList.filter((p) => !p.activo).length;
    const coleccionesUnicas = new Set(stockList.map((p) => p.producciones?.nombre).filter(Boolean));
    return {
      totalStock: stockList.length,
      publicados,
      borradores,
      colecciones: coleccionesUnicas.size,
      catalogo: formatos.length,
    };
  }, [stockList, formatos]);

  // Lista de Colecciones registradas
  const coleccionesStockUnicas = Array.from(
    new Set([
      ...initialProducciones.map((p) => p.nombre),
      ...stockList.map((p) => p.producciones?.nombre).filter(Boolean),
    ]),
  ) as string[];

  // Lista de Categorías físicas registradas
  const categoriasFisicasUnicas = Array.from(
    new Set([
      ...categoriasList.map((c) => c.nombre),
      ...stockList.map((p) => p.categorias?.nombre).filter(Boolean),
      ...formatos.map((f) => f.categoria).filter(Boolean),
    ]),
  ).filter(Boolean) as string[];

  const categoriasUnicasCatalogo = Array.from(
    new Set(formatos.map((f) => f.categoria).filter(Boolean)),
  ) as string[];

  const normalizeText = (text: string | null | undefined): string => {
    if (!text) return "";
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  };

  // ─── FILTRADO DE FORMATOS (CATÁLOGO) ───
  const formatosFiltrados = useMemo(() => {
    const q = normalizeText(busquedaCatalogo);
    if (!q) return formatos;
    const words = q.split(/\s+/).filter(Boolean);
    return formatos.filter((f) => {
      const nombre = normalizeText(f.nombre);
      const cat = normalizeText(f.categoria);
      const med = normalizeText(f.medidas);
      const haystack = `${nombre} ${cat} ${med}`;
      return words.every((w) => haystack.includes(w));
    });
  }, [formatos, busquedaCatalogo]);

  // ─── AGRUPACIÓN DE STOCK POR COLECCIÓN (ORDENADO Y SEPARADO) ───
  const gruposStock = useMemo(() => {
    const queryTerm = normalizeText(busquedaStock);
    const queryWords = queryTerm ? queryTerm.split(/\s+/).filter(Boolean) : [];

    const piezasFiltradas = stockList.filter((p) => {
      // 1. Búsqueda por texto (nombre, descripción, categoría, colección, técnica, medidas, slug)
      if (queryWords.length > 0) {
        const nombreNorm = normalizeText(p.nombre);
        const descNorm = normalizeText(p.descripcion);
        const catNorm = normalizeText(p.categorias?.nombre);
        const colNorm = normalizeText(p.producciones?.nombre);
        const dimNorm = normalizeText(p.dimensiones);
        const tecnicaNorm = normalizeText(p.material_tecnica);
        const slugNorm = normalizeText(p.slug);

        const haystack = `${nombreNorm} ${descNorm} ${catNorm} ${colNorm} ${dimNorm} ${tecnicaNorm} ${slugNorm}`;
        const match = queryWords.every((word) => haystack.includes(word));
        if (!match) return false;
      }

      // 2. Filtro de estado (Publicados vs Borradores)
      if (subFiltroStock === "publicados" && !p.activo) return false;
      if (subFiltroStock === "borradores" && p.activo) return false;

      // 3. Filtro de colección
      if (filtroColeccionStock === "sin_coleccion" && p.producciones?.nombre) return false;
      if (filtroColeccionStock !== "todas" && filtroColeccionStock !== "sin_coleccion") {
        if (p.producciones?.nombre !== filtroColeccionStock) return false;
      }

      return true;
    });

    const mapGrupos = new Map<
      string,
      {
        id: string;
        nombre: string;
        esColeccion: boolean;
        piezas: ProductoConImagenes[];
        tieneBorradores: boolean;
        cantBorradores: number;
        cantPublicados: number;
      }
    >();

    for (const p of piezasFiltradas) {
      const colId = p.producciones?.id || (p.producciones?.nombre ? `col_${p.producciones.nombre}` : "__sin_coleccion__");
      const colNombre = p.producciones?.nombre || "Piezas Sueltas (Sin Colección)";
      const esColeccion = Boolean(p.producciones?.nombre);

      const existing = mapGrupos.get(colId) || {
        id: colId,
        nombre: colNombre,
        esColeccion,
        piezas: [],
        tieneBorradores: false,
        cantBorradores: 0,
        cantPublicados: 0,
      };

      existing.piezas.push(p);
      if (!p.activo) {
        existing.tieneBorradores = true;
        existing.cantBorradores++;
      } else {
        existing.cantPublicados++;
      }

      mapGrupos.set(colId, existing);
    }

    return Array.from(mapGrupos.values()).sort((a, b) => {
      if (a.id === "__sin_coleccion__") return 1;
      if (b.id === "__sin_coleccion__") return -1;
      if (a.tieneBorradores && !b.tieneBorradores) return -1;
      if (!a.tieneBorradores && b.tieneBorradores) return 1;
      return a.nombre.localeCompare(b.nombre);
    });
  }, [stockList, subFiltroStock, filtroColeccionStock, busquedaStock]);

  // ─── HANDLERS DE CATEGORÍAS ───
  const handleCrearCategoria = () => {
    if (!nuevaCategoriaInput.trim()) return;
    const nombre = nuevaCategoriaInput.trim();

    startTransition(async () => {
      const fd = new FormData();
      fd.set("nombre", nombre);
      fd.set("tipoCatalogo", tipoCatalogoDb);
      const res = await saveCategoriaAction(fd);
      if (res.success && res.categoria) {
        setCategoriasList((prev) => [...prev, res.categoria]);
        setNuevaCategoriaInput("");
        toast.success(`Categoría "${nombre}" creada con éxito`);
      } else if (!res.success) {
        toast.error(res.error || "Error al crear categoría");
      }
    });
  };

  const handleGuardarEdicionCategoria = (id: string) => {
    if (!categoriaEditandoNombre.trim()) return;
    const nombre = categoriaEditandoNombre.trim();

    startTransition(async () => {
      const fd = new FormData();
      fd.set("nombre", nombre);
      fd.set("tipoCatalogo", tipoCatalogoDb);
      const res = await saveCategoriaAction(fd, id);
      if (res.success) {
        setCategoriasList((prev) =>
          prev.map((c) => (c.id === id ? { ...c, nombre } : c))
        );
        setCategoriaEditandoId(null);
        setCategoriaEditandoNombre("");
        toast.success(`Categoría renombrada a "${nombre}"`);
      } else {
        toast.error(res.error || "Error al actualizar categoría");
      }
    });
  };

  const handleEliminarCategoriaConfirmado = (id: string) => {
    startTransition(async () => {
      const res = await deleteCategoriaAction(id);
      if (res.success) {
        setCategoriasList((prev) => prev.filter((c) => c.id !== id));
        setConfirmDeleteCategoria(null);
        toast.success("Categoría eliminada con éxito");
      } else {
        toast.error(res.error || "Error al eliminar categoría");
      }
    });
  };

  // ─── HANDLERS DE CATÁLOGO ───
  const abrirModalFormato = (formato?: FormatoCatalogo) => {
    if (formato) {
      setModalFormato(formato);
      setFormatoFotoUrl(formato.foto_url || "");
      setFormatoPrecioInput(String(formato.precio_base || 20000));
    } else {
      setModalFormato({ rubro, activo: true });
      setFormatoFotoUrl("");
      setFormatoPrecioInput("20000");
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
        toast.success("Precio actualizado correctamente");
      } else {
        toast.error(res.error || "Error al actualizar precio");
      }
    });
  };

  const handleSolicitarAumentoMasivo = () => {
    const p = parseFloat(porcentajeAumento);
    if (isNaN(p) || p === 0) {
      toast.error("Ingresá un porcentaje válido de aumento");
      return;
    }
    const catTexto = categoriaAumento === "todas" ? "TODAS las piezas" : `las piezas de "${categoriaAumento}"`;
    setConfirmAumentoModal({ porcentaje: p, categoria: categoriaAumento, catTexto });
  };

  const handleConfirmarAumentoMasivo = () => {
    if (!confirmAumentoModal) return;
    const { porcentaje: p, categoria: cat } = confirmAumentoModal;

    startTransition(async () => {
      const res = await aumentarPreciosMasivoAction(rubro, p, cat);
      if (res.success) {
        setFeedbackAumento(`✓ ¡Se actualizaron ${res.actualizados} piezas con +${p}%!`);
        const factor = 1 + p / 100;
        setFormatos((prev) =>
          prev.map((f) => {
            if (cat !== "todas" && f.categoria !== cat) return f;
            return { ...f, precio_base: Math.round(f.precio_base * factor) };
          }),
        );
        setConfirmAumentoModal(null);
        setTimeout(() => setFeedbackAumento(null), 4000);
        toast.success(`¡Se actualizaron los precios de ${res.actualizados} piezas (+${p}%)!`);
      } else {
        toast.error(res.error || "Error al aplicar aumento");
      }
    });
  };

  const handleGuardarFormatoModal = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("rubro", rubro);
    fd.set("fotoUrl", formatoFotoUrl);
    fd.set("precioBase", formatoPrecioInput);

    startTransition(async () => {
      const res = await saveFormatoAction(fd);
      if (res.success) {
        setModalFormato(null);
        toast.success("Modelo guardado en el catálogo con éxito");
        window.location.reload();
      } else {
        toast.error(res.error || "Error al guardar el modelo");
      }
    });
  };

  const handleEliminarFormatoConfirmado = (id: string) => {
    startTransition(async () => {
      const res = await deleteFormatoAction(id);
      if (res.success) {
        setFormatos((prev) => prev.filter((f) => f.id !== id));
        setConfirmDeleteFormato(null);
        toast.success("Modelo eliminado del catálogo");
      } else {
        toast.error(res.error || "Error al eliminar el modelo");
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
        toast.error(res.error || "Error al actualizar stock");
        window.location.reload();
      } else {
        toast.success(`Stock actualizado: ${nuevo} u.`);
      }
    });
  };

  const handleTogglePublicarPieza = (productoId: string, actualActivo: boolean) => {
    const nuevoActivo = !actualActivo;
    startTransition(async () => {
      const res = await togglePublicarProductoAction(productoId, nuevoActivo);
      if (res.success) {
        setStockList((prev) =>
          prev.map((p) => (p.id === productoId ? { ...p, activo: nuevoActivo } : p)),
        );
        toast.success(nuevoActivo ? "Pieza publicada en la tienda" : "Pieza guardada en borrador");
      } else {
        toast.error(res.error || "Error al cambiar estado");
      }
    });
  };

  const handleLanzarColeccionGuardada = (produccionId: string, nombreColeccion?: string) => {
    startTransition(async () => {
      const res = await publicarColeccionAction(produccionId, nombreColeccion);
      if (res.success) {
        setStockList((prev) =>
          prev.map((p) => {
            const matchesId = produccionId && p.producciones?.id === produccionId;
            const matchesNombre = nombreColeccion && p.producciones?.nombre === nombreColeccion;
            return matchesId || matchesNombre ? { ...p, activo: true } : p;
          }),
        );
        setConfirmLaunchColeccion(null);
        toast.success(`¡Colección "${nombreColeccion || ""}" publicada en la tienda!`);
      } else {
        toast.error(res.error || "Error al publicar la colección");
      }
    });
  };

  const handleLanzarTodasLasColecciones = () => {
    startTransition(async () => {
      const res = await publicarTodasLasColeccionesAction(isCeramica ? "ceramica" : "ilustracion");
      if (res.success) {
        setStockList((prev) => prev.map((p) => ({ ...p, activo: true })));
        setConfirmLaunchAll(false);
        toast.success("¡Todas las piezas y colecciones publicadas con éxito!");
      } else {
        toast.error(res.error || "Error al publicar todas las colecciones");
      }
    });
  };

  const abrirModalPiezaStock = (prod?: ProductoConImagenes, coleccionDefault?: string) => {
    if (prod) {
      setModalStockPieza(prod);
      setStockFotos(prod.producto_imagenes?.map((img) => img.url_imagen) || []);
      setStockCategoriaSelect(prod.categorias?.nombre || "");
      setStockCategoriaCustom("");
      setStockColeccionSelect(prod.producciones?.nombre || "");
      setStockColeccionCustom("");
      setStockPublicarInmediato(prod.activo);
      setStockHechoEnTorno(
        Boolean(
          prod.material_tecnica?.toLowerCase().includes("torno") ||
          (prod.atributos_especificos as any)?.hecho_en_torno
        )
      );
      setStockPrecioInput(String(prod.precio_base || 20000));
      setStockStockInput(String(prod.stock_disponible ?? 1));
      setStockAltoInput(prod.alto_cm ? String(prod.alto_cm) : "");
      setStockAnchoInput(prod.ancho_cm ? String(prod.ancho_cm) : "");
      setStockCapacidadInput(prod.capacidad_ml ? String(prod.capacidad_ml) : "");
    } else {
      setModalStockPieza({
        tipo_catalogo: isCeramica ? "ceramica" : "ilustraciones",
        activo: false,
      });
      setStockFotos([]);
      setStockCategoriaSelect("");
      setStockCategoriaCustom("");
      setStockColeccionSelect(coleccionDefault || (filtroColeccionStock !== "todas" && filtroColeccionStock !== "sin_coleccion" ? filtroColeccionStock : ""));
      setStockColeccionCustom("");
      setStockPublicarInmediato(false);
      setStockHechoEnTorno(false);
      setStockPrecioInput("20000");
      setStockStockInput("1");
      setStockAltoInput("");
      setStockAnchoInput("");
      setStockCapacidadInput("");
    }
  };

  const handleGuardarStockPiezaModal = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("rubro", rubro);
    fd.set("fotos", JSON.stringify(stockFotos));
    fd.set("activo", String(stockPublicarInmediato));
    fd.set("hechoEnTorno", String(stockHechoEnTorno));
    fd.set("precioBase", stockPrecioInput);
    fd.set("stockDisponible", stockStockInput);
    fd.set("altoCm", stockAltoInput);
    fd.set("anchoCm", stockAnchoInput);
    fd.set("capacidadMl", stockCapacidadInput);

    const catFinal = stockCategoriaSelect === "__custom__" ? stockCategoriaCustom.trim() : stockCategoriaSelect;
    fd.set("categoriaNombre", catFinal);

    const colFinal = stockColeccionSelect === "__custom__" ? stockColeccionCustom.trim() : stockColeccionSelect;
    fd.set("coleccionNombre", colFinal);

    if (modalStockPieza?.id) {
      fd.set("id", modalStockPieza.id);
    }

    startTransition(async () => {
      const res = await saveStockPiezaDirectaAction(fd);
      if (res.success) {
        setModalStockPieza(null);
        toast.success("Pieza de stock guardada con éxito");
        window.location.reload();
      } else {
        toast.error(res.error || "Error al guardar la pieza");
      }
    });
  };

  const handleEliminarStockConfirmado = (id: string) => {
    startTransition(async () => {
      const res = await deleteStockPiezaDirectaAction(id);
      if (res.success) {
        setStockList((prev) => prev.filter((p) => p.id !== id));
        setConfirmDeleteStock(null);
        toast.success("Pieza eliminada del stock");
      } else {
        toast.error(res.error || "Error al eliminar la pieza");
      }
    });
  };

  const handleGuardarDropEnBorrador = () => {
    if (!dropNombre.trim()) {
      toast.error("Por favor ingresá el nombre de la colección");
      return;
    }

    for (const p of dropPiezas) {
      if (!p.nombre.trim()) {
        toast.error("Todas las piezas deben tener un nombre");
        return;
      }
    }

    startTransition(async () => {
      const res = await lanzarColeccionDropCompletaAction({
        rubro: isCeramica ? "ceramica" : "ilustracion",
        nombreColeccion: dropNombre,
        descripcion: dropDescripcion,
        publicarInmediatamente: false,
        piezas: dropPiezas.map((p) => {
          const finalCat = p.categoriaSelect === "__custom__" ? p.categoriaCustom.trim() : p.categoriaSelect;
          return {
            nombre: p.nombre,
            categoriaNombre: finalCat || undefined,
            precioBase: Number(p.precioStr) || 20000,
            stock: Number(p.stockStr) || 1,
            altoCm: p.altoStr ? Number(p.altoStr) : null,
            anchoCm: p.anchoStr ? Number(p.anchoStr) : null,
            capacidadMl: p.capacidadStr ? Number(p.capacidadStr) : null,
            hechoEnTorno: p.hechoEnTorno,
            fotos: p.fotos,
            descripcion: p.descripcion || undefined,
          };
        }),
      });

      if (res.success) {
        setModalLanzarDrop(false);
        toast.success(`Colección "${dropNombre}" guardada en borrador`);
        window.location.reload();
      } else {
        toast.error(res.error || "Error al registrar la colección");
      }
    });
  };

  const handleAddDropPieza = () => {
    setDropPiezas((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        nombre: "",
        categoriaSelect: "",
        categoriaCustom: "",
        precioStr: "25000",
        stockStr: "1",
        altoStr: "",
        anchoStr: "",
        capacidadStr: "",
        hechoEnTorno: false,
        fotos: [],
        descripcion: "",
      },
    ]);
  };

  const handleRemoveDropPieza = (id: string) => {
    if (dropPiezas.length === 1) return;
    setDropPiezas((prev) => prev.filter((p) => p.id !== id));
  };

  const handleUpdateDropPieza = (id: string, fields: Partial<(typeof dropPiezas)[0]>) => {
    setDropPiezas((prev) => prev.map((p) => (p.id === id ? { ...p, ...fields } : p)));
  };

  // ─── HANDLERS DE PORTFOLIO ───
  const abrirModalPortfolio = (item?: PortfolioColeccion) => {
    if (item) {
      setModalPortfolio(item);
      const initialFotos =
        Array.isArray(item.fotos) && item.fotos.length > 0
          ? (item.fotos.filter(Boolean) as string[])
          : item.portada_url
            ? [item.portada_url]
            : [];
      setPortfolioFotos(initialFotos);
    } else {
      setModalPortfolio({ rubro, activa: true });
      setPortfolioFotos([]);
    }
  };

  const handleGuardarPortfolio = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("rubro", rubro);
    fd.set("fotos", JSON.stringify(portfolioFotos));
    fd.set("disenosDisponibles", JSON.stringify([]));

    if (modalPortfolio?.id) {
      fd.set("id", modalPortfolio.id);
    }

    startTransition(async () => {
      const res = await savePortfolioColeccionAction(fd);
      if (res.success) {
        setModalPortfolio(null);
        toast.success("Colección guardada en Portfolio con éxito");
        window.location.reload();
      } else {
        toast.error(res.error || "Error al guardar en portfolio");
      }
    });
  };

  const handleEliminarPortfolioConfirmado = (id: string) => {
    startTransition(async () => {
      const res = await deletePortfolioColeccionAction(id);
      if (res.success) {
        setPortfolioList((prev) => prev.filter((item) => item.id !== id));
        setConfirmDeletePortfolio(null);
        toast.success("Colección eliminada del portfolio");
      } else {
        toast.error(res.error || "Error al eliminar");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* ─── Header Limpio (Con Botón de Configuración de Categorías) ─── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{isCeramica ? "🏺" : "🎨"}</span>
          <h1 className="text-2xl font-serif font-bold text-chocolate">
            {isCeramica ? "Cerámica" : "Ilustración"}
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Botón de Categorías a la izquierda de Cargar Pieza Suelta */}
          <Button
            variant="outline"
            onClick={() => setModalCategoriasAbierto(true)}
            className="bg-white border-stone-300 text-stone-800 hover:bg-stone-100 rounded-xl text-xs font-semibold min-h-9 py-1 px-3.5 shadow-xs gap-1.5 cursor-pointer"
          >
            <span>⚙️</span>
            <span>Categorías</span>
          </Button>

          <Button
            onClick={() => abrirModalPiezaStock()}
            className="bg-chocolate text-crema-cruda hover:bg-chocolate/90 rounded-xl text-xs font-semibold min-h-9 py-1 px-3.5 shadow-xs gap-1.5 cursor-pointer"
          >
            <span>+ Cargar Pieza Suelta</span>
          </Button>

          <Button
            onClick={() => {
              setDropNombre("");
              setDropDescripcion("");
              setDropPiezas([
                {
                  id: "1",
                  nombre: "",
                  categoriaSelect: "",
                  categoriaCustom: "",
                  precioStr: "25000",
                  stockStr: "1",
                  altoStr: "",
                  anchoStr: "",
                  capacidadStr: "",
                  hechoEnTorno: false,
                  fotos: [],
                  descripcion: "",
                },
              ]);
              setModalLanzarDrop(true);
            }}
            className="bg-emerald-700 text-white hover:bg-emerald-800 rounded-xl text-xs font-bold min-h-9 py-1 px-3.5 shadow-xs gap-1.5 cursor-pointer"
          >
            <span>✨ Nueva Colección / Lanzamiento</span>
          </Button>
        </div>
      </div>

      {/* ─── KPI Summary Cards (Pastel High Contrast & Dark Text) ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => {
            setActiveTab("stock");
            setSubFiltroStock("publicados");
          }}
          className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
            activeTab === "stock" && subFiltroStock === "publicados"
              ? "bg-[#D1FAE5] border-emerald-600 shadow-xs ring-2 ring-emerald-500"
              : "bg-[#ECFDF5] border-emerald-300 hover:border-emerald-500"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black tracking-wide text-stone-900">
              1. En Tienda (Publicadas)
            </span>
            <span className="text-sm">✓</span>
          </div>
          <p className="text-2xl font-black font-sans mt-1 text-chocolate">
            {counts.publicados}
          </p>
          <p className="text-[11px] font-semibold text-stone-700">
            Visibles en la web pública
          </p>
        </button>

        <button
          onClick={() => {
            setActiveTab("stock");
            setSubFiltroStock("borradores");
          }}
          className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
            activeTab === "stock" && subFiltroStock === "borradores"
              ? "bg-[#FEF3C7] border-amber-600 shadow-xs ring-2 ring-amber-500"
              : "bg-[#FFFBEB] border-amber-300 hover:border-amber-500"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black tracking-wide text-stone-900">
              2. Borradores / Por Lanzar
            </span>
            <span className="text-sm">⏳</span>
          </div>
          <p className="text-2xl font-black font-sans mt-1 text-chocolate">
            {counts.borradores}
          </p>
          <p className="text-[11px] font-semibold text-stone-700">
            Guardadas para el estreno
          </p>
        </button>

        <button
          onClick={() => {
            setActiveTab("stock");
            setSubFiltroStock("todos");
          }}
          className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
            activeTab === "stock" && subFiltroStock === "todos"
              ? "bg-[#EDE9FE] border-violet-600 shadow-xs ring-2 ring-violet-500"
              : "bg-[#F5F3FF] border-violet-300 hover:border-violet-500"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black tracking-wide text-stone-900">
              3. Colecciones Activas
            </span>
            <span className="text-sm">✨</span>
          </div>
          <p className="text-2xl font-black font-sans mt-1 text-chocolate">
            {counts.colecciones}
          </p>
          <p className="text-[11px] font-semibold text-stone-700">
            Lanzamientos temáticos
          </p>
        </button>

        <button
          onClick={() => setActiveTab("catalogo")}
          className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
            activeTab === "catalogo"
              ? "bg-[#E0F2FE] border-sky-600 shadow-xs ring-2 ring-sky-500"
              : "bg-[#F0F9FF] border-sky-300 hover:border-sky-500"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black tracking-wide text-stone-900">
              {isCeramica ? "4. Catálogo de Cerámica" : "4. Catálogo de Ilustración"}
            </span>
            <span className="text-sm">📜</span>
          </div>
          <p className="text-2xl font-black font-sans mt-1 text-chocolate">
            {counts.catalogo}
          </p>
          <p className="text-[11px] font-semibold text-stone-700">
            Tarifas base y medidas
          </p>
        </button>
      </div>

      {/* ─── Main Tabs Navigation ─── */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab("stock")}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "stock"
              ? "bg-chocolate text-crema-cruda shadow-xs"
              : "bg-surface text-stone-700 hover:bg-stone-100 border border-border/60"
          }`}
        >
          📦 Stock Inmediato & Colecciones ({counts.totalStock})
        </button>
        <button
          onClick={() => setActiveTab("catalogo")}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "catalogo"
              ? "bg-chocolate text-crema-cruda shadow-xs"
              : "bg-surface text-stone-700 hover:bg-stone-100 border border-border/60"
          }`}
        >
          📜 {isCeramica ? "Catálogo de Cerámica" : "Catálogo de Ilustración"} ({counts.catalogo})
        </button>
        <button
          onClick={() => setActiveTab("portfolio")}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "portfolio"
              ? "bg-chocolate text-crema-cruda shadow-xs"
              : "bg-surface text-stone-700 hover:bg-stone-100 border border-border/60"
          }`}
        >
          🌟 Portfolio & Archivo ({portfolioList.length})
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ─── TAB 1: STOCK INMEDIATO ORGANIZADO POR COLECCIÓN ─── */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "stock" && (
        <div className="space-y-6">
          {/* Sub-filtros de Stock (Todos, Publicados, Borradores) + Selector de Colección */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E5E0D8]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-chocolate font-serif mr-1">Filtrar Estado:</span>
              <button
                onClick={() => setSubFiltroStock("todos")}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  subFiltroStock === "todos"
                    ? "bg-chocolate text-crema-cruda shadow-xs"
                    : "bg-white text-stone-700 hover:bg-stone-100 border border-stone-200"
                }`}
              >
                Todos ({counts.totalStock})
              </button>
              <button
                onClick={() => setSubFiltroStock("publicados")}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  subFiltroStock === "publicados"
                    ? "bg-emerald-700 text-white shadow-xs"
                    : "bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-200"
                }`}
              >
                ✓ Publicados ({counts.publicados})
              </button>
              <button
                onClick={() => setSubFiltroStock("borradores")}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  subFiltroStock === "borradores"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-white text-amber-900 hover:bg-amber-50 border border-amber-200"
                }`}
              >
                ⏳ Borradores ({counts.borradores})
              </button>

              {counts.borradores > 0 && (
                <Button
                  onClick={() => setConfirmLaunchAll(true)}
                  className="bg-emerald-700 text-white hover:bg-emerald-800 text-xs font-bold rounded-xl min-h-8 py-1 px-3 shadow-xs gap-1.5 cursor-pointer animate-in fade-in"
                >
                  <span>🚀 Publicar Todos los Borradores ({counts.borradores})</span>
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {/* Dropdown Colección */}
              <select
                value={filtroColeccionStock}
                onChange={(e) => setFiltroColeccionStock(e.target.value)}
                className="rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-800 focus:outline-none focus:ring-1 focus:ring-chocolate"
              >
                <option value="todas">✨ Todas las Colecciones</option>
                <option value="sin_coleccion">Piezas Sueltas (Sin colección)</option>
                {coleccionesStockUnicas.map((col) => (
                  <option key={col} value={col}>
                    📁 {col}
                  </option>
                ))}
              </select>

              {/* Búsqueda por texto */}
              <div className="relative w-full sm:w-48">
                <Input
                  value={busquedaStock}
                  onChange={(e) => setBusquedaStock(e.target.value)}
                  placeholder="Buscar pieza..."
                  className="text-xs rounded-xl bg-white pl-7 h-8"
                />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs">🔍</span>
                {busquedaStock && (
                  <button
                    onClick={() => setBusquedaStock("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Secciones Agrupadas por Colección */}
          {gruposStock.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#E5E0D8] bg-[#FAF7F2] p-12 text-center text-muted space-y-2">
              <span className="text-4xl block mb-2">{isCeramica ? "🏺" : "🎨"}</span>
              <p className="text-sm font-semibold text-stone-800">
                {busquedaStock.trim()
                  ? `No se encontraron piezas que coincidan con "${busquedaStock}"`
                  : "No se encontraron piezas en esta sección"}
              </p>
              <p className="text-xs text-stone-600">
                {busquedaStock.trim()
                  ? "Probá con otro término o limpiá el buscador para ver todo el inventario."
                  : "Podés crear una nueva pieza suelta o cargar una colección completa con los botones superiores."}
              </p>
              {busquedaStock.trim() && (
                <div className="pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setBusquedaStock("")}
                    className="rounded-xl text-xs min-h-8 py-1 px-3 cursor-pointer"
                  >
                    ✕ Limpiar búsqueda
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {gruposStock.map((grupo) => {
                const esColBorrador = grupo.esColeccion && grupo.tieneBorradores;

                return (
                  <div
                    key={grupo.id}
                    className={`rounded-3xl border p-5 space-y-4 transition-all shadow-xs ${
                      esColBorrador
                        ? "bg-[#FFFDF9] border-amber-300 ring-2 ring-amber-400/20"
                        : "bg-[#FAF7F2]/60 border-[#E5E0D8]"
                    }`}
                  >
                    {/* Header de la Colección */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E0D8] pb-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-2xl">{grupo.esColeccion ? "📁" : "✨"}</span>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-bold text-chocolate font-serif">
                              {grupo.esColeccion ? `Colección: "${grupo.nombre}"` : grupo.nombre}
                            </h3>

                            {esColBorrador && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                ⏳ {grupo.cantBorradores} piezas en borrador
                              </span>
                            )}

                            {grupo.cantPublicados > 0 && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                ✓ {grupo.cantPublicados} en tienda
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Botones de acción del grupo de colección */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {esColBorrador && (
                          <Button
                            onClick={() =>
                              setConfirmLaunchColeccion({
                                id: grupo.piezas[0]?.producciones?.id || grupo.id,
                                nombre: grupo.nombre,
                                cant: grupo.cantBorradores,
                              })
                            }
                            className="bg-emerald-700 text-white hover:bg-emerald-800 text-xs font-bold rounded-xl min-h-8 py-1 px-3.5 shadow-xs gap-1.5 cursor-pointer"
                          >
                            <span>🚀 Lanzar Colección a la Tienda</span>
                          </Button>
                        )}

                        {grupo.esColeccion && (
                          <Button
                            variant="outline"
                            onClick={() => abrirModalPiezaStock(undefined, grupo.nombre)}
                            className="text-xs rounded-xl h-8 py-1 px-3 font-semibold text-stone-800 border-stone-300 hover:bg-white"
                          >
                            + Agregar pieza a esta colección
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Grid de Piezas de esta Colección */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {grupo.piezas.map((prod) => {
                        const fotoPrincipal = prod.producto_imagenes?.[0]?.url_imagen || null;
                        const esTorneado = Boolean(
                          prod.material_tecnica?.toLowerCase().includes("torno") ||
                          (prod.atributos_especificos as any)?.hecho_en_torno
                        );

                        return (
                          <div
                            key={prod.id}
                            className={`rounded-3xl border p-4 transition-all shadow-xs flex flex-col justify-between space-y-3 ${
                              prod.activo
                                ? "bg-white border-[#E5E0D8] hover:border-emerald-500/50"
                                : "bg-[#FFFDF9] border-amber-300 ring-1 ring-amber-400/30"
                            }`}
                          >
                            {/* Header de la tarjeta */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {prod.activo ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    ✓ Publicado
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                    ⏳ Borrador
                                  </span>
                                )}

                                {isCeramica && esTorneado && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF0DC] text-[#785418] border border-[#ECD7B2]">
                                    🏺 Torno
                                  </span>
                                )}

                                {prod.marco_incluido && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-800 border border-stone-300">
                                    🖼️ Marco
                                  </span>
                                )}
                              </div>

                              <span className="text-base font-bold text-stone-900 font-sans tracking-tight whitespace-nowrap">
                                {formatPrecio(prod.precio_base)}
                              </span>
                            </div>

                            {/* Foto e información */}
                            <div className="flex gap-3.5 items-start">
                              {fotoPrincipal ? (
                                <div
                                  onClick={() => setPreviewImage(fotoPrincipal)}
                                  className="h-20 w-20 rounded-2xl bg-stone-50 border border-[#E5E0D8] shrink-0 overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-85 transition-opacity p-1 group"
                                  title="Clic para ampliar imagen"
                                >
                                  <img
                                    src={fotoPrincipal}
                                    alt={prod.nombre}
                                    className="max-h-full max-w-full object-contain rounded-xl"
                                  />
                                </div>
                              ) : (
                                <div className="h-20 w-20 rounded-2xl bg-arena/30 border border-dashed border-[#E5E0D8] flex items-center justify-center text-xl shrink-0 text-muted">
                                  {isCeramica ? "🏺" : "🎨"}
                                </div>
                              )}

                              <div className="space-y-1 flex-1 min-w-0">
                                <h4 className="font-bold text-stone-900 text-sm leading-tight truncate">
                                  {prod.nombre}
                                </h4>

                                {prod.categorias?.nombre && (
                                  <p className="text-[11px] font-semibold text-stone-600">
                                    🏷️ {prod.categorias.nombre}
                                  </p>
                                )}

                                {prod.dimensiones && (
                                  <p className="text-[11px] text-stone-600">📐 {prod.dimensiones}</p>
                                )}
                              </div>
                            </div>

                            {/* Control de Stock */}
                            <div className="p-2.5 rounded-2xl bg-[#FAF7F2] border border-[#E5E0D8] flex items-center justify-between text-xs">
                              <div>
                                <span className="text-[10px] text-stone-600 uppercase font-semibold block">Stock Disponible</span>
                                <span className={`text-sm font-bold font-sans ${prod.stock_disponible > 0 ? "text-emerald-800" : "text-red-600 font-bold"}`}>
                                  {prod.stock_disponible > 0 ? `${prod.stock_disponible} unid.` : "Sin stock"}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <Button
                                  variant="outline"
                                  disabled={isPending || prod.stock_disponible <= 0}
                                  onClick={() => handleModificarStockRapido(prod.id, -1)}
                                  className="h-7 w-7 rounded-xl p-0 text-xs font-bold text-stone-700"
                                  title="Restar 1 al stock"
                                >
                                  -
                                </Button>
                                <Button
                                  variant="outline"
                                  disabled={isPending}
                                  onClick={() => handleModificarStockRapido(prod.id, 1)}
                                  className="h-7 w-7 rounded-xl p-0 text-xs font-bold text-stone-700"
                                  title="Sumar 1 al stock"
                                >
                                  +
                                </Button>
                              </div>
                            </div>

                            {/* Footer de Acciones */}
                            <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-[#F0EDE8]">
                              <button
                                type="button"
                                onClick={() => handleTogglePublicarPieza(prod.id, prod.activo)}
                                disabled={isPending}
                                className={`text-[11px] px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer border ${
                                  prod.activo
                                    ? "bg-white text-stone-700 hover:bg-stone-100 border-stone-300"
                                    : "bg-emerald-700 text-white hover:bg-emerald-800 border-emerald-800 shadow-xs"
                                }`}
                              >
                                {prod.activo ? "⏸️ Ocultar" : "🚀 Publicar"}
                              </button>

                              <div className="flex items-center gap-1">
                                <Button
                                  variant="outline"
                                  onClick={() => abrirModalPiezaStock(prod)}
                                  className="text-[11px] rounded-xl h-7 py-0.5 px-2.5 font-semibold text-stone-800 hover:bg-stone-100 border-stone-300"
                                  title="Editar pieza"
                                >
                                  ✏️ Editar
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => setConfirmDeleteStock({ id: prod.id, nombre: prod.nombre })}
                                  className="text-[11px] rounded-xl h-7 py-0.5 px-2 text-red-600 hover:bg-red-50 border-red-200"
                                  title="Eliminar pieza"
                                >
                                  🗑️
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ─── TAB 2: CATÁLOGO DE TARIFAS (CERÁMICA / ILUSTRACIÓN) ─── */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "catalogo" && (
        <div className="space-y-6">
          {/* Header Catálogo, Buscador y Botón Nueva Tarifa */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-3xl bg-[#FAF7F2] border border-[#E5E0D8]">
            <h3 className="text-base font-bold text-chocolate font-serif">
              Tarifario Base de {isCeramica ? "Cerámica" : "Ilustración"}
            </h3>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {/* Buscador de catálogo */}
              <div className="relative w-full sm:w-56">
                <Input
                  value={busquedaCatalogo}
                  onChange={(e) => setBusquedaCatalogo(e.target.value)}
                  placeholder="Buscar modelo o medida..."
                  className="text-xs rounded-xl bg-white pl-7 h-8"
                />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs">🔍</span>
                {busquedaCatalogo && (
                  <button
                    onClick={() => setBusquedaCatalogo("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              <Button
                onClick={() => abrirModalFormato()}
                className="bg-chocolate text-crema-cruda hover:bg-chocolate/90 text-xs font-semibold rounded-xl min-h-8 py-1 px-3.5 shadow-xs shrink-0 cursor-pointer"
              >
                + Agregar al Catálogo
              </Button>
            </div>
          </div>

          {/* Panel de Aumento Masivo de Precios */}
          <div className="p-4 rounded-3xl bg-arena/20 border border-border/60 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">📈</span>
              <h4 className="text-xs font-bold text-chocolate uppercase tracking-wider">
                Ajuste Masivo de Precios en Catálogo
              </h4>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-medium text-stone-700 whitespace-nowrap">Aumentar un</span>
                <input
                  type="number"
                  value={porcentajeAumento}
                  onChange={(e) => setPorcentajeAumento(e.target.value)}
                  className="w-20 rounded-xl text-xs bg-white text-center font-bold border border-stone-300 h-9 outline-none focus:ring-1 focus:ring-chocolate"
                />
                <span className="text-xs font-medium text-stone-700">% a</span>
              </div>

              <select
                value={categoriaAumento}
                onChange={(e) => setCategoriaAumento(e.target.value)}
                className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-800 w-full sm:w-auto"
              >
                <option value="todas">Todas las categorías del catálogo</option>
                {categoriasUnicasCatalogo.map((cat) => (
                  <option key={cat} value={cat}>
                    Solo categoría &ldquo;{cat}&rdquo;
                  </option>
                ))}
              </select>

              <Button
                disabled={isPending}
                onClick={handleSolicitarAumentoMasivo}
                className="bg-chocolate text-crema-cruda hover:bg-chocolate/90 rounded-xl text-xs font-bold min-h-9 py-1 px-4 shadow-xs shrink-0 w-full sm:w-auto cursor-pointer"
              >
                Aplicar Aumento
              </Button>
            </div>

            {feedbackAumento && (
              <p className="text-xs font-bold text-emerald-800 animate-in fade-in">
                {feedbackAumento}
              </p>
            )}
          </div>

          {/* Tabla de Tarifas de Catálogo */}
          <div className="rounded-3xl border border-[#E5E0D8] bg-white overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E5E0D8] bg-[#FAF7F2] text-[11px] font-bold text-stone-700">
                  <th className="py-3 px-4">Pieza / Modelo</th>
                  <th className="py-3 px-3">Categoría</th>
                  <th className="py-3 px-3">Medidas Sugeridas</th>
                  <th className="py-3 px-4 text-center">Precio Base (ARS)</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EDE8]">
                {formatosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-stone-500 italic">
                      No se encontraron modelos que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  formatosFiltrados.map((f) => {
                  const editado = preciosEditados[f.id];
                  const valorActual = editado !== undefined ? editado : f.precio_base;
                  const hayCambio = editado !== undefined && editado !== f.precio_base;

                  return (
                    <tr key={f.id} className="hover:bg-[#FAF7F2] transition-colors">
                      <td className="py-3 px-4 font-bold text-stone-950">
                        <div className="flex items-center gap-3">
                          {f.foto_url ? (
                            <div
                              onClick={() => setPreviewImage(f.foto_url!)}
                              className="h-12 w-12 rounded-xl bg-stone-50 border border-[#E5E0D8] shrink-0 overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-85 transition-opacity p-0.5 shadow-2xs"
                              title="Clic para ampliar foto"
                            >
                              <img
                                src={f.foto_url}
                                alt={f.nombre}
                                className="max-h-full max-w-full object-contain rounded-lg"
                              />
                            </div>
                          ) : (
                            <div className="h-12 w-12 rounded-xl bg-arena/30 border border-dashed border-[#E5E0D8] flex items-center justify-center text-lg shrink-0 text-muted">
                              {isCeramica ? "🏺" : "🎨"}
                            </div>
                          )}
                          <span className="truncate text-stone-900 text-sm font-semibold">{f.nombre}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[10px] font-semibold text-stone-700 border border-stone-200">
                          {f.categoria || "General"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-stone-600">
                        {f.medidas || "-"}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 justify-center">
                          <span className="text-stone-500 font-bold text-xs">$</span>
                          <input
                            type="number"
                            value={valorActual}
                            onChange={(e) =>
                              setPreciosEditados((prev) => ({
                                ...prev,
                                [f.id]: Number(e.target.value),
                              }))
                            }
                            className="w-28 text-center rounded-xl text-sm font-bold text-stone-900 bg-[#FAF7F2] hover:bg-white focus:bg-white border border-[#E5E0D8] focus:border-chocolate focus:ring-1 focus:ring-chocolate h-8 px-2 outline-none transition-all"
                          />
                          {hayCambio && (
                            <Button
                              onClick={() => handleGuardarPrecioInline(f.id)}
                              className="h-8 px-3 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs cursor-pointer"
                            >
                              Guardar
                            </Button>
                          )}
                          {guardadoId === f.id && (
                            <span className="text-emerald-700 text-sm font-bold">✓</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                        <Button
                          variant="outline"
                          onClick={() => abrirModalFormato(f)}
                          className="text-[11px] rounded-xl h-7 py-0.5 px-2 text-stone-800 border-stone-300"
                        >
                          ✏️
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setConfirmDeleteFormato({ id: f.id, nombre: f.nombre })}
                          className="text-[11px] rounded-xl h-7 py-0.5 px-2 text-red-600 border-red-200 hover:bg-red-50"
                        >
                          🗑️
                        </Button>
                      </td>
                    </tr>
                  );
                }))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ─── TAB 3: PORTFOLIO & ARCHIVO (SIN PIEZAS INCLUIDAS) ─── */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "portfolio" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-3xl bg-[#FAF7F2] border border-[#E5E0D8]">
            <h3 className="text-base font-bold text-chocolate font-serif">
              Portfolio & Archivo Histórico
            </h3>

            <Button
              onClick={() => abrirModalPortfolio()}
              className="bg-chocolate text-crema-cruda hover:bg-chocolate/90 text-xs font-semibold rounded-xl min-h-9 py-1 px-3.5 shadow-xs"
            >
              + Agregar Colección al Portfolio
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {portfolioList.map((item) => (
              <AdminPortfolioCard
                key={item.id}
                item={item}
                onEdit={() => abrirModalPortfolio(item)}
                onDelete={() => setConfirmDeletePortfolio({ id: item.id, nombre: item.nombre })}
                onOpenLightbox={(fotos, idx, title) => {
                  setGalleryLightbox({
                    isOpen: true,
                    images: fotos.map((url, i) => ({
                      url,
                      title,
                      tag: `Foto ${i + 1} de ${fotos.length}`,
                    })),
                    initialIndex: idx,
                  });
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ─── MODAL ESTÉTICO: CONFIGURACIÓN Y GESTIÓN DE CATEGORÍAS ─── */}
      {modalCategoriasAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-border/50 pb-3">
              <div>
                <h3 className="text-base font-serif font-bold text-chocolate flex items-center gap-2">
                  <span>⚙️</span>
                  <span>Categorías de {isCeramica ? "Cerámica" : "Ilustración"}</span>
                </h3>
                <p className="text-xs text-stone-600 mt-0.5">
                  Creá, editá o eliminá las categorías físicas de este rubro.
                </p>
              </div>
              <button
                onClick={() => {
                  setModalCategoriasAbierto(false);
                  setCategoriaEditandoId(null);
                }}
                className="text-stone-400 hover:text-stone-900 text-base font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Formulario rápido para agregar categoría */}
            <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E5E0D8] space-y-2">
              <label className="text-xs font-bold text-stone-900 block">
                + Nueva Categoría
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={nuevaCategoriaInput}
                  onChange={(e) => setNuevaCategoriaInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCrearCategoria();
                    }
                  }}
                  placeholder="ej. Tazas, Cuencos, Platos, Mates..."
                  className="flex-1 rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-900 outline-none focus:ring-1 focus:ring-chocolate"
                />
                <Button
                  type="button"
                  disabled={isPending || !nuevaCategoriaInput.trim()}
                  onClick={handleCrearCategoria}
                  className="bg-chocolate text-crema-cruda hover:bg-chocolate/90 text-xs font-bold rounded-xl h-8 px-3.5 shadow-xs cursor-pointer shrink-0"
                >
                  {isPending ? "Guardando..." : "Agregar"}
                </Button>
              </div>
            </div>

            {/* Listado de Categorías Existentes */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-stone-900 block font-serif">
                Categorías Registradas ({categoriasList.length})
              </span>

              {categoriasList.length === 0 ? (
                <p className="text-xs text-stone-500 italic p-4 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                  No hay categorías registradas en {isCeramica ? "cerámica" : "ilustración"}.
                </p>
              ) : (
                <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                  {categoriasList.map((cat) => {
                    const cantPiezas = stockList.filter(
                      (p) => p.categorias?.nombre?.toLowerCase() === cat.nombre.toLowerCase()
                    ).length;

                    const estaEditando = categoriaEditandoId === cat.id;

                    return (
                      <div
                        key={cat.id}
                        className="flex items-center justify-between gap-3 p-3 hover:bg-[#FAF7F2]/50 transition-colors"
                      >
                        {estaEditando ? (
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="text"
                              value={categoriaEditandoNombre}
                              onChange={(e) => setCategoriaEditandoNombre(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleGuardarEdicionCategoria(cat.id);
                                }
                              }}
                              className="flex-1 rounded-xl border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-900 outline-none focus:ring-1 focus:ring-chocolate"
                              autoFocus
                            />
                            <Button
                              type="button"
                              onClick={() => handleGuardarEdicionCategoria(cat.id)}
                              disabled={isPending || !categoriaEditandoNombre.trim()}
                              className="bg-emerald-700 text-white hover:bg-emerald-800 text-xs rounded-xl h-7 px-2.5 font-bold"
                            >
                              ✓
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setCategoriaEditandoId(null);
                                setCategoriaEditandoNombre("");
                              }}
                              className="text-xs rounded-xl h-7 px-2"
                            >
                              ✕
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-base">🏷️</span>
                              <span className="text-xs font-bold text-stone-900 truncate">
                                {cat.nombre}
                              </span>
                              <span className="text-[10px] text-stone-500 font-semibold px-2 py-0.5 rounded-full bg-stone-100 border border-stone-200">
                                {cantPiezas} {cantPiezas === 1 ? "pieza" : "piezas"}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setCategoriaEditandoId(cat.id);
                                  setCategoriaEditandoNombre(cat.nombre);
                                }}
                                className="text-[11px] rounded-xl h-7 py-0.5 px-2 text-stone-800 border-stone-300 hover:bg-stone-100"
                                title="Renombrar categoría"
                              >
                                ✏️ Renombrar
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                  setConfirmDeleteCategoria({ id: cat.id, nombre: cat.nombre })
                                }
                                className="text-[11px] rounded-xl h-7 py-0.5 px-2 text-red-600 border-red-200 hover:bg-red-50"
                                title="Eliminar categoría"
                              >
                                🗑️
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-border/50">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setModalCategoriasAbierto(false);
                  setCategoriaEditandoId(null);
                }}
                className="rounded-xl text-xs min-h-9 py-1 px-4"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL CONFIRMACIÓN: ELIMINAR CATEGORÍA ─── */}
      {confirmDeleteCategoria && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-serif font-bold text-stone-950 flex items-center gap-2">
              <span className="text-red-600">🗑️</span>
              <span>Eliminar Categoría</span>
            </h3>
            <p className="text-xs text-stone-700">
              ¿Seguro que deseás eliminar la categoría <strong>&ldquo;{confirmDeleteCategoria.nombre}&rdquo;</strong>?
            </p>
            <p className="text-[11px] text-stone-500 italic">
              Las piezas existentes no se borrarán, pero dejarán de tener esta categoría asignada.
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
              <Button
                variant="outline"
                onClick={() => setConfirmDeleteCategoria(null)}
                className="rounded-xl text-xs min-h-9 py-1 px-3"
              >
                Cancelar
              </Button>
              <Button
                disabled={isPending}
                onClick={() => handleEliminarCategoriaConfirmado(confirmDeleteCategoria.id)}
                className="bg-red-600 text-white hover:bg-red-700 rounded-xl text-xs font-bold min-h-9 py-1 px-4 shadow-xs"
              >
                {isPending ? "Eliminando..." : "Eliminar Definitivamente"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL ESTÉTICO: CONFIRMACIÓN DE AUMENTO MASIVO ─── */}
      {confirmAumentoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-serif font-bold text-stone-950 flex items-center gap-2">
              <span>📈</span>
              <span>Confirmar Aumento de Precios</span>
            </h3>
            <div className="space-y-2 text-xs text-stone-700">
              <p>
                ¿Confirmás aplicar un <strong>+{confirmAumentoModal.porcentaje}%</strong> a <strong>{confirmAumentoModal.catTexto}</strong> del catálogo de {rubro}?
              </p>
              <p className="p-3 rounded-2xl bg-[#FFF9F0] border border-[#8B5A2B]/20 text-stone-800">
                Los precios de referencia se recalcularán y redondearán automáticamente.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
              <Button
                variant="outline"
                onClick={() => setConfirmAumentoModal(null)}
                className="rounded-xl text-xs min-h-9 py-1 px-3"
              >
                Cancelar
              </Button>
              <Button
                disabled={isPending}
                onClick={handleConfirmarAumentoMasivo}
                className="bg-emerald-700 text-white hover:bg-emerald-800 rounded-xl text-xs font-bold min-h-9 py-1 px-4 shadow-xs"
              >
                {isPending ? "Actualizando..." : `✓ Confirmar +${confirmAumentoModal.porcentaje}%`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL ESTÉTICO: CONFIRMACIÓN ELIMINAR FORMATO CATÁLOGO ─── */}
      {confirmDeleteFormato && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-serif font-bold text-stone-950 flex items-center gap-2">
              <span className="text-red-600">🗑️</span>
              <span>Eliminar del Catálogo</span>
            </h3>
            <p className="text-xs text-stone-700">
              ¿Seguro que deseas eliminar el modelo <strong>&ldquo;{confirmDeleteFormato.nombre}&rdquo;</strong> del tarifario base?
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
              <Button
                variant="outline"
                onClick={() => setConfirmDeleteFormato(null)}
                className="rounded-xl text-xs min-h-9 py-1 px-3"
              >
                Cancelar
              </Button>
              <Button
                disabled={isPending}
                onClick={() => handleEliminarFormatoConfirmado(confirmDeleteFormato.id)}
                className="bg-red-600 text-white hover:bg-red-700 rounded-xl text-xs font-bold min-h-9 py-1 px-4 shadow-xs"
              >
                {isPending ? "Eliminando..." : "Eliminar Definitivamente"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL ESTÉTICO: CONFIRMACIÓN ELIMINAR PIEZA STOCK ─── */}
      {confirmDeleteStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-serif font-bold text-stone-950 flex items-center gap-2">
              <span className="text-red-600">🗑️</span>
              <span>Eliminar Pieza de Stock</span>
            </h3>
            <p className="text-xs text-stone-700">
              ¿Eliminar definitivamente la pieza <strong>&ldquo;{confirmDeleteStock.nombre}&rdquo;</strong> del stock de la tienda?
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
              <Button
                variant="outline"
                onClick={() => setConfirmDeleteStock(null)}
                className="rounded-xl text-xs min-h-9 py-1 px-3"
              >
                Cancelar
              </Button>
              <Button
                disabled={isPending}
                onClick={() => handleEliminarStockConfirmado(confirmDeleteStock.id)}
                className="bg-red-600 text-white hover:bg-red-700 rounded-xl text-xs font-bold min-h-9 py-1 px-4 shadow-xs"
              >
                {isPending ? "Eliminando..." : "Eliminar Definitivamente"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL ESTÉTICO: CONFIRMACIÓN ELIMINAR PORTFOLIO ─── */}
      {confirmDeletePortfolio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-serif font-bold text-stone-950 flex items-center gap-2">
              <span className="text-red-600">🗑️</span>
              <span>Eliminar del Portfolio</span>
            </h3>
            <p className="text-xs text-stone-700">
              ¿Eliminar la colección <strong>&ldquo;{confirmDeletePortfolio.nombre}&rdquo;</strong> del portfolio de obras?
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
              <Button
                variant="outline"
                onClick={() => setConfirmDeletePortfolio(null)}
                className="rounded-xl text-xs min-h-9 py-1 px-3"
              >
                Cancelar
              </Button>
              <Button
                disabled={isPending}
                onClick={() => handleEliminarPortfolioConfirmado(confirmDeletePortfolio.id)}
                className="bg-red-600 text-white hover:bg-red-700 rounded-xl text-xs font-bold min-h-9 py-1 px-4 shadow-xs"
              >
                {isPending ? "Eliminando..." : "Eliminar Definitivamente"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ─── MODAL: CARGAR / EDITAR PIEZA SUELTA DE STOCK ─── */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {modalStockPieza && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl border border-border bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-border/50 pb-3">
              <div>
                <h3 className="text-base font-serif font-bold text-chocolate">
                  {modalStockPieza.id ? "Editar Pieza de Stock" : "Cargar Nueva Pieza de Stock"}
                </h3>
              </div>
              <button
                onClick={() => setModalStockPieza(null)}
                className="text-stone-400 hover:text-stone-900 text-base font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarStockPiezaModal} className="space-y-4 text-xs">
              {/* Selector de Estado de Publicación: Inmediato vs Borrador */}
              <div className="p-3.5 rounded-2xl bg-[#FFF9F0] border border-[#8B5A2B]/30 space-y-2">
                <span className="font-bold text-stone-900 block">Visibilidad de la pieza:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label
                    onClick={() => setStockPublicarInmediato(true)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                      stockPublicarInmediato
                        ? "bg-emerald-50 border-emerald-600 text-emerald-950 font-bold"
                        : "bg-white border-stone-200 text-stone-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="visibilidad"
                      checked={stockPublicarInmediato}
                      onChange={() => setStockPublicarInmediato(true)}
                      className="accent-emerald-700"
                    />
                    <span>🚀 Publicar en Tienda</span>
                  </label>

                  <label
                    onClick={() => setStockPublicarInmediato(false)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                      !stockPublicarInmediato
                        ? "bg-amber-50 border-amber-600 text-amber-950 font-bold"
                        : "bg-white border-stone-200 text-stone-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="visibilidad"
                      checked={!stockPublicarInmediato}
                      onChange={() => setStockPublicarInmediato(false)}
                      className="accent-amber-700"
                    />
                    <span>⏳ Guardar en Borrador</span>
                  </label>
                </div>
              </div>

              {/* Botón seleccionable: Hecho en torno alfarero (Para Cerámica) */}
              {isCeramica && (
                <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E5E0D8]">
                  <label className="flex items-center gap-2.5 cursor-pointer font-bold text-chocolate text-xs">
                    <input
                      type="checkbox"
                      checked={stockHechoEnTorno}
                      onChange={(e) => setStockHechoEnTorno(e.target.checked)}
                      className="h-4 w-4 rounded border-stone-300 text-chocolate focus:ring-chocolate"
                    />
                    <span>🏺 Hecho en torno alfarero (Pieza torneada a mano)</span>
                  </label>
                </div>
              )}

              {/* Fotos */}
              <div>
                <label className="font-bold text-stone-900 block mb-1">Fotos de la pieza</label>
                <FileImageUpload
                  value={stockFotos}
                  onChange={(val: string[]) => setStockFotos(val)}
                  multiple
                  folder={rubro}
                />
              </div>

              {/* Nombre de la pieza */}
              <div>
                <label className="font-bold text-stone-900 block mb-1">Nombre de la pieza *</label>
                <Input
                  name="nombre"
                  defaultValue={modalStockPieza.nombre || ""}
                  placeholder="ej. Taza Luna Llena / Mate Algarrobo"
                  required
                  className="rounded-xl text-xs"
                />
              </div>

              {/* Categoría física y Colección */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-900 block mb-1">Categoría Física</label>
                  <select
                    value={stockCategoriaSelect}
                    onChange={(e) => setStockCategoriaSelect(e.target.value)}
                    className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-800"
                  >
                    <option value="">Seleccionar categoría...</option>
                    {categoriasFisicasUnicas.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="__custom__">+ Crear nueva categoría...</option>
                  </select>

                  {stockCategoriaSelect === "__custom__" && (
                    <Input
                      value={stockCategoriaCustom}
                      onChange={(e) => setStockCategoriaCustom(e.target.value)}
                      placeholder="Nombre de la nueva categoría"
                      className="rounded-xl text-xs mt-1.5"
                    />
                  )}
                </div>

                <div>
                  <label className="font-bold text-stone-900 block mb-1">Colección / Lanzamiento</label>
                  <select
                    value={stockColeccionSelect}
                    onChange={(e) => setStockColeccionSelect(e.target.value)}
                    className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-800"
                  >
                    <option value="">Sin colección (Pieza suelta)</option>
                    {coleccionesStockUnicas.map((col) => (
                      <option key={col} value={col}>
                        📁 {col}
                      </option>
                    ))}
                    <option value="__custom__">+ Crear nueva colección...</option>
                  </select>

                  {stockColeccionSelect === "__custom__" && (
                    <Input
                      value={stockColeccionCustom}
                      onChange={(e) => setStockColeccionCustom(e.target.value)}
                      placeholder="Nombre de la nueva colección"
                      className="rounded-xl text-xs mt-1.5"
                    />
                  )}
                </div>
              </div>

              {/* Precio y Stock */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-900 block mb-1">Precio Base (ARS) *</label>
                  <input
                    type="number"
                    value={stockPrecioInput}
                    onChange={(e) => setStockPrecioInput(e.target.value)}
                    placeholder="ej. 20000"
                    required
                    className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-bold text-stone-900 outline-none focus:ring-1 focus:ring-chocolate"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-900 block mb-1">Stock Disponible *</label>
                  <input
                    type="number"
                    min={0}
                    value={stockStockInput}
                    onChange={(e) => setStockStockInput(e.target.value)}
                    placeholder="1"
                    required
                    className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-bold text-stone-900 outline-none focus:ring-1 focus:ring-chocolate"
                  />
                </div>
              </div>

              {/* Medidas (Alto, Ancho, Capacidad) */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Alto (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={stockAltoInput}
                    onChange={(e) => setStockAltoInput(e.target.value)}
                    placeholder="ej. 10"
                    className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs text-stone-900 outline-none focus:ring-1 focus:ring-chocolate"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Ancho (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={stockAnchoInput}
                    onChange={(e) => setStockAnchoInput(e.target.value)}
                    placeholder="ej. 8.5"
                    className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs text-stone-900 outline-none focus:ring-1 focus:ring-chocolate"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Capacidad (ml)</label>
                  <input
                    type="number"
                    value={stockCapacidadInput}
                    onChange={(e) => setStockCapacidadInput(e.target.value)}
                    placeholder="ej. 300"
                    className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs text-stone-900 outline-none focus:ring-1 focus:ring-chocolate"
                  />
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="font-bold text-stone-900 block mb-1">Descripción artesanal</label>
                <textarea
                  name="descripcion"
                  defaultValue={modalStockPieza.descripcion || ""}
                  placeholder="Detalles sobre el esmaltado, técnica o inspiración..."
                  rows={2}
                  className="w-full rounded-xl border border-stone-300 p-2.5 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-chocolate"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border/50">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalStockPieza(null)}
                  className="rounded-xl text-xs min-h-9 py-1 px-3"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-chocolate text-crema-cruda hover:bg-chocolate/90 rounded-xl text-xs font-bold min-h-9 py-1 px-4 shadow-xs"
                >
                  {isPending ? "Guardando..." : "Guardar Pieza"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ─── MODAL: NUEVA COLECCIÓN / DROP (CON MEDIDAS, FOTOS & CATEGORÍAS) ─── */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {modalLanzarDrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-3xl border border-border bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-border/50 pb-3">
              <div>
                <h3 className="text-base font-serif font-bold text-chocolate">
                  ✨ Nueva Colección / Lanzamiento
                </h3>
                <p className="text-xs text-amber-900 font-semibold mt-0.5">
                  ⏳ La colección se guardará automáticamente en borrador para que puedas revisarla y lanzarla a la tienda cuando publiques tu historia en Instagram.
                </p>
              </div>
              <button
                onClick={() => setModalLanzarDrop(false)}
                className="text-stone-400 hover:text-stone-900 text-base font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Datos de la Colección */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-900 block mb-1">Nombre de la Colección *</label>
                  <Input
                    value={dropNombre}
                    onChange={(e) => setDropNombre(e.target.value)}
                    placeholder="ej. Colección Botánica Primavera 2026"
                    className="rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-900 block mb-1">Descripción Conceptual</label>
                  <Input
                    value={dropDescripcion}
                    onChange={(e) => setDropDescripcion(e.target.value)}
                    placeholder="ej. Esmaltes verde bosque y detalles dorados"
                    className="rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Lista Dinámica de Piezas */}
              <div className="space-y-3 pt-2 border-t border-border/40">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900 font-serif text-sm">
                    Piezas del Lanzamiento ({dropPiezas.length})
                  </span>
                </div>

                <div className="space-y-4">
                  {dropPiezas.map((p, idx) => (
                    <div
                      key={p.id}
                      className="p-4 rounded-3xl bg-[#FAF7F2] border border-[#E5E0D8] space-y-3 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-chocolate text-xs">
                          Pieza #{idx + 1}
                        </span>
                        {dropPiezas.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveDropPieza(p.id)}
                            className="text-red-600 hover:text-red-800 text-xs font-semibold cursor-pointer"
                          >
                            ✕ Quitar
                          </button>
                        )}
                      </div>

                      {/* Nombre y Categoría */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-stone-700 block mb-0.5">
                            Nombre de la pieza *
                          </label>
                          <Input
                            value={p.nombre}
                            onChange={(e) => handleUpdateDropPieza(p.id, { nombre: e.target.value })}
                            placeholder="ej. Taza Botánica #1"
                            className="rounded-xl text-xs bg-white font-medium"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-stone-700 block mb-0.5">
                            Categoría física
                          </label>
                          <select
                            value={p.categoriaSelect}
                            onChange={(e) => handleUpdateDropPieza(p.id, { categoriaSelect: e.target.value })}
                            className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-800"
                          >
                            <option value="">Seleccionar categoría...</option>
                            {categoriasFisicasUnicas.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                            <option value="__custom__">+ Crear nueva categoría...</option>
                          </select>

                          {p.categoriaSelect === "__custom__" && (
                            <Input
                              value={p.categoriaCustom}
                              onChange={(e) => handleUpdateDropPieza(p.id, { categoriaCustom: e.target.value })}
                              placeholder="Nombre de la nueva categoría"
                              className="rounded-xl text-xs bg-white mt-1.5"
                            />
                          )}
                        </div>
                      </div>

                      {/* Precio, Stock y Torno */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-stone-700 block mb-0.5">
                            Precio Base (ARS) *
                          </label>
                          <input
                            type="number"
                            value={p.precioStr}
                            onChange={(e) => handleUpdateDropPieza(p.id, { precioStr: e.target.value })}
                            placeholder="ej. 25000"
                            className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-bold text-stone-900 outline-none focus:ring-1 focus:ring-chocolate"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-stone-700 block mb-0.5">
                            Stock *
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={p.stockStr}
                            onChange={(e) => handleUpdateDropPieza(p.id, { stockStr: e.target.value })}
                            placeholder="1"
                            className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-bold text-stone-900 outline-none focus:ring-1 focus:ring-chocolate"
                          />
                        </div>

                        {isCeramica && (
                          <div className="flex items-center pt-3 sm:pt-4">
                            <label className="flex items-center gap-2 cursor-pointer font-bold text-chocolate text-[11px]">
                              <input
                                type="checkbox"
                                checked={p.hechoEnTorno}
                                onChange={(e) => handleUpdateDropPieza(p.id, { hechoEnTorno: e.target.checked })}
                                className="h-4 w-4 rounded border-stone-300 text-chocolate focus:ring-chocolate"
                              />
                              <span>🏺 Hecho en torno</span>
                            </label>
                          </div>
                        )}
                      </div>

                      {/* Medidas (Alto, Ancho, Capacidad) */}
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[11px] font-semibold text-stone-700 block mb-0.5">
                            Alto (cm)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={p.altoStr}
                            onChange={(e) => handleUpdateDropPieza(p.id, { altoStr: e.target.value })}
                            placeholder="ej. 10"
                            className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs text-stone-900 outline-none focus:ring-1 focus:ring-chocolate"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-stone-700 block mb-0.5">
                            Ancho (cm)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={p.anchoStr}
                            onChange={(e) => handleUpdateDropPieza(p.id, { anchoStr: e.target.value })}
                            placeholder="ej. 8.5"
                            className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs text-stone-900 outline-none focus:ring-1 focus:ring-chocolate"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-stone-700 block mb-0.5">
                            Capacidad (ml)
                          </label>
                          <input
                            type="number"
                            value={p.capacidadStr}
                            onChange={(e) => handleUpdateDropPieza(p.id, { capacidadStr: e.target.value })}
                            placeholder="ej. 300"
                            className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs text-stone-900 outline-none focus:ring-1 focus:ring-chocolate"
                          />
                        </div>
                      </div>

                      {/* Fotos de la pieza */}
                      <div>
                        <label className="text-[11px] font-semibold text-stone-700 block mb-1">
                          Fotos de esta pieza
                        </label>
                        <FileImageUpload
                          value={p.fotos}
                          onChange={(urls: string[]) => handleUpdateDropPieza(p.id, { fotos: urls })}
                          multiple
                          folder={rubro}
                        />
                      </div>

                      {/* Descripción artesanal */}
                      <div>
                        <label className="text-[11px] font-semibold text-stone-700 block mb-0.5">
                          Descripción opcional
                        </label>
                        <textarea
                          value={p.descripcion}
                          onChange={(e) => handleUpdateDropPieza(p.id, { descripcion: e.target.value })}
                          placeholder="Detalles sobre el esmaltado, técnica..."
                          rows={2}
                          className="w-full rounded-xl border border-stone-300 bg-white p-2.5 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-chocolate"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Botón para agregar otra pieza al final del listado */}
                <div className="pt-2 flex justify-center">
                  <Button
                    type="button"
                    onClick={handleAddDropPieza}
                    className="w-full bg-[#FAF7F2] hover:bg-[#F3EFEA] border-2 border-dashed border-chocolate/40 text-chocolate hover:border-chocolate rounded-2xl py-3 px-6 text-xs font-bold shadow-2xs gap-2 cursor-pointer transition-all hover:scale-[1.005]"
                  >
                    <span>➕</span>
                    <span>+ Agregar otra pieza a esta colección</span>
                  </Button>
                </div>
              </div>

              {/* Botón Guardar en Borrador */}
              <div className="flex justify-end gap-2 pt-3 border-t border-border/50">
                <Button
                  variant="outline"
                  onClick={() => setModalLanzarDrop(false)}
                  className="rounded-xl text-xs min-h-9 py-1 px-3"
                >
                  Cancelar
                </Button>
                <Button
                  disabled={isPending}
                  onClick={handleGuardarDropEnBorrador}
                  className="bg-chocolate text-crema-cruda hover:bg-chocolate/90 rounded-xl text-xs font-bold min-h-9 py-1 px-4 shadow-xs"
                >
                  {isPending ? "Guardando..." : "💾 Guardar Colección en Borrador"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL CONFIRMACIÓN: LANZAR COLECCIÓN GUARDADA ─── */}
      {confirmLaunchColeccion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-emerald-300 bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-serif font-bold text-emerald-950 flex items-center gap-2">
              <span>🚀</span>
              <span>Lanzar Colección a la Tienda</span>
            </h3>
            <p className="text-xs text-stone-700 leading-relaxed">
              ¿Confirmás publicar la colección <strong>&ldquo;{confirmLaunchColeccion.nombre}&rdquo;</strong> con sus <strong>{confirmLaunchColeccion.cant} piezas</strong>?
            </p>
            <p className="text-[11px] text-stone-500 italic">
              Todas las piezas pasarán a estar visibles y disponibles para compra inmediata en la tienda pública.
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
              <Button
                variant="outline"
                onClick={() => setConfirmLaunchColeccion(null)}
                className="rounded-xl text-xs min-h-9 py-1 px-3"
              >
                Cancelar
              </Button>
              <Button
                disabled={isPending}
                onClick={() => handleLanzarColeccionGuardada(confirmLaunchColeccion.id, confirmLaunchColeccion.nombre)}
                className="bg-emerald-700 text-white hover:bg-emerald-800 rounded-xl text-xs font-bold min-h-9 py-1 px-4 shadow-xs"
              >
                {isPending ? "Publicando..." : "Confirmar y Publicar en Tienda"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL CONFIRMACIÓN: LANZAR TODAS LAS COLECCIONES Y BORRADORES ─── */}
      {confirmLaunchAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-emerald-300 bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-serif font-bold text-emerald-950 flex items-center gap-2">
              <span>🚀</span>
              <span>Lanzar Todas las Colecciones y Piezas</span>
            </h3>
            <p className="text-xs text-stone-700 leading-relaxed">
              ¿Confirmás publicar <strong>TODAS las colecciones y piezas en borrador ({counts.borradores} piezas)</strong> de {isCeramica ? "cerámica" : "ilustración"} a la tienda pública?
            </p>
            <p className="text-[11px] text-stone-500 italic">
              Pasarán a estar disponibles para compra inmediata en la web.
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
              <Button
                variant="outline"
                onClick={() => setConfirmLaunchAll(false)}
                className="rounded-xl text-xs min-h-9 py-1 px-3"
              >
                Cancelar
              </Button>
              <Button
                disabled={isPending}
                onClick={handleLanzarTodasLasColecciones}
                className="bg-emerald-700 text-white hover:bg-emerald-800 rounded-xl text-xs font-bold min-h-9 py-1 px-4 shadow-xs"
              >
                {isPending ? "Publicando..." : `✓ Publicar Todo (${counts.borradores} piezas)`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL FORMATO CATÁLOGO (CON FOTOS Y MEDIDAS) ─── */}
      {modalFormato && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-border bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-border/50 pb-3">
              <h3 className="text-base font-serif font-bold text-chocolate">
                {modalFormato.id ? "Editar Pieza del Catálogo" : "Nueva Pieza para el Catálogo"}
              </h3>
              <button
                onClick={() => setModalFormato(null)}
                className="text-stone-400 hover:text-stone-900 text-base font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarFormatoModal} className="space-y-3 text-xs">
              {modalFormato.id && <input type="hidden" name="id" value={modalFormato.id} />}

              {/* Subida de Foto del Modelo de Catálogo */}
              <div>
                <label className="font-bold text-stone-900 block mb-1">Foto del Modelo de Catálogo</label>
                <FileImageUpload
                  value={formatoFotoUrl ? [formatoFotoUrl] : []}
                  onChange={(urls: string[]) => setFormatoFotoUrl(urls[0] || "")}
                  multiple={false}
                  folder="catalogo"
                  label="Foto del modelo de referencia"
                />
              </div>

              <div>
                <label className="font-bold text-stone-900 block mb-1">Nombre del Modelo / Pieza *</label>
                <Input
                  name="nombre"
                  defaultValue={modalFormato.nombre || ""}
                  placeholder="ej. Taza Cónica / Cuenco Ramen"
                  required
                  className="rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-stone-900 block mb-1">Categoría</label>
                <Input
                  name="categoria"
                  defaultValue={modalFormato.categoria || ""}
                  placeholder="ej. Tazas, Cuencos, Mates"
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-stone-900 block mb-1">Precio Base (ARS) *</label>
                  <input
                    type="number"
                    value={formatoPrecioInput}
                    onChange={(e) => setFormatoPrecioInput(e.target.value)}
                    placeholder="ej. 20000"
                    required
                    className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-bold text-stone-900 outline-none focus:ring-1 focus:ring-chocolate"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Medidas Sugeridas</label>
                  <Input
                    name="medidas"
                    defaultValue={modalFormato.medidas || ""}
                    placeholder="ej. 10x8 cm (350 ml)"
                    className="rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border/50">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalFormato(null)}
                  className="rounded-xl text-xs min-h-9 py-1 px-3"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-chocolate text-crema-cruda hover:bg-chocolate/90 rounded-xl text-xs font-bold min-h-9 py-1 px-4 shadow-xs"
                >
                  Guardar en Catálogo
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL PORTFOLIO (SIN PIEZAS INCLUIDAS) ─── */}
      {modalPortfolio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-border bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-border/50 pb-3">
              <h3 className="text-base font-serif font-bold text-chocolate">
                {modalPortfolio.id ? "Editar Colección de Portfolio" : "Nueva Colección para Portfolio"}
              </h3>
              <button
                onClick={() => setModalPortfolio(null)}
                className="text-stone-400 hover:text-stone-900 text-base font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarPortfolio} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-900 block mb-1">Nombre de la Colección *</label>
                <Input
                  name="nombre"
                  defaultValue={modalPortfolio.nombre || ""}
                  placeholder="ej. Colección Luna Llena"
                  required
                  className="rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-stone-900 block mb-1">Descripción</label>
                <textarea
                  name="descripcion"
                  defaultValue={modalPortfolio.descripcion || ""}
                  placeholder="Concepto de la colección..."
                  rows={3}
                  className="w-full rounded-xl border border-stone-300 p-2.5 text-xs text-stone-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-stone-900 block mb-1">Fotos</label>
                <FileImageUpload
                  value={portfolioFotos}
                  onChange={(urls: string[]) => setPortfolioFotos(urls)}
                  multiple
                  folder="portfolio"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border/50">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalPortfolio(null)}
                  className="rounded-xl text-xs min-h-9 py-1 px-3"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-chocolate text-crema-cruda hover:bg-chocolate/90 rounded-xl text-xs font-bold min-h-9 py-1 px-4 shadow-xs"
                >
                  Guardar en Portfolio
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── LIGHTBOX PREVIEW: ALTA DEFINICIÓN & ASPECTO ORIGINAL INTACTO ─── */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md transition-all animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 z-10 bg-stone-900/90 text-white hover:bg-black rounded-full h-9 w-9 flex items-center justify-center text-sm font-bold shadow-lg border border-white/20 transition-transform hover:scale-105 cursor-pointer"
              title="Cerrar vista previa"
            >
              ✕
            </button>
            <div className="overflow-hidden rounded-2xl bg-stone-950/70 p-2 border border-white/10 shadow-2xl flex items-center justify-center">
              <img
                src={previewImage}
                alt="Vista ampliada"
                className="max-h-[82vh] max-w-[85vw] object-contain rounded-xl select-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── LIGHTBOX DE GALERÍA DE PORTFOLIO MULTI-FOTOS ─── */}
      <ImageLightbox
        isOpen={galleryLightbox.isOpen}
        images={galleryLightbox.images}
        initialIndex={galleryLightbox.initialIndex}
        onClose={() => setGalleryLightbox((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

// ─── TARJETA DE PORTFOLIO PARA ADMIN CON NAVEGACIÓN Y CAROUSEL INTERNO ───
function AdminPortfolioCard({
  item,
  onEdit,
  onDelete,
  onOpenLightbox,
}: {
  item: PortfolioColeccion;
  onEdit: () => void;
  onDelete: () => void;
  onOpenLightbox: (fotos: string[], index: number, title: string) => void;
}) {
  const [photoIdx, setPhotoIdx] = useState(0);

  const fotos =
    Array.isArray(item.fotos) && item.fotos.length > 0
      ? (item.fotos.filter(Boolean) as string[])
      : ([item.portada_url].filter(Boolean) as string[]);

  const total = fotos.length;
  const currentPhoto = fotos[photoIdx] || fotos[0];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (total <= 1) return;
    setPhotoIdx((prev) => (prev - 1 + total) % total);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (total <= 1) return;
    setPhotoIdx((prev) => (prev + 1) % total);
  };

  return (
    <div className="rounded-3xl border border-[#E5E0D8] bg-white p-4 shadow-xs space-y-3 flex flex-col justify-between group">
      {/* Contenedor de Foto con Flechas de Navegación */}
      <div className="relative h-48 w-full rounded-2xl bg-stone-100 border border-[#E5E0D8] overflow-hidden flex items-center justify-center shadow-2xs select-none">
        {currentPhoto ? (
          <>
            <img
              src={currentPhoto}
              alt={item.nombre}
              onClick={() => onOpenLightbox(fotos, photoIdx, item.nombre)}
              className="h-full w-full object-cover cursor-zoom-in hover:scale-102 transition-transform duration-200"
              title="Clic para ver en pantalla completa"
            />

            {/* Badge de contador de fotos */}
            <div className="absolute top-2 right-2 rounded-full bg-black/65 text-white backdrop-blur-md px-2 py-0.5 text-[10px] font-mono font-semibold pointer-events-none shadow-xs">
              {photoIdx + 1} / {total}
            </div>

            {/* Flechas de navegación prev / next */}
            {total > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute left-1.5 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 hover:bg-black/85 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer backdrop-blur-xs"
                  aria-label="Foto anterior"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 hover:bg-black/85 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer backdrop-blur-xs"
                  aria-label="Foto siguiente"
                >
                  ›
                </button>
              </>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-stone-400 gap-1">
            <span className="text-3xl">🖼️</span>
            <span className="text-[11px]">Sin fotos</span>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <h4 className="font-bold text-stone-900 text-sm font-serif">{item.nombre}</h4>
        {item.descripcion && (
          <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">{item.descripcion}</p>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-[#F0EDE8]">
        <span className="text-[11px] text-stone-500 font-medium font-sans">
          {total} {total === 1 ? "foto" : "fotos"}
        </span>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            onClick={onEdit}
            className="text-[11px] rounded-xl h-7 py-0.5 px-2.5 font-semibold text-stone-800 border-stone-300"
          >
            ✏️ Editar
          </Button>
          <Button
            variant="outline"
            onClick={onDelete}
            className="text-[11px] rounded-xl h-7 py-0.5 px-2 text-red-600 hover:bg-red-50 border-red-200"
          >
            🗑️
          </Button>
        </div>
      </div>
    </div>
  );
}
