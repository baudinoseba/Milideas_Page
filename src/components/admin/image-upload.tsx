"use client";

import { useRef, useState, useTransition } from "react";
import { uploadProductoImageAction, deleteProductoImageAction } from "@/lib/actions";
import type { ProductoImagen } from "@/types";

export function ImageUpload({
  productoId,
  imagenes,
}: {
  productoId: string;
  imagenes: ProductoImagen[];
}) {
  const [dragging, setDragging] = useState(false);
  const [uploading, startUpload] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [localImages, setLocalImages] = useState<ProductoImagen[]>(imagenes);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file) return;

    startUpload(async () => {
      const formData = new FormData();
      formData.set("image", file);
      const result = await uploadProductoImageAction(productoId, formData);
      if (result.success && result.url) {
        setLocalImages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            producto_id: productoId,
            url_imagen: result.url!,
            orden: prev.length,
          },
        ]);
      }
    });
  };

  const handleDelete = (imageId: string) => {
    if (!confirm("¿Eliminar esta imagen?")) return;
    setDeletingId(imageId);
    deleteProductoImageAction(imageId, productoId).then((result) => {
      if (result.success) {
        setLocalImages((prev) => prev.filter((img) => img.id !== imageId));
      }
      setDeletingId(null);
    });
  };

  return (
    <div className="space-y-4">
      <label className="text-sm font-medium">Fotos del producto</label>

      {/* Image grid */}
      {localImages.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {localImages.map((img) => (
            <div
              key={img.id}
              className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-surface"
            >
              <img
                src={img.url_imagen}
                alt="Foto del producto"
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleDelete(img.id)}
                disabled={deletingId === img.id}
                className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80 text-xs"
                title="Eliminar"
              >
                {deletingId === img.id ? "…" : "✕"}
              </button>
              {img.orden === 0 && (
                <span className="absolute bottom-1.5 left-1.5 rounded bg-admin-accent px-1.5 py-0.5 text-[10px] font-bold text-white">
                  Principal
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      <div
        className={`admin-dropzone ${dragging ? "dragging" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleUpload(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
        {uploading ? (
          <div className="space-y-2">
            <p className="text-sm text-muted">Subiendo imagen...</p>
            <div className="mx-auto h-1 w-32 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-admin-accent animate-pulse"
                style={{ width: "60%" }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-2xl">📷</p>
            <p className="text-sm font-medium">
              Arrastrá una imagen acá o hacé click para seleccionar
            </p>
            <p className="text-xs text-muted">
              JPG, PNG o WebP. Máximo 5 fotos por producto.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
