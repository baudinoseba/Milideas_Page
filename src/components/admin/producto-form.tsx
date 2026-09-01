"use client";

import { useState, useRef, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { ImageUpload } from "@/components/admin/image-upload";
import {
  saveProductoAction,
  createCategoriaInlineAction,
  generarDescripcionProductoIAAction,
} from "@/lib/actions";
import type { Categoria, Producto, ProductoImagen, TipoCatalogo } from "@/types";

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function ProductoForm({
  categorias,
  producto,
  imagenes,
  produccionId,
  categoriaIdInicial,
  onSuccess,
  onSaveAndAddAnother,
  onFinishProduction,
  onSaveDraft,
  onDeletePiece,
  onCancel,
  submitText,
  isWizardMode = false,
}: {
  categorias: Categoria[];
  producto?: Producto;
  imagenes?: ProductoImagen[];
  produccionId?: string;
  categoriaIdInicial?: string;
  onSuccess?: (productoId?: string) => void;
  onSaveAndAddAnother?: (productoId?: string) => void;
  onFinishProduction?: () => void;
  onSaveDraft?: () => void;
  onDeletePiece?: () => void;
  onCancel?: () => void;
  submitText?: string;
  isWizardMode?: boolean;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  const [precioVal, setPrecioVal] = useState<string>(
    producto?.precio_base != null ? String(producto.precio_base) : ""
  );
  const [localCategorias, setLocalCategorias] = useState<Categoria[]>(categorias);
  const prodRecord = producto as (Record<string, unknown> & typeof producto);

  const [selectedTipoCatalogo, setSelectedTipoCatalogo] = useState<string>(
    prodRecord?.tipo_catalogo ? String(prodRecord.tipo_catalogo) : "ceramica"
  );

  const [selectedCategoriaId, setSelectedCategoriaId] = useState<string>(
    producto?.categoria_id ?? categoriaIdInicial ?? ""
  );
  const [showNuevaCategoria, setShowNuevaCategoria] = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState("");
  const [creandoCategoria, setCreandoCategoria] = useState(false);

  // Photos state (supports both existing images and newly selected local previews)
  const [selectedFilePreviews, setSelectedFilePreviews] = useState<
    Array<{ id: string; url: string; file?: File }>
  >((imagenes ?? []).sort((a, b) => a.orden - b.orden).map((img) => ({ id: img.id, url: img.url_imagen })));

  const [descripcionVal, setDescripcionVal] = useState<string>(producto?.descripcion ?? "");
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Sync state if producto prop changes
  useEffect(() => {
    if (producto) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPrecioVal(producto.precio_base != null ? String(producto.precio_base) : "");
      setSelectedTipoCatalogo((producto as Record<string, unknown>)?.tipo_catalogo ? String((producto as Record<string, unknown>).tipo_catalogo) : "ceramica");
      setSelectedCategoriaId(producto.categoria_id ?? categoriaIdInicial ?? "");
      setDescripcionVal(producto.descripcion ?? "");
    }
    if (imagenes) {
      setSelectedFilePreviews(
        [...imagenes].sort((a, b) => a.orden - b.orden).map((img) => ({ id: img.id, url: img.url_imagen }))
      );
    }
  }, [producto, imagenes, categoriaIdInicial]);

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newItems: Array<{ id: string; url: string; file?: File }> = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file) continue;
      const dataUrl = URL.createObjectURL(file);
      newItems.push({
        id: `local-${Date.now()}-${i}`,
        url: dataUrl,
        file,
      });
    }

    setSelectedFilePreviews((prev) => [...prev, ...newItems]);
  };

  const handleGenerateAiDescription = async () => {
    const nombreInput = (document.getElementById("nombre") as HTMLInputElement)?.value ?? "";
    const firstImgUrl = selectedFilePreviews[0]?.url ?? null;

    if (!firstImgUrl) {
      setAiError("Subí o seleccioná al menos una foto de la pieza arriba para que Gemini pueda analizarla.");
      return;
    }

    setGeneratingAi(true);
    setAiError(null);

    let processUrl = firstImgUrl;
    if (firstImgUrl.startsWith("blob:")) {
      try {
        const blobRes = await fetch(firstImgUrl);
        const blob = await blobRes.blob();
        processUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        console.error("Error reading blob image:", e);
      }
    }

    const res = await generarDescripcionProductoIAAction(processUrl, nombreInput);
    setGeneratingAi(false);

    if (res.success && res.descripcion) {
      setDescripcionVal(res.descripcion);
    } else if (res.error) {
      setAiError(res.error);
    }
  };

  const filteredCategorias = localCategorias.filter(
    (c) => !c.tipo_catalogo || c.tipo_catalogo === selectedTipoCatalogo
  );

  const handleCreateCategoria = async () => {
    if (!nuevaCategoria.trim()) return;
    setCreandoCategoria(true);
    const res = await createCategoriaInlineAction(nuevaCategoria.trim());
    setCreandoCategoria(false);
    if (res.success && res.id && res.nombre) {
      const newCat: Categoria = {
        id: res.id,
        nombre: res.nombre,
        tipo_catalogo: selectedTipoCatalogo as TipoCatalogo,
        created_at: new Date().toISOString(),
      };
      setLocalCategorias((prev) => [...prev, newCat]);
      setSelectedCategoriaId(res.id);
      setNuevaCategoria("");
      setShowNuevaCategoria(false);
    }
  };

  const processFormSubmit = (
    onDone?: (id?: string) => void,
  ) => {
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    if (produccionId) {
      formData.set("produccionId", produccionId);
    }
    startTransition(async () => {
      const result = await saveProductoAction(formData, producto?.id);
      if (!result.error) {
        const savedId = (result as { id?: string }).id;
        if (onDone) {
          onDone(savedId);
        } else if (onSuccess) {
          onSuccess(savedId);
        } else {
          router.push("/admin/productos");
        }
      } else {
        setAiError(result.error);
      }
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    processFormSubmit(onSuccess);
  };

  const attr = ((producto as Record<string, unknown> | null)?.atributos_especificos as Record<string, unknown> | undefined) ?? {};

  return (
    <div className={isWizardMode ? "space-y-6" : "max-w-2xl space-y-8"}>
      {!isWizardMode && (
        <div className="mb-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-chocolate font-sans cursor-pointer py-1"
          >
            <span>← Volver a la sección anterior</span>
          </button>
        </div>
      )}
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
        {produccionId && <input type="hidden" name="produccionId" value={produccionId} />}
        {producto?.id && <input type="hidden" name="productoId" value={producto.id} />}

        {/* ─── Section 1: Información básica & Categoría ─── */}
        <section className="space-y-4">
          <div className="border-b border-border pb-2">
            <h2 className="text-lg font-medium">Información básica y Categoría</h2>
            <p className="text-xs text-muted">Nombre de la pieza, catálogo y categoría</p>
          </div>

          <div>
            <Label htmlFor="nombre">Nombre de la pieza *</Label>
            <Input
              id="nombre"
              name="nombre"
              defaultValue={producto?.nombre}
              placeholder="Ej: Taza Luna Llena"
              required
              onChange={(e) => {
                if (!producto) {
                  const slugInput = document.getElementById("slug") as HTMLInputElement;
                  if (slugInput) slugInput.value = slugify(e.target.value);
                }
              }}
            />
          </div>

          <div>
            <Label htmlFor="slug">URL amigable (slug)</Label>
            <Input
              id="slug"
              name="slug"
              defaultValue={producto?.slug}
              placeholder="taza-luna-llena"
              required
            />
            <p className="mt-1 text-[11px] text-muted">
              Se genera automáticamente a partir del nombre
            </p>
          </div>

          {/* Categoría / Disciplina ubicadas ANTES de la imagen y la descripción */}
          <div className="grid gap-4 sm:grid-cols-2 pt-2">
            <div>
              <Label htmlFor="tipoCatalogo" className="text-xs font-semibold text-chocolate">Disciplina / Catálogo *</Label>
              <Select
                id="tipoCatalogo"
                name="tipoCatalogo"
                value={selectedTipoCatalogo}
                onChange={(e) => setSelectedTipoCatalogo(e.target.value)}
                required
                className="mt-1 font-semibold"
              >
                <option value="ceramica">🏺 Cerámica (Piezas Utilitarias / Objetos)</option>
                <option value="esculturas">🗿 Esculturas (Modelado Tridimensional)</option>
                <option value="ilustraciones">🎨 Ilustraciones (Láminas / Obras en Papel)</option>
              </Select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="categoriaId">Categoría específica</Label>
                {!showNuevaCategoria && (
                  <button
                    type="button"
                    onClick={() => setShowNuevaCategoria(true)}
                    className="text-xs text-admin-accent hover:underline font-medium"
                  >
                    + Nueva categoría
                  </button>
                )}
              </div>

              {showNuevaCategoria ? (
                <div className="flex gap-2">
                  <Input
                    value={nuevaCategoria}
                    onChange={(e) => setNuevaCategoria(e.target.value)}
                    placeholder="ej. Jarra, Acuarela, Animales..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleCreateCategoria();
                      }
                    }}
                    autoFocus
                  />
                  <Button
                    type="button"
                    onClick={handleCreateCategoria}
                    isLoading={creandoCategoria}
                    className="shrink-0"
                  >
                    Crear
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setShowNuevaCategoria(false);
                      setNuevaCategoria("");
                    }}
                    className="shrink-0"
                  >
                    Cancelar
                  </Button>
                </div>
              ) : (
                <Select
                  id="categoriaId"
                  name="categoriaId"
                  value={selectedCategoriaId}
                  onChange={(e) => setSelectedCategoriaId(e.target.value)}
                >
                  <option value="">Sin categoría específica</option>
                  {filteredCategorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </Select>
              )}
            </div>
          </div>
        </section>

        {/* ─── Section 2: Fotos de la Pieza ─── */}
        <section className="space-y-4 rounded-xl border border-border/80 bg-surface p-4 shadow-xs">
          <div className="border-b border-border/60 pb-2 flex items-center justify-between">
            <div>
              <h2 className="text-base font-medium text-chocolate">📷 1. Fotos de la pieza</h2>
              <p className="text-xs text-muted">
                Subí las fotos antes de generar la descripción. La primera foto se usará para analizarla con la IA.
              </p>
            </div>
            {selectedFilePreviews.length > 0 && (
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                ✓ {selectedFilePreviews.length} foto{selectedFilePreviews.length !== 1 ? "s" : ""} lista{selectedFilePreviews.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {producto?.id ? (
            <ImageUpload productoId={producto.id} imagenes={imagenes ?? []} />
          ) : (
            <div className="space-y-3">
              {/* Previews grid */}
              {selectedFilePreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {selectedFilePreviews.map((img, idx) => (
                    <div key={img.id} className="relative aspect-square overflow-hidden rounded-lg border border-border bg-surface shadow-xs">
                      <img src={img.url} alt="Foto previa" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setSelectedFilePreviews((prev) => prev.filter((p) => p.id !== img.id))}
                        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black text-xs"
                      >
                        ✕
                      </button>
                      {idx === 0 && (
                        <span className="absolute bottom-1 left-1 rounded bg-terracota px-1.5 py-0.5 text-[9px] font-bold text-white">
                          Imagen para IA
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Dropzone & file selector */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-terracota/40 bg-terracota/5 p-6 text-center cursor-pointer hover:border-terracota transition-all"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  name="imageFiles"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files)}
                />
                <span className="text-3xl mb-1">📷</span>
                <p className="text-sm font-semibold text-chocolate">
                  Hacé clic acá para cargar las fotos de la pieza
                </p>
                <p className="text-xs text-muted mt-0.5">
                  Seleccioná fotos desde tu dispositivo (JPG, PNG, WebP)
                </p>
              </div>
            </div>
          )}
        </section>

        {/* ─── Section 3: Descripción & Redacción con IA (Gemini) ─── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="descripcion" className="text-sm font-medium">2. Descripción de la pieza</Label>
            <button
              type="button"
              onClick={handleGenerateAiDescription}
              disabled={generatingAi || selectedFilePreviews.length === 0}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
                selectedFilePreviews.length > 0
                  ? "border-terracota bg-terracota text-white shadow-xs hover:bg-chocolate cursor-pointer"
                  : "border-border bg-surface text-muted cursor-not-allowed opacity-60"
              }`}
              title={
                selectedFilePreviews.length > 0
                  ? "Gemini analizará la primera foto cargada arriba y redactará la descripción con la voz de la artista"
                  : "Primero subí o seleccioná una foto arriba para habilitar la IA"
              }
            >
              <span className={generatingAi ? "animate-spin" : ""}>✨</span>
              <span>{generatingAi ? "Analizando foto con Gemini..." : "Redactar con IA (Gemini)"}</span>
            </button>
          </div>

          {selectedFilePreviews.length === 0 && (
            <p className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-lg border border-amber-200 dark:border-amber-800">
              📷 <strong>Paso previo requerido:</strong> Cargá o seleccioná al menos una foto de la pieza en el recuadro superior para habilitar la redacción automática con IA.
            </p>
          )}

          <Textarea
            id="descripcion"
            name="descripcion"
            value={descripcionVal}
            onChange={(e) => setDescripcionVal(e.target.value)}
            placeholder="Describí la pieza o usá el botón de IA arriba para redactarla automáticamente a partir de la foto..."
            rows={5}
          />
          {aiError && (
            <p className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
              ⚠️ {aiError}
            </p>
          )}
        </section>

        {/* ─── Section 4: Especificaciones Técnicas por Disciplina ─── */}
        <section className="space-y-4">
          <div className="rounded-2xl border border-admin-accent/30 bg-arena/30 p-4 space-y-4">
            <h3 className="text-xs font-serif font-semibold text-chocolate uppercase tracking-wider flex items-center gap-1.5">
              <span>{selectedTipoCatalogo === "ceramica" ? "🏺" : selectedTipoCatalogo === "esculturas" ? "🗿" : "🎨"}</span>
              <span>Especificaciones Técnicas — {selectedTipoCatalogo.toUpperCase()}</span>
            </h3>

            {/* CERAMICA Specific Fields */}
            {selectedTipoCatalogo === "ceramica" && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="capacidadMl" className="text-xs text-chocolate font-medium">Capacidad (ml)</Label>
                  <Input
                    id="capacidadMl"
                    name="capacidadMl"
                    type="number"
                    defaultValue={((producto as Record<string, unknown>)?.capacidad_ml as string | number) ?? (attr.capacidad_ml as string | number) ?? ""}
                    placeholder="ej. 350"
                  />
                </div>
                <div className="flex flex-wrap gap-4 pt-1">
                  <label className="flex items-center gap-2 text-xs font-semibold text-chocolate cursor-pointer">
                    <input
                      type="checkbox"
                      name="hechoEnTorno"
                      defaultChecked={Boolean(((producto as Record<string, unknown>)?.material_tecnica as string)?.toLowerCase().includes("torno") || (attr.hecho_en_torno as boolean))}
                      className="h-4 w-4 rounded border-border accent-admin-accent"
                    />
                    🏺 Hecho en torno alfarero
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-chocolate cursor-pointer">
                    <input
                      type="checkbox"
                      name="aptoLavavajillas"
                      defaultChecked={((producto as Record<string, unknown>)?.apto_lavavajillas as boolean) ?? (attr.apto_lavavajillas as boolean) ?? true}
                      className="h-4 w-4 rounded border-border accent-admin-accent"
                    />
                    🧽 Apto lavavajillas
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-chocolate cursor-pointer">
                    <input
                      type="checkbox"
                      name="aptoMicroondas"
                      defaultChecked={((producto as Record<string, unknown>)?.apto_microondas as boolean) ?? (attr.apto_microondas as boolean) ?? true}
                      className="h-4 w-4 rounded border-border accent-admin-accent"
                    />
                    ♨️ Apto microondas
                  </label>
                </div>
              </div>
            )}

            {/* ILUSTRACIONES Specific Fields */}
            {selectedTipoCatalogo === "ilustraciones" && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="papelSoporte" className="text-xs text-chocolate font-medium">Soporte / Papel</Label>
                    <Input
                      id="papelSoporte"
                      name="papelSoporte"
                      defaultValue={((producto as Record<string, unknown>)?.papel_soporte as string) ?? (attr.papel_soporte as string) ?? "Papel Canson 300g Acuarela"}
                      placeholder="ej. Papel Canson 300g"
                    />
                  </div>
                  <div>
                    <Label htmlFor="materialTecnica" className="text-xs text-chocolate font-medium">Técnica de Ilustración</Label>
                    <Input
                      id="materialTecnica"
                      name="materialTecnica"
                      defaultValue={((producto as Record<string, unknown>)?.material_tecnica as string) ?? (attr.material_tecnica as string) ?? ""}
                      placeholder="ej. Acuarela y tinta china"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-xs font-medium text-chocolate cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    name="marcoIncluido"
                    defaultChecked={((producto as Record<string, unknown>)?.marco_incluido as boolean) ?? (attr.marco_incluido as boolean) ?? false}
                    className="h-4 w-4 rounded border-border accent-admin-accent"
                  />
                  🖼️ Incluye marco artesanal de madera
                </label>
              </div>
            )}

            {/* ESCULTURAS Specific Fields */}
            {selectedTipoCatalogo === "esculturas" && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="materialTecnica" className="text-xs text-chocolate font-medium">Material / Pasta Escultórica</Label>
                    <Input
                      id="materialTecnica"
                      name="materialTecnica"
                      defaultValue={((producto as Record<string, unknown>)?.material_tecnica as string) ?? (attr.material_tecnica as string) ?? ""}
                      placeholder="ej. Pasta Gres modelada a mano"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edicionNumerada" className="text-xs text-chocolate font-medium">Edición Limitada / Numeración</Label>
                    <Input
                      id="edicionNumerada"
                      name="edicionNumerada"
                      defaultValue={((producto as Record<string, unknown>)?.edicion_numerada as string) ?? (attr.edicion_numerada as string) ?? ""}
                      placeholder="ej. Edición Única 1/1 o 3/10"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-xs font-medium text-chocolate cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    name="pedestalIncluido"
                    defaultChecked={((producto as Record<string, unknown>)?.pedestal_incluido as boolean) ?? (attr.pedestal_incluido as boolean) ?? false}
                    className="h-4 w-4 rounded border-border accent-admin-accent"
                  />
                  🗿 Incluye pedestal o base de exposición
                </label>
              </div>
            )}
          </div>

          {/* Dimensiones y medidas aproximadamente */}
          <div className="rounded-xl border border-border/60 bg-surface/50 p-4 space-y-3">
            <Label className="text-sm font-semibold flex items-center gap-1.5">
              <span>📐</span>
              <span>Medidas Aproximadas (Alto, Ancho)</span>
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="altoCm" className="text-xs text-muted">Alto (cm)</Label>
                <Input
                  id="altoCm"
                  name="altoCm"
                  type="number"
                  step="0.1"
                  defaultValue={((producto as Record<string, unknown>)?.alto_cm as number | undefined) ?? ""}
                  placeholder="ej. 10"
                />
              </div>
              <div>
                <Label htmlFor="anchoCm" className="text-xs text-muted">Ancho / Diámetro (cm)</Label>
                <Input
                  id="anchoCm"
                  name="anchoCm"
                  type="number"
                  step="0.1"
                  defaultValue={((producto as Record<string, unknown>)?.ancho_cm as number | undefined) ?? ""}
                  placeholder="ej. 15"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="dimensiones" className="text-xs text-muted">Detalle adicional o aclaraciones (opcional)</Label>
              <Input
                id="dimensiones"
                name="dimensiones"
                defaultValue={producto?.dimensiones ?? ""}
                placeholder="ej. Diámetro base: 12 cm"
              />
            </div>
          </div>
        </section>

        {/* ─── Section 5: Pricing & Stock ─── */}
        <section className="space-y-4">
          <div className="border-b border-border pb-2">
            <h2 className="text-lg font-medium">Precio y stock</h2>
            <p className="text-xs text-muted">Cuántas unidades tenés y a qué precio se venden</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="precioBase">Precio base (ARS)</Label>
              <Input
                id="precioBase"
                name="precioBase"
                type="number"
                value={precioVal}
                onChange={(e) => setPrecioVal(e.target.value)}
                placeholder="0"
                required
                min={0}
              />
              {Number(precioVal) > 0 && Number(precioVal) % 1000 === 0 && (
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                  <span>
                    💡 <strong>Sugerencia de marketing:</strong> Para ${Number(precioVal).toLocaleString("es-AR")}, se recomienda usar ${(Number(precioVal) - 1).toLocaleString("es-AR")} por impacto psicológico visual.
                  </span>
                  <button
                    type="button"
                    onClick={() => setPrecioVal(String(Number(precioVal) - 1))}
                    className="shrink-0 rounded bg-amber-200/80 px-2 py-1 font-semibold text-amber-900 hover:bg-amber-300 transition-colors dark:bg-amber-900/60 dark:text-amber-100"
                  >
                    Usar ${(Number(precioVal) - 1).toLocaleString("es-AR")}
                  </button>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="stockDisponible">Stock disponible</Label>
              <Input
                id="stockDisponible"
                name="stockDisponible"
                type="number"
                defaultValue={producto?.stock_disponible ?? 1}
                required
                min={0}
              />
            </div>
          </div>
        </section>

        {/* ─── Section 6: Publication ─── */}
        {!isWizardMode && (
          <section className="space-y-4">
            <div className="border-b border-border pb-2">
              <h2 className="text-lg font-medium">Publicación</h2>
              <p className="text-xs text-muted">Controlá si la pieza es visible y cuándo se lanza</p>
            </div>

            <div>
              <Label htmlFor="fechaLanzamiento">Fecha de lanzamiento (colección)</Label>
              <Input
                id="fechaLanzamiento"
                name="fechaLanzamiento"
                type="datetime-local"
                defaultValue={
                  producto?.fecha_lanzamiento
                    ? new Date(producto.fecha_lanzamiento).toISOString().slice(0, 16)
                    : ""
                }
              />
              <p className="mt-1 text-[11px] text-muted">
                Si tiene fecha de lanzamiento, la pieza aparece en la sección de Colecciones
              </p>
            </div>

            <label className="flex items-center gap-3 rounded-lg border border-border p-4 cursor-pointer hover:bg-surface transition-colors">
              <input
                type="checkbox"
                name="activo"
                defaultChecked={producto?.activo ?? true}
                className="h-5 w-5 rounded border-border accent-admin-accent"
              />
              <div>
                <p className="text-sm font-medium">Visible en la tienda</p>
                <p className="text-xs text-muted">
                  Si está desactivado, la pieza no se muestra a los clientes
                </p>
              </div>
            </label>
          </section>
        )}

        {/* ─── Action Buttons requested by user ─── */}
        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-6">
          {/* Main submit: Actualizar pieza or Crear pieza */}
          <Button type="submit" isLoading={pending} className="cursor-pointer">
            {submitText ?? (producto ? "💾 Actualizar pieza" : "💾 Crear pieza")}
          </Button>

          {/* Option: Guardar y agregar otra pieza (wizard or standard) */}
          {onSaveAndAddAnother && (
            <Button
              type="button"
              variant="outline"
              isLoading={pending}
              onClick={() => processFormSubmit(onSaveAndAddAnother)}
              className="cursor-pointer"
            >
              ➕ Guardar y agregar otra pieza
            </Button>
          )}

          {/* Option: Finalizar producción */}
          {onFinishProduction && (
            <Button
              type="button"
              variant="outline"
              onClick={onFinishProduction}
              className="cursor-pointer"
            >
              ➡️ Finalizar producción
            </Button>
          )}

          {/* Option: Guardar borrador */}
          {onSaveDraft && (
            <Button
              type="button"
              variant="ghost"
              onClick={onSaveDraft}
              className="cursor-pointer"
            >
              💾 Guardar borrador
            </Button>
          )}

          {/* Option: Eliminar pieza (when editing) */}
          {producto?.id && onDeletePiece && (
            <Button
              type="button"
              variant="ghost"
              onClick={onDeletePiece}
              className="text-destructive hover:bg-destructive/10 cursor-pointer ml-auto"
            >
              🗑️ Eliminar esta pieza
            </Button>
          )}

          {/* Cancel button fallback */}
          {!isWizardMode && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                if (onCancel) onCancel();
                else router.push("/admin/productos");
              }}
            >
              Cancelar
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
