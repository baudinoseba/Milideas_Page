"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { ImageUpload } from "@/components/admin/image-upload";
import { saveProductoAction, createCategoriaInlineAction } from "@/lib/actions";
import type { Categoria, Producto, ProductoImagen } from "@/types";

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
}: {
  categorias: Categoria[];
  producto?: Producto;
  imagenes?: ProductoImagen[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [precioVal, setPrecioVal] = useState<string>(
    producto?.precio_base != null ? String(producto.precio_base) : ""
  );
  const [localCategorias, setLocalCategorias] = useState<Categoria[]>(categorias);
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<string>(
    producto?.categoria_id ?? ""
  );
  const [showNuevaCategoria, setShowNuevaCategoria] = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState("");
  const [creandoCategoria, setCreandoCategoria] = useState(false);

  const handleCreateCategoria = async () => {
    if (!nuevaCategoria.trim()) return;
    setCreandoCategoria(true);
    const res = await createCategoriaInlineAction(nuevaCategoria.trim());
    setCreandoCategoria(false);
    if (res.success && res.id && res.nombre) {
      const newCat: Categoria = {
        id: res.id,
        nombre: res.nombre,
        created_at: new Date().toISOString(),
      };
      setLocalCategorias((prev) => [...prev, newCat]);
      setSelectedCategoriaId(res.id);
      setNuevaCategoria("");
      setShowNuevaCategoria(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await saveProductoAction(formData, producto?.id);
      if (!result.error) router.push("/admin/productos");
    });
  };

  return (
    <div className="max-w-2xl space-y-8">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ─── Section 1: Basic info ─── */}
        <section className="space-y-4">
          <div className="border-b border-border pb-2">
            <h2 className="text-lg font-medium">Información básica</h2>
            <p className="text-xs text-muted">Nombre, descripción y categoría de la pieza</p>
          </div>

          <div>
            <Label htmlFor="nombre">Nombre de la pieza</Label>
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

          <div>
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              name="descripcion"
              defaultValue={producto?.descripcion ?? ""}
              placeholder="Describí la pieza: material, tamaño, cuidados, qué la hace especial..."
              rows={4}
            />
          </div>

          {/* Dimensiones y medidas aproximadas */}
          <div className="rounded-xl border border-border/60 bg-surface/50 p-4 space-y-3">
            <Label className="text-sm font-semibold flex items-center gap-1.5">
              <span>📐</span>
              <span>Medidas Aproximadas (Alto, Ancho, Capacidad)</span>
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="altoCm" className="text-xs text-muted">Alto (cm)</Label>
                <Input
                  id="altoCm"
                  name="altoCm"
                  type="number"
                  step="0.1"
                  defaultValue={producto?.alto_cm ?? ""}
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
                  defaultValue={producto?.ancho_cm ?? ""}
                  placeholder="ej. 15"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="dimensiones" className="text-xs text-muted">Detalle adicional o Capacidad (opcional)</Label>
              <Input
                id="dimensiones"
                name="dimensiones"
                defaultValue={producto?.dimensiones ?? ""}
                placeholder="ej. Capacidad: 350 ml | Incluye posavasos"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="tipoCatalogo">Catálogo Perteneciente</Label>
            <Select
              id="tipoCatalogo"
              name="tipoCatalogo"
              defaultValue={(producto as any)?.tipo_catalogo ?? "ceramica"}
              required
            >
              <option value="ceramica">🏺 Catálogo Cerámica</option>
              <option value="esculturas">🗿 Catálogo Esculturas</option>
              <option value="ilustraciones">🎨 Catálogo Ilustraciones</option>
            </Select>
            <p className="text-[11px] text-muted mt-1">
              Determina en cuál de los 3 catálogos principales de la tienda se exhibirá esta pieza.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label htmlFor="categoriaId">Categoría</Label>
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
                  placeholder="ej. Jarra, Cuenco, Mate..."
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
                <option value="">Sin categoría</option>
                {localCategorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </Select>
            )}
            <p className="mt-1 text-[11px] text-muted">
              Especificá el tipo de pieza (ej. Bandeja, Taza, Cuenco). La colección a la que pertenece se administra desde Producciones.
            </p>
          </div>
        </section>

        {/* ─── Section 2: Pricing & Stock ─── */}
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
                defaultValue={producto?.stock_disponible ?? 0}
                required
                min={0}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-6 pt-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                name="esPersonalizable"
                defaultChecked={producto?.es_personalizable}
                className="h-4 w-4 rounded border-border accent-admin-accent"
              />
              ¿Es personalizable?
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                name="esEntregaInmediata"
                defaultChecked={producto?.es_entrega_inmediata}
                className="h-4 w-4 rounded border-border accent-admin-accent"
              />
              Entrega inmediata
            </label>
          </div>
        </section>

        {/* ─── Section 3: Publication ─── */}
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

        <div className="flex items-center gap-3 border-t border-border pt-6">
          <Button type="submit" isLoading={pending}>
            {producto ? "Guardar cambios" : "Crear pieza"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/admin/productos")}
          >
            Cancelar
          </Button>
        </div>
      </form>

      {/* ─── Section 4: Images (only for existing products) ─── */}
      {producto && (
        <section className="border-t border-border pt-8">
          <div className="mb-4">
            <h2 className="text-lg font-medium">Fotos</h2>
            <p className="text-xs text-muted">
              Subí fotos de la pieza. La primera será la imagen principal.
            </p>
          </div>
          <ImageUpload productoId={producto.id} imagenes={imagenes ?? []} />
        </section>
      )}

      {!producto && (
        <div className="rounded-lg border border-dashed border-border p-6 text-center">
          <p className="text-sm text-muted">
            📷 Podés agregar fotos después de crear la pieza
          </p>
        </div>
      )}
    </div>
  );
}
