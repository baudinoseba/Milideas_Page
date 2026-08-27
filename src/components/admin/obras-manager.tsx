"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { FileImageUpload } from "@/components/admin/file-image-upload";
import { saveObraProyectoAction, deleteObraProyectoAction } from "@/lib/actions";
import type { ObraProyecto } from "@/types";

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
        window.location.reload();
      } else {
        alert(res.error || "Error al guardar obra");
      }
    });
  };

  const handleEliminar = (id: string, titulo: string) => {
    if (!confirm(`¿Eliminar la obra "${titulo}"?`)) return;
    startTransition(async () => {
      const res = await deleteObraProyectoAction(id);
      if (res.success) {
        setObras((prev) => prev.filter((o) => o.id !== id));
      } else {
        alert(res.error || "Error al eliminar");
      }
    });
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Botón Volver & Header */}
      <div className="border-b border-border/60 pb-4 space-y-3">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-chocolate font-sans"
        >
          <span>← Volver al Dashboard</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-3xl sm:text-4xl">🌟</span>
            <div>
              <h1 className="text-xl sm:text-2xl font-serif font-semibold text-chocolate">
                Obras & Proyectos Especiales
              </h1>
              <p className="text-xs text-muted font-sans">
                Murales, vidrieras, esculturas de mascotas y propuestas a medida para marcas y gastronomía.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => abrirModal()}
            className="rounded-full bg-chocolate text-crema-cruda hover:bg-chocolate/90 px-4 py-2 text-xs font-semibold shadow-xs cursor-pointer self-start sm:self-auto"
          >
            + Nuevo Proyecto
          </button>
        </div>
      </div>

      {/* Filtros por Categoría */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setFiltroCategoria("todas")}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium font-sans transition-colors shrink-0 cursor-pointer shadow-2xs",
            filtroCategoria === "todas"
              ? "bg-chocolate text-crema-cruda font-semibold"
              : "bg-surface text-muted border border-border/60 hover:bg-secondary/40",
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
              "rounded-full px-3 py-1 text-xs font-medium font-sans transition-colors shrink-0 cursor-pointer shadow-2xs flex items-center gap-1",
              filtroCategoria === cat.id
                ? "bg-chocolate text-crema-cruda font-semibold"
                : "bg-surface text-muted border border-border/60 hover:bg-secondary/40",
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
              className="rounded-2xl sm:rounded-3xl border border-border/60 bg-surface p-4 shadow-xs flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2.5">
                {/* Miniatura de portada */}
                <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-arena/30 border border-border/40 flex items-center justify-center">
                  {obra.portada_url || fotos[0] ? (
                    <img src={obra.portada_url || fotos[0]} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-3xl">{cat?.emoji || "✨"}</span>
                  )}
                  {obra.destacado_home && (
                    <span className="absolute top-2 right-2 rounded-full bg-terracota text-white px-2 py-0.5 text-[10px] font-semibold shadow-xs">
                      ★ Destacado en Home
                    </span>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between text-[10px] font-semibold text-terracota uppercase tracking-wider">
                    <span>{cat ? `${cat.emoji} ${cat.label}` : "Obra"}</span>
                    {obra.cliente_lugar && <span className="text-muted truncate max-w-[120px]">📍 {obra.cliente_lugar}</span>}
                  </div>
                  <h3 className="text-sm font-serif font-semibold text-chocolate mt-0.5">{obra.titulo}</h3>
                  {obra.subtitulo && <p className="text-xs text-barro font-medium line-clamp-1">{obra.subtitulo}</p>}
                  {obra.descripcion && <p className="text-xs text-muted font-sans line-clamp-2 mt-1">{obra.descripcion}</p>}
                </div>
              </div>

              <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                <span className="text-[11px] text-muted">{fotos.length} fotos</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => abrirModal(obra)}
                    className="rounded-xl border border-border bg-surface px-2.5 py-1 text-xs text-chocolate hover:bg-secondary/40 font-medium cursor-pointer shadow-2xs"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEliminar(obra.id, obra.titulo)}
                    className="text-red-500 hover:text-red-700 p-1 text-xs cursor-pointer"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Crear / Editar Obra */}
      {modalObra && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl border border-border/80 bg-surface p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-base font-serif font-semibold text-chocolate">
                {modalObra.id ? "Editar Obra / Proyecto" : "Nuevo Proyecto"}
              </h3>
              <button
                type="button"
                onClick={() => setModalObra(null)}
                className="h-8 w-8 rounded-full bg-arena/50 text-muted hover:text-foreground cursor-pointer flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarModal} className="space-y-3 text-xs">
              {modalObra.id && <input type="hidden" name="id" value={modalObra.id} />}

              <div>
                <label className="font-semibold text-chocolate block mb-1">Título del Proyecto *</label>
                <input
                  type="text"
                  name="titulo"
                  required
                  defaultValue={modalObra.titulo || ""}
                  placeholder="ej. Mural Botánico en Heladería, Escultura Simón..."
                  className="w-full rounded-xl border border-border/80 bg-surface px-3 py-2 text-foreground"
                />
              </div>

              {/* Selector de Categoría + Botón para Crear Nueva Categoría */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-chocolate">Categoría *</label>
                  <button
                    type="button"
                    onClick={() => setCreandoNuevaCategoria(!creandoNuevaCategoria)}
                    className="text-[11px] font-semibold text-terracota hover:underline cursor-pointer"
                  >
                    {creandoNuevaCategoria ? "← Elegir existente" : "+ Nueva categoría"}
                  </button>
                </div>

                {creandoNuevaCategoria ? (
                  <div className="p-3 bg-arena/30 rounded-2xl border border-terracota/30 space-y-2 animate-in fade-in">
                    <p className="text-[11px] font-semibold text-chocolate">Crear nueva categoría:</p>
                    <div className="flex gap-2">
                      <div className="relative">
                        <select
                          value={nuevaCatEmoji}
                          onChange={(e) => setNuevaCatEmoji(e.target.value)}
                          className="rounded-xl border border-border bg-surface px-2.5 py-1.5 text-sm"
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
                        className="flex-1 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs text-foreground"
                      />
                      <button
                        type="button"
                        onClick={handleAgregarCategoria}
                        className="rounded-xl bg-terracota text-white px-3 py-1.5 font-semibold text-xs cursor-pointer shadow-2xs"
                      >
                        Crear
                      </button>
                    </div>
                  </div>
                ) : (
                  <select
                    name="categoria"
                    defaultValue={modalObra.categoria || categorias[0]?.id}
                    className="w-full rounded-xl border border-border/80 bg-surface px-3 py-2 text-foreground"
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
                <label className="font-semibold text-chocolate block mb-1">Cliente / Lugar</label>
                <input
                  type="text"
                  name="clienteLugar"
                  defaultValue={modalObra.cliente_lugar || ""}
                  placeholder="ej. Sunchales / Rafaela / Heladería Grido..."
                  className="w-full rounded-xl border border-border/80 bg-surface px-3 py-2 text-foreground"
                />
              </div>

              <div>
                <label className="font-semibold text-chocolate block mb-1">Subtítulo / Técnica</label>
                <input
                  type="text"
                  name="subtitulo"
                  defaultValue={modalObra.subtitulo || ""}
                  placeholder="ej. Esmalte sintético y acrílico sobre muro de 6x3m"
                  className="w-full rounded-xl border border-border/80 bg-surface px-3 py-2 text-foreground"
                />
              </div>

              <div>
                <label className="font-semibold text-chocolate block mb-1">Descripción</label>
                <textarea
                  name="descripcion"
                  rows={3}
                  defaultValue={modalObra.descripcion || ""}
                  placeholder="Detalles sobre el encargo, concepto y proceso..."
                  className="w-full rounded-xl border border-border/80 bg-surface p-3 text-foreground"
                />
              </div>

              {/* Subida Múltiple de Fotos del Proyecto */}
              <FileImageUpload
                value={fotosObra}
                onChange={setFotosObra}
                multiple
                folder="obras"
                label="Fotos del Proyecto (Subir desde tus archivos o celular)"
              />

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="destacadoHome"
                  name="destacadoHome"
                  value="true"
                  defaultChecked={modalObra.destacado_home ?? true}
                  className="accent-terracota rounded"
                />
                <label htmlFor="destacadoHome" className="font-semibold text-chocolate cursor-pointer">
                  Destacar este proyecto en la Portada / Home
                </label>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 rounded-full bg-chocolate text-crema-cruda py-2.5 font-semibold hover:bg-chocolate/90 cursor-pointer"
                >
                  {isPending ? "Guardando..." : "Guardar Proyecto"}
                </button>
                <button
                  type="button"
                  onClick={() => setModalObra(null)}
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
