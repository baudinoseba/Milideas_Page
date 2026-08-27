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
  const [dragging, setDragging] = useState(false);
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

  return (
    <div className="space-y-2">
      {label && <label className="font-semibold text-chocolate block text-xs">{label}</label>}

      {/* Grid de imágenes subidas con botón para eliminar */}
      {imagesList.length > 0 && (
        <div className="flex flex-wrap gap-2.5 pt-1">
          {imagesList.map((url, idx) => (
            <div
              key={idx}
              className="group relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-2xl overflow-hidden border border-border/70 bg-arena/30 shadow-2xs"
            >
              <img src={url} alt={`Imagen ${idx + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => handleRemoveImage(idx)}
                className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black text-[10px] cursor-pointer shadow-xs transition-opacity opacity-80 group-hover:opacity-100"
                title="Eliminar foto"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Dropzone & Botón de Subida */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFilesSelected(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "flex flex-col items-center justify-center gap-1.5 p-4 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center",
          dragging
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
            <span className="text-xs font-semibold text-terracota">Subiendo imagen al taller...</span>
          </div>
        ) : (
          <>
            <span className="text-2xl">📸</span>
            <p className="text-xs font-semibold text-chocolate">
              {multiple ? "Subir fotos desde tus archivos o celular" : "Seleccionar foto del dispositivo"}
            </p>
            <p className="text-[10px] text-muted">Hacé clic aquí o arrastrá tus fotos (JPG, PNG, WEBP)</p>
          </>
        )}
      </div>
    </div>
  );
}
