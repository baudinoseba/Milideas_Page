"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatPrecio } from "@/lib/pricing";
import {
  createCategoriaInlineAction,
  deleteCategoriaAction,
  deleteProductoAction,
} from "@/lib/actions";
import type { Categoria, Producto, ProductoImagen } from "@/types";

type ProductoConCategoria = Producto & {
  categorias: { nombre: string } | null;
  producto_imagenes: ProductoImagen[];
};

interface ProductosManagerProps {
  initialProductos: ProductoConCategoria[];
  initialCategorias: Categoria[];
}

export function ProductosManager({
  initialProductos,
  initialCategorias,
}: ProductosManagerProps) {
  const [activeTab, setActiveTab] = useState<"productos" | "categorias">("productos");
  const [productos, setProductos] = useState(initialProductos);
  const [categorias, setCategorias] = useState(initialCategorias);
  const [selectedCategoriaFilter, setSelectedCategoriaFilter] = useState<string>("todas");

  // New category inline state
  const [showNuevaCategoria, setShowNuevaCategoria] = useState(false);
  const [nuevaCategoriaNombre, setNuevaCategoriaNombre] = useState("");
  const [pending, startTransition] = useTransition();

  const handleCreateCategoria = () => {
    if (!nuevaCategoriaNombre.trim()) return;
    startTransition(async () => {
      const res = await createCategoriaInlineAction(nuevaCategoriaNombre.trim());
      if (res.success && res.id && res.nombre) {
        setCategorias((prev) => [
          ...prev,
          { id: res.id!, nombre: res.nombre!, created_at: new Date().toISOString() },
        ]);
        setNuevaCategoriaNombre("");
        setShowNuevaCategoria(false);
      } else {
        alert(res.error ?? "Error al crear la categoría");
      }
    });
  };

  const handleDeleteCategoria = (categoriaId: string, nombre: string) => {
    if (
      !confirm(
        `¿Estás seguro de eliminar la categoría "${nombre}"?\nNo se borrarán las piezas, pero quedarán sin categoría asignada.`,
      )
    ) {
      return;
    }

    startTransition(async () => {
      const res = await deleteCategoriaAction(categoriaId);
      if (res.success) {
        setCategorias((prev) => prev.filter((c) => c.id !== categoriaId));
      } else {
        alert(res.error ?? "Error al eliminar la categoría");
      }
    });
  };

  const handleDeleteProducto = (e: React.MouseEvent, productoId: string, nombre: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (
      !confirm(
        `¿Estás seguro de que querés eliminar la pieza "${nombre}"?\nSe borrarán permanentemente la pieza y sus fotos.`,
      )
    ) {
      return;
    }

    startTransition(async () => {
      const res = await deleteProductoAction(productoId);
      if (res.success) {
        setProductos((prev) => prev.filter((p) => p.id !== productoId));
      } else {
        alert(res.error ?? "Error al eliminar el producto");
      }
    });
  };

  const filteredProductos =
    selectedCategoriaFilter === "todas"
      ? productos
      : productos.filter((p) => p.categoria_id === selectedCategoriaFilter);

  // Calculate count per category
  const categoryCounts: Record<string, number> = {};
  productos.forEach((p) => {
    if (p.categoria_id) {
      categoryCounts[p.categoria_id] = (categoryCounts[p.categoria_id] ?? 0) + 1;
    }
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar with actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">🏺 Productos y Categorías</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowNuevaCategoria(true)}
          >
            + Nueva Categoría
          </Button>
          <Link href="/admin/productos/nuevo">
            <Button>+ Nueva Pieza</Button>
          </Link>
        </div>
      </div>

      {/* Inline New Category Form */}
      {showNuevaCategoria && (
        <div className="flex items-center gap-3 rounded-xl border border-admin-accent/30 bg-admin-accent/5 p-4">
          <Input
            placeholder="Nombre de la nueva categoría (ej: Tazas, Vasiijas)"
            value={nuevaCategoriaNombre}
            onChange={(e) => setNuevaCategoriaNombre(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleCreateCategoria();
              }
            }}
            autoFocus
            className="max-w-md"
          />
          <Button onClick={handleCreateCategoria} isLoading={pending}>
            Guardar Categoría
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setShowNuevaCategoria(false);
              setNuevaCategoriaNombre("");
            }}
          >
            Cancelar
          </Button>
        </div>
      )}

      {/* Tabs switch */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("productos")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "productos"
              ? "bg-foreground text-background"
              : "text-muted hover:bg-surface hover:text-foreground"
          }`}
        >
          🏺 Piezas ({productos.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("categorias")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "categorias"
              ? "bg-foreground text-background"
              : "text-muted hover:bg-surface hover:text-foreground"
          }`}
        >
          📁 Categorías ({categorias.length})
        </button>
      </div>

      {/* TAB 1: PRODUCTOS */}
      {activeTab === "productos" && (
        <div className="space-y-6">
          {/* Category Filter Pills */}
          {categorias.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted mr-1">
                Filtrar:
              </span>
              <button
                type="button"
                onClick={() => setSelectedCategoriaFilter("todas")}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  selectedCategoriaFilter === "todas"
                    ? "bg-admin-accent text-white"
                    : "bg-surface text-muted hover:bg-border"
                }`}
              >
                Todas ({productos.length})
              </button>
              {categorias.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCategoriaFilter(c.id)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    selectedCategoriaFilter === c.id
                      ? "bg-admin-accent text-white"
                      : "bg-surface text-muted hover:bg-border"
                  }`}
                >
                  {c.nombre} ({categoryCounts[c.id] ?? 0})
                </button>
              ))}
            </div>
          )}

          {filteredProductos.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-border p-12 text-center">
              <p className="text-3xl mb-3">🏺</p>
              <p className="text-lg font-medium">No hay productos en esta selección</p>
              <p className="mt-1 text-sm text-muted mb-6">
                Podés crear una nueva pieza para comenzar a vender.
              </p>
              <Link href="/admin/productos/nuevo">
                <Button>Crear nueva pieza</Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProductos.map((p) => {
                const mainImage = p.producto_imagenes?.sort(
                  (a, b) => a.orden - b.orden,
                )[0];

                return (
                  <div
                    key={p.id}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-surface transition-all hover:border-admin-accent/50 hover:shadow-md"
                  >
                    <div>
                      {/* Image */}
                      <div className="relative aspect-[4/3] overflow-hidden bg-border/30">
                        {mainImage ? (
                          <img
                            src={mainImage.url_imagen}
                            alt={p.nombre}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-3xl text-muted">
                            📷
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleDeleteProducto(e, p.id, p.nombre)}
                          disabled={pending}
                          title="Eliminar producto"
                          className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive text-xs"
                        >
                          🗑️
                        </button>
                      </div>

                      {/* Info */}
                      <div className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-medium leading-tight">{p.nombre}</h3>
                          <span className="shrink-0 text-sm font-semibold">
                            {formatPrecio(p.precio_base)}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          {!p.activo && <Badge variant="muted">Oculto</Badge>}
                          {p.stock_disponible <= 1 && p.stock_disponible > 0 && (
                            <Badge variant="warning">Último</Badge>
                          )}
                          {p.stock_disponible === 0 && (
                            <Badge variant="muted">Sin stock</Badge>
                          )}
                          {p.categorias?.nombre && (
                            <Badge>{p.categorias.nombre}</Badge>
                          )}
                        </div>

                        <p className="text-xs text-muted">
                          Stock: {p.stock_disponible} · {p.producto_imagenes?.length ?? 0} foto
                          {(p.producto_imagenes?.length ?? 0) !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between border-t border-border px-4 py-3 bg-surface/50">
                      <Link
                        href={`/admin/productos/${p.id}`}
                        className="text-xs font-medium text-admin-accent hover:underline"
                      >
                        ✏️ Editar Pieza
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteProducto(e, p.id, p.nombre)}
                        disabled={pending}
                        className="text-xs font-medium text-destructive hover:underline"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CATEGORÍAS */}
      {activeTab === "categorias" && (
        <div className="space-y-6">
          {categorias.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-border p-12 text-center">
              <p className="text-3xl mb-3">📁</p>
              <p className="text-lg font-medium">No tenés categorías guardadas</p>
              <p className="mt-1 text-sm text-muted mb-6">
                Creá categorías para organizar mejor tus productos.
              </p>
              <Button onClick={() => setShowNuevaCategoria(true)}>
                + Crear primera categoría
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categorias.map((cat) => {
                const count = categoryCounts[cat.id] ?? 0;
                return (
                  <div
                    key={cat.id}
                    className="flex flex-col justify-between rounded-xl border border-border bg-surface p-5 transition-all hover:border-admin-accent/50 hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-base">{cat.nombre}</h3>
                        <p className="mt-1 text-xs text-muted">
                          {count} pieza{count !== 1 ? "s" : ""} asignada{count !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <span className="rounded-full bg-admin-accent/10 px-2.5 py-0.5 text-xs font-bold text-admin-accent">
                        📁
                      </span>
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                      <Link
                        href={`/admin/categorias/${cat.id}`}
                        className="text-xs font-medium text-admin-accent hover:underline"
                      >
                        ✏️ Editar nombre
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategoria(cat.id, cat.nombre)}
                        disabled={pending}
                        className="text-xs font-medium text-destructive hover:underline"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
