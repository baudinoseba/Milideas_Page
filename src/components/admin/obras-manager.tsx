"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils/cn";
import { FileImageUpload } from "@/components/admin/file-image-upload";
import { saveObraProyectoAction, deleteObraProyectoAction } from "@/lib/actions";
import type { ObraProyecto } from "@/types";
import { Button } from "@/components/ui/button";
import { toast } from "@/stores/toast-store";

interface ObrasManagerProps {
  obras: ObraProyecto[];
}

interface CategoriaConfigItem {
  id: string;
  label: string;
  emoji: string;
}

const CATEGORIAS_DEFAULT: CategoriaConfigItem[] = [
  { id: "murales", label: "Murales & Vidrieras", emoji: "🖌️" },
  { id: "esculturas", label: "Esculturas 3D / Mascotas", emoji: "🐾" },
  { id: "gran_dimension_b2b", label: "Gastronomía & B2B", emoji: "🍽️" },
  { id: "ilustraciones", label: "Ilustraciones Gran Formato", emoji: "🎨" },
  { id: "miniaturas", label: "Miniaturas & Objetos", emoji: "🔎" },
];

const EMOJIS_DISPONIBLES = [
  "🖌️", "🐾", "🍽️", "🎨", "🔎", "🌿", "☕", "🏢", "✨", "🏺", "🖼️", "📐", "📦", "🏮", "🏡",
];

export function ObrasManager({ obras: initialObras }: ObrasManagerProps) {
  const [obras, setObras] = useState<ObraProyecto[]>(initialObras);
  const [categorias, setCategorias] = useState<CategoriaConfigItem[]>(CATEGORIAS_DEFAULT);
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todas");
  const [modalObra, setModalObra] = useState<Partial<ObraProyecto> | null>(null);
  const [confirmDeleteObra, setConfirmDeleteObra] = useState<{ id: string; titulo: string } | null>(null);
  const [fotosObra, setFotosObra] = useState<string[]>([]);
  const [creandoNuevaCategoria, setCreandoNuevaCategoria] = useState(false);
  const [nuevaCatNombre, setNuevaCatNombre] = useState("");
  const [nuevaCatEmoji, setNuevaCatEmoji] = useState("✨");
  const [isPending, startTransition] = useTransition();

  const obrasFiltradas = obras.filter((o) => {
    if (filtroCategoria === "todas") return true;
    return o.categoria === filtroCategoria;
  });

  const abrirModal = (obra?: ObraProyecto) => {
    if (obra) {
      setModalObra(obra);
      setFotosObra(Array.isArray(obra.fotos) ? obra.fotos : [obra.portada_url || ""].filter(Boolean));
    } else {
      setModalObra({ categoria: categorias[0]?.id || "murales", destacado_home: true });
      setFotosObra([]);
    }
    setCreandoNuevaCategoria(false);
    setNuevaCatNombre("");
  };

  const handleAgregarCategoria = () => {
    if (!nuevaCatNombre.trim()) return;
    const catId = nuevaCatNombre.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    const nueva: CategoriaConfigItem = {
      id: catId,
      label: nuevaCatNombre.trim(),
      emoji: nuevaCatEmoji,
    };
    setCategorias((prev) => [...prev, nueva]);
    setModalObra((prev) => ({ ...prev, categoria: catId as any }));
    setCreandoNuevaCategoria(false);
    setNuevaCatNombre("");
    toast.success(`Categoría "${nueva.label}" creada`);
  };

  const handleGuardarModal = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("fotos", JSON.stringify(fotosObra));
    fd.set("portadaUrl", fotosObra[0] || "");

    startTransition(async () => {
      const res = await saveObraProyectoAction(fd);
      if (res.success) {
        setModalObra(null);
        toast.success("Obra / Proyecto guardado con éxito");
        window.location.reload();
      } else {
        toast.error(res.error || "Error al guardar obra");
      }
    });
  };

  const handleEliminarConfirmado = (id: string) => {
    startTransition(async () => {
      const res = await deleteObraProyectoAction(id);
      if (res.success) {
        setObras((prev) => prev.filter((o) => o.id !== id));
        setConfirmDeleteObra(null);
        toast.success("Obra / Proyecto eliminado");
      } else {
        toast.error(res.error || "Error al eliminar");
      }
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Limpio sin subtítulo redundante ni botón volver */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4 gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl sm:text-3xl">🌟</span>
          <h1 className="text-2xl font-serif font-bold text-chocolate">
            Obras & Proyectos Especiales
          </h1>
        </div>

        <Button
          type="button"
          onClick={() => abrirModal()}
          className="bg-chocolate text-crema-cruda hover:bg-chocolate/90 rounded-xl text-xs font-semibold min-h-9 py-1 px-3.5 shadow-xs cursor-pointer self-start sm:self-auto"
        >
          + Nuevo Proyecto
        </Button>
      </div>

      {/* Filtros por Categoría */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setFiltroCategoria("todas")}
          className={cn(
            "rounded-xl px-3 py-1.5 text-xs font-medium font-sans transition-all shrink-0 cursor-pointer shadow-2xs",
            filtroCategoria === "todas"
              ? "bg-chocolate text-crema-cruda font-bold shadow-xs"
              : "bg-white text-stone-700 border border-[#E5E0D8] hover:bg-stone-50",
          )}
        >
          Todas ({obras.length})
        </button>
        {categorias.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setFiltroCategoria(cat.id)}
            className={cn(
              "rounded-xl px-3 py-1.5 text-xs font-medium font-sans transition-all shrink-0 cursor-pointer shadow-2xs flex items-center gap-1",
              filtroCategoria === cat.id
                ? "bg-chocolate text-crema-cruda font-bold shadow-xs"
                : "bg-white text-stone-700 border border-[#E5E0D8] hover:bg-stone-50",
            )}
          >
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Lista de Proyectos */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {obrasFiltradas.map((obra) => {
          const cat = categorias.find((c) => c.id === obra.categoria);
          const fotos = Array.isArray(obra.fotos) ? obra.fotos : [];

          return (
            <div
              key={obra.id}
              className="rounded-3xl border border-[#E5E0D8] bg-white p-4 shadow-xs flex flex-col justify-between space-y-3 hover:border-chocolate/40 transition-all"
            >
              <div className="space-y-2.5">
                {/* Miniatura de portada */}
                <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-arena/30 border border-[#E5E0D8] flex items-center justify-center">
                  {obra.portada_url || fotos[0] ? (
                    <img src={obra.portada_url || fotos[0]} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-3xl">{cat?.emoji || "✨"}</span>
                  )}
                  {obra.destacado_home && (
                    <span className="absolute top-2 right-2 rounded-full bg-emerald-700 text-white px-2.5 py-0.5 text-[10px] font-bold shadow-xs">
                      ★ Destacado en Home
                    </span>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between text-[10px] font-bold text-chocolate uppercase tracking-wider">
                    <span>{cat ? `${cat.emoji} ${cat.label}` : "Obra"}</span>
                    {obra.cliente_lugar && <span className="text-stone-500 truncate max-w-[120px]">📍 {obra.cliente_lugar}</span>}
                  </div>
                  <h3 className="text-sm font-serif font-bold text-stone-900 mt-0.5">{obra.titulo}</h3>
                  {obra.subtitulo && <p className="text-xs text-emerald-800 font-semibold line-clamp-1">{obra.subtitulo}</p>}
                  {obra.descripcion && <p className="text-xs text-stone-600 font-sans line-clamp-2 mt-1">{obra.descripcion}</p>}
                </div>
              </div>

              <div className="pt-2 border-t border-[#F0EDE8] flex items-center justify-between">
                <span className="text-[11px] text-stone-500 font-mono">{fotos.length} fotos</span>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    onClick={() => abrirModal(obra)}
                    className="text-[11px] rounded-xl h-7 py-0.5 px-2.5 font-semibold text-stone-800 border-stone-300"
                  >
                    ✏️ Editar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setConfirmDeleteObra({ id: obra.id, titulo: obra.titulo })}
                    className="text-[11px] rounded-xl h-7 py-0.5 px-2 text-red-600 hover:bg-red-50 border-red-200"
                  >
                    🗑️
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Crear / Editar Obra */}
      {modalObra && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-white p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-base font-serif font-bold text-chocolate">
                {modalObra.id ? "Editar Obra / Proyecto" : "Nuevo Proyecto"}
              </h3>
              <button
                type="button"
                onClick={() => setModalObra(null)}
                className="text-stone-400 hover:text-stone-900 text-base font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarModal} className="space-y-3 text-xs">
              {modalObra.id && <input type="hidden" name="id" value={modalObra.id} />}

              <div>
                <label className="font-bold text-stone-900 block mb-1">Título del Proyecto *</label>
                <input
                  type="text"
                  name="titulo"
                  required
                  defaultValue={modalObra.titulo || ""}
                  placeholder="ej. Mural Botánico en Heladería, Escultura Simón..."
                  className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-stone-900 focus:outline-none focus:ring-1 focus:ring-chocolate"
                />
              </div>

              {/* Selector de Categoría + Botón para Crear Nueva Categoría */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-stone-900">Categoría *</label>
                  <button
                    type="button"
                    onClick={() => setCreandoNuevaCategoria(!creandoNuevaCategoria)}
                    className="text-[11px] font-bold text-chocolate hover:underline cursor-pointer"
                  >
                    {creandoNuevaCategoria ? "← Elegir existente" : "+ Nueva categoría"}
                  </button>
                </div>

                {creandoNuevaCategoria ? (
                  <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E5E0D8] space-y-2 animate-in fade-in">
                    <p className="text-[11px] font-bold text-chocolate">Crear nueva categoría:</p>
                    <div className="flex gap-2">
                      <div className="relative">
                        <select
                          value={nuevaCatEmoji}
                          onChange={(e) => setNuevaCatEmoji(e.target.value)}
                          className="rounded-xl border border-stone-300 bg-white px-2.5 py-1.5 text-sm"
                        >
                          {EMOJIS_DISPONIBLES.map((em) => (
                            <option key={em} value={em}>
                              {em}
                            </option>
                          ))}
                        </select>
                      </div>
                      <input
                        type="text"
                        value={nuevaCatNombre}
                        onChange={(e) => setNuevaCatNombre(e.target.value)}
                        placeholder="Nombre de la categoría..."
                        className="flex-1 rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-xs text-stone-900 focus:outline-none"
                      />
                      <Button
                        type="button"
                        onClick={handleAgregarCategoria}
                        className="rounded-xl bg-chocolate text-crema-cruda px-3 py-1.5 font-bold text-xs"
                      >
                        Crear
                      </Button>
                    </div>
                  </div>
                ) : (
                  <select
                    name="categoria"
                    defaultValue={modalObra.categoria || categorias[0]?.id}
                    className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-stone-900 focus:outline-none focus:ring-1 focus:ring-chocolate"
                  >
                    {categorias.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.emoji} {c.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="font-bold text-stone-900 block mb-1">Cliente / Lugar</label>
                <input
                  type="text"
                  name="clienteLugar"
                  defaultValue={modalObra.cliente_lugar || ""}
                  placeholder="ej. Sunchales / Rafaela / Heladería Grido..."
                  className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-stone-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-stone-900 block mb-1">Subtítulo / Técnica</label>
                <input
                  type="text"
                  name="subtitulo"
                  defaultValue={modalObra.subtitulo || ""}
                  placeholder="ej. Esmalte sintético y acrílico sobre muro de 6x3m"
                  className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-stone-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-stone-900 block mb-1">Descripción</label>
                <textarea
                  name="descripcion"
                  rows={3}
                  defaultValue={modalObra.descripcion || ""}
                  placeholder="Detalles sobre el encargo, concepto y proceso..."
                  className="w-full rounded-xl border border-stone-300 bg-white p-3 text-stone-900 focus:outline-none"
                />
              </div>

              {/* Subida Múltiple de Fotos del Proyecto */}
              <div>
                <label className="font-bold text-stone-900 block mb-1">Fotos del Proyecto</label>
                <FileImageUpload
                  value={fotosObra}
                  onChange={setFotosObra}
                  multiple
                  folder="obras"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="destacadoHome"
                  name="destacadoHome"
                  value="true"
                  defaultChecked={modalObra.destacado_home ?? true}
                  className="h-4 w-4 rounded border-stone-300 text-chocolate focus:ring-chocolate"
                />
                <label htmlFor="destacadoHome" className="font-bold text-chocolate cursor-pointer">
                  Destacar este proyecto en la Portada / Home
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-border/50">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalObra(null)}
                  className="rounded-xl text-xs min-h-9 py-1 px-3"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-chocolate text-crema-cruda hover:bg-chocolate/90 rounded-xl text-xs font-bold min-h-9 py-1 px-4 shadow-xs"
                >
                  {isPending ? "Guardando..." : "Guardar Proyecto"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL CONFIRMACIÓN ELIMINAR OBRA ─── */}
      {confirmDeleteObra && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-serif font-bold text-stone-950 flex items-center gap-2">
              <span className="text-red-600">🗑️</span>
              <span>Eliminar Proyecto</span>
            </h3>
            <p className="text-xs text-stone-700 leading-relaxed">
              ¿Estás segura de eliminar permanentemente la obra <strong>&ldquo;{confirmDeleteObra.titulo}&rdquo;</strong>?
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
              <Button
                variant="outline"
                onClick={() => setConfirmDeleteObra(null)}
                className="rounded-xl text-xs min-h-9 py-1 px-3"
              >
                Cancelar
              </Button>
              <Button
                disabled={isPending}
                onClick={() => handleEliminarConfirmado(confirmDeleteObra.id)}
                className="bg-red-600 text-white hover:bg-red-700 rounded-xl text-xs font-bold min-h-9 py-1 px-4 shadow-xs"
              >
                {isPending ? "Eliminando..." : "Eliminar Definitivamente"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
