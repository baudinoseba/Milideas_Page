/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useTransition, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import {
  createProduccionAction,
  createCategoriaInlineAction,
  savePiezaProduccionAction,
  vincularProductoAProduccionAction,
  publicarProduccionAction,
  actualizarProduccionSinRelanzarAction,
  deletePiezaProduccionAction,
  uploadProductoImageAction,
  deleteProductoImageAction,
  generarDescripcionProductoIAAction,
} from "@/lib/actions";

import { ImageReorderGallery } from "@/components/admin/image-reorder-gallery";
import { ProductoForm } from "@/components/admin/producto-form";
import type { Categoria, ProductoConImagenes, ProductoImagen, TipoCatalogo } from "@/types";

type Step = "setup" | "pieces" | "preview";
type PieceMode = "new" | "existing" | "edit";

type PiezaGuardada = ProductoConImagenes;

export function ProduccionWizard({
  categorias: initialCategorias,
  categoriaId: resumeCategoriaId,
  categoriaNombre: resumeCategoriaNombre,
  piezasExistentes,
  productosCatalogo = [],
}: {
  categorias: Categoria[];
  categoriaId?: string;
  categoriaNombre?: string;
  piezasExistentes?: PiezaGuardada[];
  productosCatalogo?: ProductoConImagenes[];
}) {
  const router = useRouter();

  // ─── State ───
  const [step, setStep] = useState<Step>(resumeCategoriaId ? "pieces" : "setup");
  const [categorias, setCategorias] = useState(initialCategorias);
  const [categoriaId, setCategoriaId] = useState(resumeCategoriaId ?? "");
  const [categoriaNombre, setCategoriaNombre] = useState(resumeCategoriaNombre ?? "");
  const [tipoCatalogo, setTipoCatalogo] = useState<TipoCatalogo>("ceramica");
  const [nuevaCategoria, setNuevaCategoria] = useState("");
  const [showNuevaCategoria, setShowNuevaCategoria] = useState(false);

  // Pieces state
  const [piezas, setPiezas] = useState<PiezaGuardada[]>(piezasExistentes ?? []);
  const [editingPieza, setEditingPieza] = useState<PiezaGuardada | null>(null);
  const [editingPiezaId, setEditingPiezaId] = useState<string | null>(null);
  const [currentPiezaImages, setCurrentPiezaImages] = useState<ProductoImagen[]>([]);
  const [currentPiezaId, setCurrentPiezaId] = useState<string | null>(null);
  const [selectedPieceCategoriaId, setSelectedPieceCategoriaId] = useState<string>("");
  const [precioVal, setPrecioVal] = useState<string>("");
  const [pieceMode, setPieceMode] = useState<PieceMode>("new");
  const [selectedExistingProductId, setSelectedExistingProductId] = useState<string>("");

  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, startUpload] = useTransition();
  const [dragging, setDragging] = useState(false);

  const [descripcionVal, setDescripcionVal] = useState<string>("");
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleGenerateAiDescription = async () => {
    const nombreInput = (document.getElementById("nombre") as HTMLInputElement)?.value ?? "";
    const firstImgUrl = currentPiezaImages[0]?.url_imagen ?? null;

    if (!firstImgUrl) {
      setAiError("Subí al menos una foto de la pieza arriba para que Gemini pueda analizarla.");
      return;
    }

    setGeneratingAi(true);
    setAiError(null);

    const res = await generarDescripcionProductoIAAction(firstImgUrl, nombreInput);
    setGeneratingAi(false);

    if (res.success && res.descripcion) {
      setDescripcionVal(res.descripcion);
      if (formRef.current) {
        const descTextarea = formRef.current.elements.namedItem("descripcion") as HTMLTextAreaElement;
        if (descTextarea) descTextarea.value = res.descripcion;
      }
    } else if (res.error) {
      setAiError(res.error);
    }
  };

  const handleVincularProductoExistente = () => {
    if (!selectedExistingProductId || !categoriaId) return;
    const prod = productosCatalogo.find((p) => p.id === selectedExistingProductId);
    if (!prod) return;

    startTransition(async () => {
      const res = await vincularProductoAProduccionAction(prod.id, categoriaId);
      if (res.success) {
        setPiezas((prev) => [...prev.filter((p) => p.id !== prod.id), prod]);
        setSuccessMsg(`✅ Pieza "${prod.nombre}" vinculada a la producción`);
        setSelectedExistingProductId("");
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setError(res.error ?? "Error al vincular producto");
      }
    });
  };


  // ─── Step 1: Setup ───
  const handleCreateCategoria = () => {
    if (!nuevaCategoria.trim()) return;
    startTransition(async () => {
      const result = await createCategoriaInlineAction(nuevaCategoria.trim());
      if (result.success && result.id && result.nombre) {
        const newCat = { id: result.id, nombre: result.nombre, created_at: new Date().toISOString() };
        setCategorias((prev) => [...prev, newCat]);
        setSelectedPieceCategoriaId(result.id);
        setNuevaCategoria("");
        setShowNuevaCategoria(false);
      } else {
        setError(result.error ?? "Error al crear categoría");
      }
    });
  };


  const handleStartProduction = () => {
    if (!categoriaNombre.trim()) {
      setError("Ingresá un nombre para identificar esta producción o colección");
      return;
    }

    if (categoriaId) {
      setError(null);
      setStep("pieces");
      return;
    }

    startTransition(async () => {
      setError(null);
      const res = await createProduccionAction(categoriaNombre.trim(), tipoCatalogo);
      if (res.success && res.id) {
        setCategoriaId(res.id);
        setStep("pieces");
      } else {
        setError(res.error ?? "Error al crear la producción");
      }
    });
  };


  // ─── Step 2: Pieces ───
  const handleSavePiece = useCallback(
    (andContinue: boolean) => {
      if (!formRef.current || !categoriaId) return;
      const formData = new FormData(formRef.current);
      const nombre = formData.get("nombre");
      if (!nombre || String(nombre).trim() === "") {
        setError("El nombre de la pieza es obligatorio");
        return;
      }

      startTransition(async () => {
        setError(null);
        const result = await savePiezaProduccionAction(
          formData,
          categoriaId,
          editingPiezaId ?? currentPiezaId ?? undefined,
        );

        if (!result.success) {
          setError(result.error ?? "Error al guardar la pieza");
          return;
        }

        // Reload pieces from server
        const response = await fetch(`/api/produccion/${categoriaId}/piezas`);
        let updatedPiezas: PiezaGuardada[] = piezas;
        if (response.ok) {
          updatedPiezas = await response.json();
        } else {
          // Fallback: update local state
          if (editingPiezaId || currentPiezaId) {
            // Update existing
            updatedPiezas = piezas.map((p) =>
              p.id === (editingPiezaId ?? currentPiezaId)
                ? {
                    ...p,
                    nombre: String(formData.get("nombre")),
                    descripcion: String(formData.get("descripcion") || ""),
                    precio_base: Number(formData.get("precioBase")) || 0,
                    stock_disponible: Number(formData.get("stockDisponible")) || 1,
                    producto_imagenes: currentPiezaImages,
                  }
                : p,
            ) as PiezaGuardada[];
          } else if (result.id) {
            const newPieza = {
              id: result.id,
              nombre: String(formData.get("nombre")),
              slug: "",
              descripcion: String(formData.get("descripcion") || ""),
              precio_base: Number(formData.get("precioBase")) || 0,
              stock_disponible: Number(formData.get("stockDisponible")) || 1,
              categoria_id: categoriaId,
              es_personalizable: formData.get("esPersonalizable") === "on",
              es_entrega_inmediata: false,
              activo: false,
              fecha_lanzamiento: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              producto_imagenes: currentPiezaImages,
              categorias: null,
            } as PiezaGuardada;
            updatedPiezas = [...piezas, newPieza];
          }
        }

        setPiezas(updatedPiezas);

        if (andContinue) {
          // Reset form for next piece
          formRef.current?.reset();
          setEditingPiezaId(null);
          setCurrentPiezaId(null);
          setCurrentPiezaImages([]);
          setPrecioVal("");
          setSuccessMsg(`✅ Pieza "${String(formData.get("nombre"))}" guardada. ¡Cargá la siguiente!`);
          setTimeout(() => setSuccessMsg(null), 3000);
        } else {
          setStep("preview");
        }
      });
    },
    [categoriaId, editingPiezaId, currentPiezaId, piezas, currentPiezaImages],
  );

  const handleFinishAndPreview = () => {
    setError(null);
    if (!formRef.current) {
      if (piezas.length > 0) setStep("preview");
      else setError("Debés cargar al menos una pieza antes de finalizar la producción");
      return;
    }

    const formData = new FormData(formRef.current);
    const nombre = formData.get("nombre");
    const hasTypedName = nombre && String(nombre).trim().length > 0;

    if (hasTypedName) {
      handleSavePiece(false);
    } else if (piezas.length > 0) {
      setStep("preview");
    } else {
      setError("Debés cargar al menos una pieza antes de finalizar la producción");
    }
  };


  const handleEditPieza = (pieza: PiezaGuardada) => {
    setEditingPieza(pieza);
    setEditingPiezaId(pieza.id);
    setCurrentPiezaId(pieza.id);
    setCurrentPiezaImages(pieza.producto_imagenes ?? []);
    setPieceMode("edit");
    setStep("pieces");
    window.scrollTo({ top: 300, behavior: "smooth" });
  };


  const handleImageUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const uploadFilesToId = (targetId: string) => {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file) continue;
        startUpload(async () => {
          const formData = new FormData();
          formData.set("image", file);
          const result = await uploadProductoImageAction(targetId, formData);
          if (result.success && result.url) {
            setCurrentPiezaImages((prev) => [
              ...prev,
              {
                id: Date.now().toString() + i,
                producto_id: targetId,
                url_imagen: result.url!,
                orden: prev.length,
              },
            ]);
          }
        });
      }
    };

    if (!currentPiezaId) {
      if (!formRef.current || !categoriaId) return;
      const formData = new FormData(formRef.current);
      let nombre = String(formData.get("nombre") || "").trim();
      if (!nombre) {
        nombre = "Pieza sin título";
        formData.set("nombre", nombre);
        const nameInput = formRef.current.elements.namedItem("nombre") as HTMLInputElement;
        if (nameInput) nameInput.value = nombre;
      }

      startTransition(async () => {
        setError(null);
        const result = await savePiezaProduccionAction(formData, categoriaId);
        if (result.success && result.id) {
          setCurrentPiezaId(result.id);
          uploadFilesToId(result.id);
        } else {
          setError(result.error ?? "Error al asociar las fotos a la pieza");
        }
      });
      return;
    }

    uploadFilesToId(currentPiezaId);
  };

  const handleImageDelete = (imageId: string) => {
    if (!currentPiezaId) return;
    deleteProductoImageAction(imageId, currentPiezaId).then((result) => {
      if (result.success) {
        setCurrentPiezaImages((prev) => prev.filter((img) => img.id !== imageId));
      }
    });
  };

  // First save piece to get an ID, then allow images
  const handleFirstSaveForImages = () => {
    if (!formRef.current || !categoriaId) return;
    const formData = new FormData(formRef.current);
    const nombre = formData.get("nombre");
    if (!nombre || String(nombre).trim() === "") {
      setError("Primero ingresá el nombre de la pieza para poder subir fotos");
      return;
    }

    startTransition(async () => {
      setError(null);
      const result = await savePiezaProduccionAction(formData, categoriaId);
      if (result.success && result.id) {
        setCurrentPiezaId(result.id);
        setSuccessMsg("Pieza guardada como borrador. ¡Ahora podés subir fotos!");
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setError(result.error ?? "Error al guardar");
      }
    });
  };

  // ─── Step 3: Preview ───
  const handlePublish = () => {
    startTransition(async () => {
      setError(null);
      const result = await publicarProduccionAction(categoriaId);
      if (result.success) {
        router.push("/admin/produccion");
        router.refresh();
      } else {
        setError(result.error ?? "Error al publicar");
      }
    });
  };

  const handleUpdateWithoutRelauch = () => {
    if (!categoriaId) return;
    startTransition(async () => {
      setError(null);
      const result = await actualizarProduccionSinRelanzarAction(categoriaId);
      if (result.success) {
        setSuccessMsg("¡Producción actualizada correctamente sin relanzar ni modificar fechas!");
        setTimeout(() => {
          router.push("/admin/produccion");
          router.refresh();
        }, 1000);
      } else {
        setError(result.error ?? "Error al actualizar la producción");
      }
    });
  };

  const handleDeletePieza = (productoId: string, nombrePieza?: string) => {
    const targetName = nombrePieza ? `"${nombrePieza}"` : "esta pieza";
    if (
      !confirm(
        `¿Estás seguro de que querés eliminar la pieza ${targetName}?\nSe eliminarán de forma permanente la pieza y todas sus fotos cargadas.`,
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await deletePiezaProduccionAction(productoId);
      if (result.success) {
        setPiezas((prev) => prev.filter((p) => p.id !== productoId));

        // If we are currently editing this piece, reset editing state
        if (editingPiezaId === productoId || currentPiezaId === productoId) {
          setEditingPiezaId(null);
          setCurrentPiezaId(null);
          setCurrentPiezaImages([]);
          formRef.current?.reset();
        }

        setSuccessMsg(`Pieza eliminada correctamente.`);
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setError(result.error ?? "Error al eliminar la pieza");
      }
    });
  };


  // ─── Render ───
  return (
    <div className="max-w-3xl">
      {/* Step indicator */}
      <div className="mb-8 flex items-center gap-2 text-sm">
        {(["setup", "pieces", "preview"] as const).map((s, i) => {
          const labels = ["Colección", "Piezas", "Previsualizar"];
          const isCurrent = step === s;
          const isPast =
            (s === "setup" && (step === "pieces" || step === "preview")) ||
            (s === "pieces" && step === "preview");
          return (
            <div key={s} className="flex items-center gap-2">
              {i > 0 && <span className="text-border">→</span>}
              <button
                type="button"
                onClick={() => {
                  if (isPast) setStep(s);
                }}
                disabled={!isPast}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  isCurrent
                    ? "bg-admin-accent text-white"
                    : isPast
                      ? "bg-admin-accent/20 text-admin-accent cursor-pointer hover:bg-admin-accent/30"
                      : "bg-surface text-muted"
                }`}
              >
                {labels[i]}
              </button>
            </div>
          );
        })}
        {categoriaNombre && (
          <span className="ml-auto text-xs text-muted">
            Colección: <strong>{categoriaNombre}</strong> · {piezas.length} pieza{piezas.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-[#2d6a4f]/30 bg-white px-4 py-3.5 text-sm font-medium text-[#1b4332] shadow-sm">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#d8f3dc] text-[#1b4332] font-bold text-xs">
            ✓
          </span>
          <span>{successMsg}</span>
        </div>
      )}


      {/* ═══ STEP 1: SETUP ═══ */}
      {step === "setup" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">🎬 Nueva Producción / Colección</h2>
            <p className="mt-1 text-sm text-muted">
              Ingresá el nombre del lanzamiento o colección. Luego vas a cargar las piezas y asignarles su categoría real (Tazas, Platos, Jarras, etc.).
            </p>
          </div>

          <div className="space-y-4 rounded-lg border border-border p-6">
            <div>
              <Label htmlFor="nombreProduccion">Nombre del Lanzamiento o Colección *</Label>
              <Input
                id="nombreProduccion"
                placeholder="Ej: Colección Agosto 2026, Drop Primavera..."
                value={categoriaNombre}
                onChange={(e) => setCategoriaNombre(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (categoriaNombre.trim()) {
                      handleStartProduction();
                    }
                  }
                }}
                autoFocus
              />
            </div>

            <div>
              <Label htmlFor="tipoCatalogoProduccion">Tipo de Catálogo *</Label>
              <Select
                id="tipoCatalogoProduccion"
                value={tipoCatalogo}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setTipoCatalogo(e.target.value as TipoCatalogo)
                }
              >
                <option value="ceramica">🏺 Catálogo Cerámica (Tazas, Platos, Jarrones)</option>
                <option value="esculturas">🗿 Catálogo Esculturas (Esculturas de Autor, Pátinas, Bronces)</option>
                <option value="ilustraciones">🎨 Catálogo Ilustraciones (Láminas, Marcos, Acuarelas)</option>
              </Select>
              <p className="mt-1 text-xs text-muted">
                Define las especificaciones técnicas adaptadas que se solicitarán al crear cada pieza de la colección.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleStartProduction}
              disabled={!categoriaNombre.trim()}
              isLoading={pending}
            >
              Comenzar a cargar piezas →
            </Button>
            <Button variant="ghost" onClick={() => router.push("/admin/produccion")}>

              Cancelar
            </Button>
          </div>
        </div>
      )}


      {/* ═══ STEP 2: PIECES ═══ */}
      {step === "pieces" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">
              {editingPiezaId ? "Editando pieza" : `Pieza #${piezas.length + 1}`}
            </h2>
            <p className="mt-1 text-sm text-muted">
              Completá los datos de la pieza. Podés subir fotos una vez guardada.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <button
              type="button"
              onClick={() => setPieceMode("new")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors ${
                pieceMode === "new"
                  ? "bg-admin-accent text-white"
                  : "bg-surface text-muted hover:text-foreground border border-border"
              }`}
            >
              ✨ Crear pieza nueva
            </button>
            <button
              type="button"
              onClick={() => setPieceMode("existing")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors ${
                pieceMode === "existing"
                  ? "bg-admin-accent text-white"
                  : "bg-surface text-muted hover:text-foreground border border-border"
              }`}
            >
              📦 Elegir pieza existente del catálogo
            </button>
          </div>

          {/* Already saved pieces strip */}
          {piezas.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {piezas.map((p) => (
                <div
                  key={p.id}
                  className={`group flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
                    editingPiezaId === p.id
                      ? "border-admin-accent bg-admin-accent/10 text-admin-accent"
                      : "border-border hover:border-admin-accent/50 hover:bg-surface"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setPieceMode("new");
                      handleEditPieza(p);
                    }}
                    className="flex items-center gap-2"
                  >
                    {p.producto_imagenes?.[0]?.url_imagen ? (
                      <img
                        src={p.producto_imagenes[0].url_imagen}
                        alt=""
                        className="h-7 w-7 rounded object-cover"
                      />
                    ) : (
                      <span className="flex h-7 w-7 items-center justify-center rounded bg-surface text-sm">
                        🎨
                      </span>
                    )}
                    <span className="max-w-[100px] truncate font-medium">{p.nombre}</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePieza(p.id, p.nombre);
                    }}
                    title="Eliminar pieza"
                    className="ml-1 flex h-6 w-6 items-center justify-center rounded text-muted hover:bg-destructive/10 hover:text-destructive transition-colors text-xs"
                  >
                    🗑️
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  setPieceMode("new");
                  setEditingPiezaId(null);
                  setCurrentPiezaId(null);
                  setCurrentPiezaImages([]);
                  setPrecioVal("");
                  formRef.current?.reset();
                }}
                className="flex items-center gap-1 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted hover:border-admin-accent hover:text-admin-accent transition-colors"
              >
                + Nueva pieza
              </button>
            </div>
          )}

          {/* Mode 1: Vincular pieza existente */}
          {pieceMode === "existing" && (
            <div className="space-y-4 rounded-lg border border-border p-6 bg-surface/40">
              <div>
                <Label htmlFor="productoExistenteSelect">Seleccionar pieza existente del catálogo</Label>
                <p className="mt-1 text-xs text-muted">
                  Si creaste la pieza antes de armar esta producción, podés elegirla acá para sumarla al lanzamiento sin duplicarla.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Select
                  id="productoExistenteSelect"
                  value={selectedExistingProductId}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedExistingProductId(e.target.value)}
                  className="flex-1"
                >
                  <option value="">Seleccioná una pieza del catálogo...</option>
                  {productosCatalogo
                    .filter((p) => !piezas.some((pieza) => pieza.id === p.id))
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} {p.categorias?.nombre ? `(${p.categorias.nombre})` : ""} — ${Number(p.precio_base).toLocaleString("es-AR")}
                      </option>
                    ))}
                </Select>

                <Button
                  type="button"
                  onClick={handleVincularProductoExistente}
                  disabled={!selectedExistingProductId}
                  isLoading={pending}
                  className="shrink-0"
                >
                  🔗 Vincular a esta Producción
                </Button>
              </div>
            </div>
          )}

          {/* Formulario unificado de Pieza (Nueva o Edición) */}
          {(pieceMode === "new" || pieceMode === "edit") && (
            <div className="rounded-xl border border-border p-6 bg-surface shadow-xs space-y-4">
              <div className="border-b border-border pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-chocolate flex items-center gap-2">
                    <span>{pieceMode === "edit" ? "✏️" : "✨"}</span>
                    <span>{pieceMode === "edit" ? `Editar Pieza: ${editingPieza?.nombre}` : "Nueva Pieza para esta Producción"}</span>
                  </h3>
                  <p className="text-xs text-muted">
                    {pieceMode === "edit"
                      ? "Modificá la información de la pieza. Al presionar actualizar se sobreescribirán los datos existentes sin crear duplicados."
                      : "Completá la información de la pieza. Las fotos y la descripción con IA están integradas en el mismo flujo."}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setEditingPieza(null);
                    setPieceMode("existing");
                  }}
                >
                  ✕ Cancelar
                </Button>
              </div>

              <ProductoForm
                key={pieceMode === "edit" ? editingPieza?.id : "new-piece"}
                categorias={categorias}
                producto={pieceMode === "edit" ? (editingPieza ?? undefined) : undefined}
                imagenes={pieceMode === "edit" ? editingPieza?.producto_imagenes : undefined}
                produccionId={categoriaId}
                categoriaIdInicial={categoriaId}
                isWizardMode={true}
                submitText={pieceMode === "edit" ? "💾 Actualizar pieza" : "💾 Crear y guardar pieza"}
                onSuccess={() => {
                  setSuccessMsg(pieceMode === "edit" ? "¡Pieza actualizada correctamente!" : "¡Pieza guardada correctamente!");
                  setEditingPieza(null);
                  setPieceMode("existing");
                  router.refresh();
                }}
                onSaveAndAddAnother={() => {
                  setSuccessMsg("¡Pieza guardada! Podés cargar la siguiente.");
                  setEditingPieza(null);
                  setPieceMode("new");
                  router.refresh();
                }}
                onFinishProduction={() => {
                  setEditingPieza(null);
                  router.refresh();
                  setStep("preview");
                }}
                onSaveDraft={() => {
                  router.push("/admin/produccion");
                  router.refresh();
                }}
                onDeletePiece={
                  pieceMode === "edit" && editingPieza
                    ? () => handleDeletePieza(editingPieza.id, editingPieza.nombre)
                    : undefined
                }
                onCancel={() => {
                  setEditingPieza(null);
                  setPieceMode("existing");
                }}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">

            <Button
              onClick={() => handleSavePiece(true)}
              isLoading={pending}
            >
              💾 Guardar y agregar otra pieza
            </Button>
            <Button
              onClick={handleFinishAndPreview}
              isLoading={pending}
              disabled={piezas.length === 0}
            >
              ✅ Finalizar y previsualizar ({piezas.length} pieza{piezas.length !== 1 ? "s" : ""})
            </Button>
            {(currentPiezaId || editingPiezaId) && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  const targetId = editingPiezaId ?? currentPiezaId;
                  if (!targetId) return;
                  const currentPieza = piezas.find((p) => p.id === targetId);
                  handleDeletePieza(targetId, currentPieza?.nombre);
                }}
                disabled={pending}
                className="text-destructive hover:bg-destructive/10"
              >
                🗑️ Eliminar esta pieza
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => {
                router.push("/admin/produccion");
              }}
            >
              ⏸️ Guardar borrador y salir
            </Button>

          </div>

        </div>
      )}

      {/* ═══ STEP 3: PREVIEW ═══ */}
      {step === "preview" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">Previsualizar colección</h2>
            <p className="mt-1 text-sm text-muted">
              Revisá tus {piezas.length} pieza{piezas.length !== 1 ? "s" : ""} antes de publicar.
              Una vez publicadas, serán visibles en la tienda.
            </p>
          </div>

          {piezas.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <p className="text-muted">No hay piezas en esta producción todavía.</p>
              <Button className="mt-4" onClick={() => setStep("pieces")}>
                ← Volver a cargar piezas
              </Button>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {piezas.map((pieza) => (
                  <div
                    key={pieza.id}
                    className="group overflow-hidden rounded-xl border border-border bg-surface transition-shadow hover:shadow-md"
                  >
                    {/* Image */}
                    <div className="relative aspect-[4/3] bg-background">
                      {pieza.producto_imagenes?.[0]?.url_imagen ? (
                        <img
                          src={pieza.producto_imagenes[0].url_imagen}
                          alt={pieza.nombre}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-3xl text-muted">
                          🎨
                        </div>
                      )}
                      {pieza.producto_imagenes && pieza.producto_imagenes.length > 1 && (
                        <span className="absolute bottom-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                          +{pieza.producto_imagenes.length - 1} fotos
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <h3 className="font-medium leading-tight">{pieza.nombre}</h3>
                      {pieza.descripcion && (
                        <p className="mt-1 text-xs text-muted line-clamp-2">{pieza.descripcion}</p>
                      )}
                      <div className="mt-3 flex items-center justify-between">
                        <span className="font-semibold">
                          ${Number(pieza.precio_base).toLocaleString("es-AR")}
                        </span>
                        <span className="text-xs text-muted">
                          Stock: {pieza.stock_disponible}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="mt-3 flex gap-2 border-t border-border pt-3">
                        <button
                          type="button"
                          onClick={() => handleEditPieza(pieza)}
                          className="text-xs text-admin-accent hover:text-admin-accent-hover transition-colors"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePieza(pieza.id, pieza.nombre)}
                          className="text-xs text-destructive font-medium hover:underline transition-colors"
                        >
                          🗑️ Eliminar pieza
                        </button>

                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 border-t border-border pt-6">
                <Button
                  onClick={handleUpdateWithoutRelauch}
                  isLoading={pending}
                  className="bg-chocolate text-white hover:bg-chocolate/90 cursor-pointer"
                >
                  💾 Actualizar Producción (Sin relanzar)
                </Button>
                <Button
                  onClick={handlePublish}
                  isLoading={pending}
                  variant="outline"
                  className="cursor-pointer"
                >
                  🚀 Relanzar / Publicar con Fecha de Hoy ({piezas.length} pieza{piezas.length !== 1 ? "s" : ""})
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setStep("pieces")}
                >
                  ✏️ Seguir editando
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    router.push("/admin/produccion");
                    router.refresh();
                  }}
                >
                  ↩️ Volver al listado
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

