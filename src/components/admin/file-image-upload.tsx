"use client";

import { useState, useRef, useTransition } from "react";
import { uploadGenericImageAction } from "@/lib/actions";
import { cn } from "@/lib/utils/cn";

interface FileImageUploadProps {
  value?: string | string[];
  onChange: (value: any) => void;
  multiple?: boolean;
  folder?: string;
  label?: string;
}

export function FileImageUpload({
  value,
  onChange,
  multiple = false,
  folder = "catalogo",
  label = "Fotos / Imágenes",
}: FileImageUploadProps) {
  const [isPending, startTransition] = useTransition();
  const [draggingUpload, setDraggingUpload] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const imagesList: string[] = Array.isArray(value)
    ? value.filter(Boolean)
    : typeof value === "string" && value
      ? [value]
      : [];

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    startTransition(async () => {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file) continue;
        const fd = new FormData();
        fd.set("file", file);
        const res = await uploadGenericImageAction(fd, folder);
        if (res.success && res.url) {
          uploadedUrls.push(res.url);
        } else if (res.error) {
          alert(`Error al subir imagen: ${res.error}`);
        }
      }

      if (uploadedUrls.length > 0) {
        if (multiple) {
          onChange([...imagesList, ...uploadedUrls]);
        } else {
          onChange(uploadedUrls[0] || "");
        }
      }
    });
  };

  const handleRemoveImage = (indexToRemove: number) => {
    if (multiple) {
      const updated = imagesList.filter((_, idx) => idx !== indexToRemove);
      onChange(updated);
    } else {
      onChange("");
    }
  };

  const handleMove = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= imagesList.length) return;
    const updated = [...imagesList];
    const [moved] = updated.splice(fromIndex, 1);
    if (moved) {
      updated.splice(toIndex, 0, moved);
      onChange(updated);
    }
  };

  // Drag & drop sorting handlers
  const handleItemDragStart = (e: React.DragEvent, index: number) => {
    e.stopPropagation();
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleItemDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleItemDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedIndex !== null && draggedIndex !== targetIndex) {
      handleMove(draggedIndex, targetIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleItemDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        {label && <label className="font-bold text-stone-900 block text-xs">{label}</label>}
        {multiple && imagesList.length > 1 && (
          <span className="text-[10px] text-stone-500 font-medium">
            💡 Arrastrá o usá las flechas para ordenar las fotos
          </span>
        )}
      </div>

      {/* Grid de imágenes subidas con reordenamiento interactivo */}
      {imagesList.length > 0 && (
        <div className="flex flex-wrap gap-2.5 pt-1">
          {imagesList.map((url, idx) => (
            <div
              key={url + idx}
              draggable={multiple}
              onDragStart={(e) => handleItemDragStart(e, idx)}
              onDragOver={(e) => handleItemDragOver(e, idx)}
              onDrop={(e) => handleItemDrop(e, idx)}
              onDragEnd={handleItemDragEnd}
              className={cn(
                "group relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 rounded-2xl overflow-hidden border-2 bg-arena/30 shadow-2xs transition-all select-none",
                idx === 0 ? "border-chocolate ring-1 ring-chocolate/40" : "border-border/70",
                draggedIndex === idx && "opacity-40 scale-95 border-dashed border-terracota",
                dragOverIndex === idx && "border-terracota scale-105 shadow-md",
                multiple && "cursor-grab active:cursor-grabbing",
              )}
            >
              <img src={url} alt={`Imagen ${idx + 1}`} className="h-full w-full object-cover pointer-events-none" />

              {/* Badge de Orden / Portada */}
              <span
                className={cn(
                  "absolute top-1 left-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold shadow-xs",
                  idx === 0
                    ? "bg-chocolate text-crema-cruda"
                    : "bg-black/70 text-white backdrop-blur-xs",
                )}
              >
                {idx === 0 ? "★ Portada" : `${idx + 1}°`}
              </span>

              {/* Botón Eliminar */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveImage(idx);
                }}
                className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/75 text-white hover:bg-red-600 text-[10px] cursor-pointer shadow-xs transition-colors"
                title="Eliminar foto"
              >
                ✕
              </button>

              {/* Flechas de orden rápido al pasar el cursor */}
              {multiple && imagesList.length > 1 && (
                <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-xs p-1 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMove(idx, idx - 1);
                    }}
                    className="flex h-5 w-5 items-center justify-center rounded bg-white/20 text-white hover:bg-white/40 disabled:opacity-30 disabled:pointer-events-none text-xs cursor-pointer"
                    title="Mover a la izquierda"
                  >
                    ←
                  </button>
                  <span className="text-[9px] text-white/90 font-mono">#{idx + 1}</span>
                  <button
                    type="button"
                    disabled={idx === imagesList.length - 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMove(idx, idx + 1);
                    }}
                    className="flex h-5 w-5 items-center justify-center rounded bg-white/20 text-white hover:bg-white/40 disabled:opacity-30 disabled:pointer-events-none text-xs cursor-pointer"
                    title="Mover a la derecha"
                  >
                    →
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Dropzone & Botón de Subida */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDraggingUpload(true);
        }}
        onDragLeave={() => setDraggingUpload(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDraggingUpload(false);
          handleFilesSelected(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "flex flex-col items-center justify-center gap-1.5 p-4 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center",
          draggingUpload
            ? "border-terracota bg-terracota/10"
            : "border-border/80 bg-arena/15 hover:bg-arena/30 hover:border-terracota/50",
          isPending && "opacity-60 pointer-events-none",
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          onChange={(e) => handleFilesSelected(e.target.files)}
          className="hidden"
        />

        {isPending ? (
          <div className="flex items-center gap-2 py-1">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-terracota border-t-transparent" />
            <span className="text-xs font-semibold text-terracota">Subiendo imagen...</span>
          </div>
        ) : (
          <>
            <span className="text-xl">📸</span>
            <p className="text-xs font-semibold text-chocolate">
              {multiple ? "+ Subir fotos para la colección" : "Seleccionar foto"}
            </p>
            <p className="text-[10px] text-muted">Hacé clic o arrastrá tus archivos</p>
          </>
        )}
      </div>
    </div>
  );
}
