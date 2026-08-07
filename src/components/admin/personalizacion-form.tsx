"use client";

import { useState, useTransition, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { OptimizedImage } from "@/components/ui/optimized-image";
import {
  saveConfiguracionSitioAction,
  uploadLogoAction,
  uploadHeroImageAction,
} from "@/lib/actions";
import type { Categoria, ConfiguracionSitio } from "@/types";

interface PersonalizacionFormProps {
  config: ConfiguracionSitio;
  categorias: Categoria[];
  producciones?: Array<{ id: string; nombre: string }>;
}

export function PersonalizacionForm({ config, categorias, producciones = [] }: PersonalizacionFormProps) {
  const [pending, startTransition] = useTransition();
  const [logoUrl, setLogoUrl] = useState(config.logo_url);
  const [heroImageUrl, setHeroImageUrl] = useState(config.hero_imagen_url);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Interactive Image Customizer state
  const [imageFit, setImageFit] = useState<"cover" | "contain">("cover");
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [posY, setPosY] = useState<number>(50);
  const [posX, setPosX] = useState<number>(50);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);


  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.set("logo", file);
      const res = await uploadLogoAction(formData);
      if (res.success && res.url) {
        setLogoUrl(res.url);
        setMessage({ type: "success", text: "Logo actualizado correctamente" });
      } else {
        setMessage({ type: "error", text: res.error ?? "Error al subir el logo" });
      }
    });
  };

  const handleHeroImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.set("heroImage", file);
      const res = await uploadHeroImageAction(formData);
      if (res.success && res.url) {
        setHeroImageUrl(res.url);
        setMessage({ type: "success", text: "Fondo de portada actualizado correctamente" });
      } else {
        setMessage({ type: "error", text: res.error ?? "Error al subir la portada" });
      }
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await saveConfiguracionSitioAction(formData);
      if (res.success) {
        setMessage({ type: "success", text: "Personalización guardada con éxito. ¡Cambios en vivo en la tienda!" });
      } else {
        setMessage({ type: "error", text: res.error ?? "Error al guardar la personalización" });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
      {message && (
        <div
          className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 text-sm font-medium shadow-sm ${
            message.type === "success"
              ? "border-[#2d6a4f]/30 bg-white text-[#1b4332]"
              : "border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400"
          }`}
        >
          {message.type === "success" && (
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#d8f3dc] text-[#1b4332] font-bold text-xs">
              ✓
            </span>
          )}
          <span>{message.text}</span>
        </div>
      )}


      {/* 🖼️ LOGO DE LA TIENDA */}
      <section className="space-y-4 rounded-xl border border-border bg-surface p-6">
        <h2 className="text-base font-semibold">🖼️ Logo de la Página</h2>
        <p className="text-xs text-muted">
          Subí el logo oficial de la marca. Si no subís ninguno, se usará el nombre tipográfico predeterminado.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-20 w-44 items-center justify-center overflow-hidden rounded-xl border border-border bg-background p-2">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
            ) : (
              <span className="font-serif text-lg font-bold tracking-tight text-foreground">
                MILIDEAS
              </span>
            )}
          </div>

          <div className="space-y-2">
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => logoInputRef.current?.click()}
              isLoading={pending}
            >
              📷 Subir / Cambiar Logo
            </Button>
            <p className="text-[11px] text-muted">Recomendado: PNG o SVG transparente</p>
          </div>
        </div>
      </section>

      {/* 🎨 HERO BANNER & TEXTOS DE LA PORTADA */}
      <section className="space-y-4 rounded-xl border border-border bg-surface p-6">
        <h2 className="text-base font-semibold">🎨 Banner Principal y Textos de Portada</h2>
        <p className="text-xs text-muted">
          Personalizá la imagen de fondo, el título y subtítulo principal que verán los clientes al ingresar.
        </p>

        {/* Imagen de fondo / portada */}
        <div className="space-y-2">
          <Label>Imagen de Fondo de Portada (Hero Banner)</Label>
          <div className="relative aspect-[21/9] w-full overflow-hidden rounded-xl border border-border bg-background">
            {heroImageUrl ? (
              <OptimizedImage
                src={heroImageUrl}
                alt="Fondo de Portada"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted">
                (Fondo por defecto de la tienda)
              </div>
            )}
          </div>

          <input
            ref={heroInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleHeroImageUpload}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => heroInputRef.current?.click()}
            isLoading={pending}
          >
            🖼️ Subir / Cambiar Fondo de Portada
          </Button>
        </div>


        {/* Textos */}
        <div className="space-y-4 pt-2">
          <div>
            <Label htmlFor="heroTitulo">Título Principal de la Portada</Label>
            <Input
              id="heroTitulo"
              name="heroTitulo"
              defaultValue={config.hero_titulo}
              placeholder="Ej: Piezas únicas, hechas a mano."
              required
            />
          </div>

          <div>
            <Label htmlFor="heroSubtitulo">Subtítulo / Bajada</Label>
            <Textarea
              id="heroSubtitulo"
              name="heroSubtitulo"
              defaultValue={config.hero_subtitulo}
              placeholder="Descripción breve de tu marca o lanzamiento..."
              rows={3}
            />
          </div>
        </div>
      </section>

      {/* 📐 PERSONALIZACIÓN DE ENCUADRE, TAMAÑO Y POSICIÓN DE IMÁGENES */}
      <section className="space-y-6 rounded-xl border border-border bg-surface p-6">
        <div>
          <h2 className="text-base font-semibold">📐 Personalizador de Encuadre, Zoom y Posición de Fotos</h2>
          <p className="text-xs text-muted mt-0.5">
            Ajustá cómo querés que se muestren las fotos en los contenedores con bordes redondeados. Podés agrandar, achicar, centrar o alinear la imagen según tu preferencia.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-12 md:items-start">
          {/* Controls Panel */}
          <div className="space-y-5 md:col-span-6">
            {/* Mode selection */}
            <div>
              <Label className="text-xs font-semibold">Modo de Cobertura</Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setImageFit("cover")}
                  className={`rounded-lg border px-3 py-2.5 text-xs font-medium transition-all ${
                    imageFit === "cover"
                      ? "border-terracota bg-terracota/10 text-terracota font-semibold shadow-xs"
                      : "border-border bg-background text-muted hover:border-terracota/40"
                  }`}
                >
                  ✨ Rellenar todo el contenedor (Sin bordes vacíos)
                </button>
                <button
                  type="button"
                  onClick={() => setImageFit("contain")}
                  className={`rounded-lg border px-3 py-2.5 text-xs font-medium transition-all ${
                    imageFit === "contain"
                      ? "border-terracota bg-terracota/10 text-terracota font-semibold shadow-xs"
                      : "border-border bg-background text-muted hover:border-terracota/40"
                  }`}
                >
                  🖼️ Enmarcar pieza entera (Con márgenes)
                </button>
              </div>
            </div>

            {/* Quick alignment buttons */}
            <div>
              <Label className="text-xs font-semibold">Alineación / Centrado Rápido</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setPosY(20); setPosX(50); }}
                  className="px-3 py-1 text-xs"
                >
                  ⬆️ Arriba
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setPosY(50); setPosX(50); }}
                  className="px-3 py-1 text-xs font-semibold text-terracota border-terracota/40"
                >
                  🎯 Centrado Perfecto
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setPosY(80); setPosX(50); }}
                  className="px-3 py-1 text-xs"
                >
                  ⬇️ Abajo
                </Button>
              </div>
            </div>

            {/* Sliders */}
            <div className="space-y-4 pt-1">
              <div>
                <div className="flex items-center justify-between text-xs font-medium mb-1">
                  <span>🔍 Zoom / Tamaño de Imagen:</span>
                  <span className="text-terracota font-semibold">{zoomLevel}%</span>
                </div>
                <input
                  type="range"
                  min="70"
                  max="150"
                  value={zoomLevel}
                  onChange={(e) => setZoomLevel(Number(e.target.value))}
                  className="w-full accent-terracota cursor-pointer h-2 bg-background rounded-lg border border-border"
                />
                <div className="flex justify-between text-[10px] text-muted mt-1">
                  <span>70% (Achicada)</span>
                  <span>100% (Normal)</span>
                  <span>150% (Agrandada)</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-medium mb-1">
                  <span>↕️ Posición Vertical (Eje Y):</span>
                  <span className="text-terracota font-semibold">{posY}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={posY}
                  onChange={(e) => setPosY(Number(e.target.value))}
                  className="w-full accent-terracota cursor-pointer h-2 bg-background rounded-lg border border-border"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-medium mb-1">
                  <span>↔️ Posición Horizontal (Eje X):</span>
                  <span className="text-terracota font-semibold">{posX}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={posX}
                  onChange={(e) => setPosX(Number(e.target.value))}
                  className="w-full accent-terracota cursor-pointer h-2 bg-background rounded-lg border border-border"
                />
              </div>
            </div>
          </div>

          {/* Interactive Live Preview Box */}
          <div className="space-y-3 md:col-span-6">
            <Label className="text-xs font-semibold">👁️ Vista Previa Interactiva en Vivo</Label>
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border-2 border-dashed border-terracota/40 bg-background shadow-md">
              <img
                src={heroImageUrl || "/mili-ferrero.jpg"}
                alt="Vista previa personalizada"
                className="h-full w-full rounded-2xl transition-all duration-150"
                style={{
                  objectFit: imageFit,
                  objectPosition: `${posX}% ${posY}%`,
                  transform: `scale(${zoomLevel / 100})`,
                }}
              />
              <div className="absolute top-3 left-3 rounded-full bg-chocolate/80 backdrop-blur-md px-3 py-1 text-[11px] font-medium text-white shadow-sm">
                Bordado redondeado • {imageFit === "cover" ? "Relleno Completo" : "Enmarcado"}
              </div>
            </div>
            <p className="text-[11px] text-muted text-center font-sans">
              Así es como se adaptará la foto a su contenedor con bordes redondeados en la tienda.
            </p>
          </div>
        </div>
      </section>

      {/* 🌟 COLECCIÓN DESTACADA DE LA HOME */}
      <section className="space-y-4 rounded-xl border border-border bg-surface p-6">
        <h2 className="text-base font-semibold">🌟 Colección Destacada Activa</h2>
        <p className="text-xs text-muted">
          Elegí qué colección se mostrará en el banner principal de la portada. Si elegís "Detección automática", se mostrará siempre la última colección publicada.
        </p>

        <div>
          <Label htmlFor="coleccionDestacadaId">Colección o Lanzamiento a destacar en la Home</Label>
          <Select
            id="coleccionDestacadaId"
            name="coleccionDestacadaId"
            defaultValue={config.coleccion_destacada_id ?? ""}
          >
            <option value="">✨ Automático (Últimas piezas lanzadas)</option>
            {producciones.length > 0 && (
              <optgroup label="🎬 Producciones / Lanzamientos">
                {producciones.map((prod) => (
                  <option key={prod.id} value={prod.id}>
                    {prod.nombre}
                  </option>
                ))}
              </optgroup>
            )}
            {categorias.length > 0 && (
              <optgroup label="📁 Categorías de producto">
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
                ))}
              </optgroup>
            )}
          </Select>
        </div>

      </section>

      {/* 🏦 DATOS BANCARIOS */}
      <section className="space-y-4 rounded-xl border border-border bg-surface p-6">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <span>🏦 Datos Bancarios de Transferencia</span>
        </h2>
        <p className="text-xs text-muted">
          Configurá los datos de la cuenta bancaria de la artista. Estos datos se envían al comprador y se muestran en la confirmación del pedido.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="bancoTitular">Titular de la Cuenta</Label>
            <Input
              id="bancoTitular"
              name="bancoTitular"
              defaultValue={config.banco_titular ?? "Milagros Anita Ferrero"}
              placeholder="Ej: Milagros Anita Ferrero"
              required
            />
          </div>

          <div>
            <Label htmlFor="bancoCuit">CUIT / CUIL</Label>
            <Input
              id="bancoCuit"
              name="bancoCuit"
              defaultValue={config.banco_cuit ?? "27-43717260-4"}
              placeholder="Ej: 27-43717260-4"
              required
            />
          </div>

          <div>
            <Label htmlFor="bancoNombre">Entidad / Banco</Label>
            <Input
              id="bancoNombre"
              name="bancoNombre"
              defaultValue={config.banco_nombre ?? "Brubank"}
              placeholder="Ej: Brubank / Mercado Pago"
              required
            />
          </div>

          <div>
            <Label htmlFor="bancoAlias">Alias Bancario</Label>
            <Input
              id="bancoAlias"
              name="bancoAlias"
              defaultValue={config.banco_alias ?? "milideasarte"}
              placeholder="Ej: milideasarte"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="bancoCbu">CBU / CVU (Opcional)</Label>
            <Input
              id="bancoCbu"
              name="bancoCbu"
              defaultValue={config.banco_cbu ?? ""}
              placeholder="Ej: 0000003100012345678901"
            />
          </div>
        </div>
      </section>

      {/* 📍 DIRECCIÓN DEL TALLER Y CONTACTO */}
      <section className="space-y-4 rounded-xl border border-border bg-surface p-6">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <span>📍 Dirección del Taller y WhatsApp de Atención</span>
        </h2>
        <p className="text-xs text-muted">
          Ubicación del emprendimiento para la opción "Retiro en Taller" y teléfono oficial de contacto. Podés modificarlo si la artista o el taller se mudan.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="tallerDireccion">Calle y Número del Taller</Label>
            <Input
              id="tallerDireccion"
              name="tallerDireccion"
              defaultValue={config.taller_direccion ?? "Florentino Ameghino 1576"}
              placeholder="Ej: Florentino Ameghino 1576"
              required
            />
          </div>

          <div>
            <Label htmlFor="tallerCiudad">Ciudad / Localidad</Label>
            <Input
              id="tallerCiudad"
              name="tallerCiudad"
              defaultValue={config.taller_ciudad ?? "Sunchales"}
              placeholder="Ej: Sunchales"
              required
            />
          </div>

          <div>
            <Label htmlFor="tallerProvincia">Provincia</Label>
            <Input
              id="tallerProvincia"
              name="tallerProvincia"
              defaultValue={config.taller_provincia ?? "Santa Fe"}
              placeholder="Ej: Santa Fe"
              required
            />
          </div>

          <div>
            <Label htmlFor="tallerCodigoPostal">Código Postal</Label>
            <Input
              id="tallerCodigoPostal"
              name="tallerCodigoPostal"
              defaultValue={config.taller_codigo_postal ?? "2322"}
              placeholder="Ej: 2322"
              required
            />
          </div>

          <div>
            <Label htmlFor="vendedorWhatsapp">WhatsApp Oficial de Atención (con código de país)</Label>
            <Input
              id="vendedorWhatsapp"
              name="vendedorWhatsapp"
              defaultValue={config.vendedor_whatsapp ?? "5493493668308"}
              placeholder="Ej: 5493493668308"
              required
            />
          </div>
        </div>
      </section>

      {/* SUBMIT BUTTON */}
      <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
        <Button type="submit" isLoading={pending}>
          💾 Guardar Personalización
        </Button>
      </div>
    </form>
  );
}
