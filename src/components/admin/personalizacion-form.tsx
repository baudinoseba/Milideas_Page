"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import {
  saveConfiguracionSitioAction,
  uploadLogoAction,
  uploadHeroImageAction,
  uploadLoginImageAction,
  uploadSobreMiFotoAction,
} from "@/lib/actions";
import { toast } from "@/stores/toast-store";
import type { Categoria, ConfiguracionSitio } from "@/types";

interface PersonalizacionFormProps {
  config: ConfiguracionSitio;
  categorias: Categoria[];
  producciones?: Array<{ id: string; nombre: string }>;
}

const DEFAULT_SOBRE_MI_TEXTO = `¡Hola! Soy Mili Ferrero. Desde mi taller en Sunchales, Santa Fe, doy vida a objetos de diseño, cerámica artesanal y obras pictóricas originales.

Cada taza, escultura, mural o dibujo nace de un proceso pausado y respetuoso de los tiempos del material: modelado a mano, secado natural, horneadas a 1080°C y pinceladas llenas de calidez botánica y animal.

Creo en el valor de lo auténtico: piezas que no salen de una máquina, sino de manos dedicadas a transformar tus momentos cotidianos en pequeños rituales de disfrute.`;

export function PersonalizacionForm({
  config,
  categorias,
  producciones = [],
}: PersonalizacionFormProps) {
  const [pending, startTransition] = useTransition();
  const [logoUrl, setLogoUrl] = useState(config.logo_url);
  const [heroImageUrl, setHeroImageUrl] = useState(config.hero_imagen_url);
  const [loginImageUrl, setLoginImageUrl] = useState(config.login_imagen_url || "/login-art.jpg");
  const [sobreMiFotoUrl, setSobreMiFotoUrl] = useState(config.sobre_mi_foto_url || "/mili-ferrero.jpg");

  // Interactive Image Customizer state for Sobre Mí
  const [imageFit, setImageFit] = useState<"cover" | "contain">(
    (config.sobre_mi_foto_fit as "cover" | "contain") || "cover"
  );
  const [zoomLevel, setZoomLevel] = useState<number>(config.sobre_mi_foto_zoom ?? 100);
  const [posY, setPosY] = useState<number>(config.sobre_mi_foto_pos_y ?? 50);
  const [posX, setPosX] = useState<number>(config.sobre_mi_foto_pos_x ?? 50);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);
  const loginInputRef = useRef<HTMLInputElement>(null);
  const sobreMiInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.set("logo", file);
      const res = await uploadLogoAction(formData);
      if (res.success && res.url) {
        setLogoUrl(res.url);
        toast.success("Logo actualizado con éxito");
      } else {
        toast.error(res.error ?? "Error al subir el logo");
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
        toast.success("Fondo de portada actualizado con éxito");
      } else {
        toast.error(res.error ?? "Error al subir la portada");
      }
    });
  };

  const handleLoginImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.set("loginImage", file);
      const res = await uploadLoginImageAction(formData);
      if (res.success && res.url) {
        setLoginImageUrl(res.url);
        toast.success("Ilustración de inicio de sesión actualizada con éxito");
      } else {
        toast.error(res.error ?? "Error al subir la imagen de login");
      }
    });
  };

  const handleSobreMiFotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.set("sobreMiFoto", file);
      const res = await uploadSobreMiFotoAction(formData);
      if (res.success && res.url) {
        setSobreMiFotoUrl(res.url);
        toast.success("Foto de Sobre Mí actualizada con éxito");
      } else {
        toast.error(res.error ?? "Error al subir la foto");
      }
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("sobreMiFotoFit", imageFit);
    formData.set("sobreMiFotoZoom", String(zoomLevel));
    formData.set("sobreMiFotoPosY", String(posY));
    formData.set("sobreMiFotoPosX", String(posX));

    startTransition(async () => {
      const res = await saveConfiguracionSitioAction(formData);
      if (res.success) {
        toast.success("Configuración y textos guardados con éxito");
      } else {
        toast.error(res.error ?? "Error al guardar la configuración");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full relative pb-16">
      {/* ─── GRID DE CONTENEDORES SIMÉTRICOS Y ALINEADOS ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* ─── FILA 1: LOGO (IZQUIERDA) & COLECCIÓN DESTACADA (DERECHA) ─── */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        
        {/* 🖼️ 1. LOGO DE LA TIENDA */}
        <section className="flex flex-col justify-between rounded-3xl border border-[#E5E0D8] bg-[#FAF7F2]/80 p-5 sm:p-6 shadow-2xs h-full space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">🖼️</span>
              <h2 className="text-sm sm:text-base font-serif font-bold text-chocolate">
                Logo de la Página
              </h2>
            </div>
            <p className="text-[11px] text-stone-600">
              Se muestra en la barra de navegación superior de toda la web.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
            <div className="flex h-20 w-44 items-center justify-center overflow-hidden rounded-2xl border-2 border-stone-200 bg-white p-2 shadow-2xs shrink-0">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
              ) : (
                <span className="font-serif text-base font-bold text-stone-700">
                  MILIDEAS
                </span>
              )}
            </div>

            <div className="space-y-1.5 text-center sm:text-left">
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
                className="rounded-xl text-xs bg-white hover:bg-stone-50 border-stone-300 font-semibold cursor-pointer"
              >
                📷 Subir / Cambiar Logo
              </Button>
              <p className="text-[10px] text-stone-500">Recomendado: PNG o SVG transparente</p>
            </div>
          </div>
        </section>

        {/* 🌟 2. COLECCIÓN DESTACADA DE LA HOME */}
        <section className="flex flex-col justify-between rounded-3xl border border-[#E5E0D8] bg-[#FAF7F2]/80 p-5 sm:p-6 shadow-2xs h-full space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">🌟</span>
              <h2 className="text-sm sm:text-base font-serif font-bold text-chocolate">
                Colección Destacada Activa
              </h2>
            </div>
            <p className="text-[11px] text-stone-600">
              Elegí qué colección se mostrará en la sección de stock de la Home.
            </p>
          </div>

          <div className="space-y-1.5 pt-1">
            <Label htmlFor="coleccionDestacadaId" className="text-xs font-semibold text-stone-800">
              Colección a destacar
            </Label>
            <Select
              id="coleccionDestacadaId"
              name="coleccionDestacadaId"
              defaultValue={config.coleccion_destacada_id ?? ""}
              className="rounded-xl text-xs bg-white h-10"
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

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* ─── FILA 2: FONDO DE PORTADA (IZQ) & DATOS BANCARIOS (DER) ─── */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}

        {/* 🎨 3. FONDO DE PORTADA (HERO BANNER) */}
        <section className="flex flex-col justify-between rounded-3xl border border-[#E5E0D8] bg-[#FAF7F2]/80 p-5 sm:p-6 shadow-2xs h-full space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎨</span>
              <h2 className="text-sm sm:text-base font-serif font-bold text-chocolate">
                Fondo de Portada (Hero Banner de la Home)
              </h2>
            </div>
            <p className="text-[11px] text-stone-600">
              Imagen principal que vestirá el contenedor de bienvenida de la tienda.
            </p>
          </div>

          <div className="space-y-3">
            <div className="relative aspect-[21/9] w-full overflow-hidden rounded-2xl border-2 border-stone-200 bg-white shadow-2xs">
              {heroImageUrl ? (
                <img
                  src={heroImageUrl}
                  alt="Fondo de Portada"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-stone-500 font-medium bg-[#FAF7F2]">
                  (Fondo por defecto del taller)
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3">
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
                className="rounded-xl text-xs bg-white hover:bg-stone-50 border-stone-300 font-semibold cursor-pointer"
              >
                🖼️ Subir / Cambiar Portada
              </Button>
              <span className="text-[11px] text-stone-500">
                Recomendado: 1920x800 px
              </span>
            </div>
          </div>
        </section>

        {/* 🏦 4. DATOS BANCARIOS DE TRANSFERENCIA */}
        <section className="flex flex-col justify-between rounded-3xl border border-[#E5E0D8] bg-[#FAF7F2]/80 p-5 sm:p-6 shadow-2xs h-full space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏦</span>
              <h2 className="text-sm sm:text-base font-serif font-bold text-chocolate">
                Datos Bancarios de Transferencia
              </h2>
            </div>
            <p className="text-[11px] text-stone-600">
              Se muestran al comprador al confirmar su compra o encargo.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="bancoTitular" className="text-xs font-semibold text-stone-800">
                Titular de la Cuenta
              </Label>
              <Input
                id="bancoTitular"
                name="bancoTitular"
                defaultValue={config.banco_titular ?? "Milagros Anita Ferrero"}
                placeholder="Milagros Anita Ferrero"
                className="rounded-xl text-xs bg-white mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="bancoCuit" className="text-xs font-semibold text-stone-800">
                CUIT / CUIL
              </Label>
              <Input
                id="bancoCuit"
                name="bancoCuit"
                defaultValue={config.banco_cuit ?? "27-43717260-4"}
                placeholder="27-43717260-4"
                className="rounded-xl text-xs bg-white mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="bancoNombre" className="text-xs font-semibold text-stone-800">
                Entidad / Banco
              </Label>
              <Input
                id="bancoNombre"
                name="bancoNombre"
                defaultValue={config.banco_nombre ?? "Brubank"}
                placeholder="Brubank / Mercado Pago"
                className="rounded-xl text-xs bg-white mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="bancoAlias" className="text-xs font-semibold text-stone-800">
                Alias Bancario
              </Label>
              <Input
                id="bancoAlias"
                name="bancoAlias"
                defaultValue={config.banco_alias ?? "milideasarte"}
                placeholder="milideasarte"
                className="rounded-xl text-xs bg-white mt-1"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="bancoCbu" className="text-xs font-semibold text-stone-800">
                CBU / CVU (Opcional)
              </Label>
              <Input
                id="bancoCbu"
                name="bancoCbu"
                defaultValue={config.banco_cbu ?? ""}
                placeholder="0000003100012345678901"
                className="rounded-xl text-xs bg-white mt-1"
              />
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* ─── FILA 3: DIRECCIÓN DEL TALLER Y WHATSAPP (SPAN COMPLETO O 2 COLS) ─── */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        
        {/* 📍 5. DIRECCIÓN DEL TALLER Y WHATSAPP */}
        <section className="lg:col-span-2 rounded-3xl border border-[#E5E0D8] bg-[#FAF7F2]/80 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">📍</span>
              <h2 className="text-sm sm:text-base font-serif font-bold text-chocolate">
                Dirección del Taller y WhatsApp de Atención
              </h2>
            </div>
            <p className="text-[11px] text-stone-600">
              Ubicación para retiros presenciales y número oficial de contacto con los clientes.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="sm:col-span-2">
              <Label htmlFor="tallerDireccion" className="text-xs font-semibold text-stone-800">
                Calle y Número del Taller
              </Label>
              <Input
                id="tallerDireccion"
                name="tallerDireccion"
                defaultValue={config.taller_direccion ?? "Florentino Ameghino 1576"}
                placeholder="Florentino Ameghino 1576"
                className="rounded-xl text-xs bg-white mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="tallerCiudad" className="text-xs font-semibold text-stone-800">
                Ciudad / Localidad
              </Label>
              <Input
                id="tallerCiudad"
                name="tallerCiudad"
                defaultValue={config.taller_ciudad ?? "Sunchales"}
                placeholder="Sunchales"
                className="rounded-xl text-xs bg-white mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="tallerProvincia" className="text-xs font-semibold text-stone-800">
                Provincia
              </Label>
              <Input
                id="tallerProvincia"
                name="tallerProvincia"
                defaultValue={config.taller_provincia ?? "Santa Fe"}
                placeholder="Santa Fe"
                className="rounded-xl text-xs bg-white mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="tallerCodigoPostal" className="text-xs font-semibold text-stone-800">
                Código Postal
              </Label>
              <Input
                id="tallerCodigoPostal"
                name="tallerCodigoPostal"
                defaultValue={config.taller_codigo_postal ?? "2322"}
                placeholder="2322"
                className="rounded-xl text-xs bg-white mt-1"
                required
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-5">
              <Label htmlFor="vendedorWhatsapp" className="text-xs font-semibold text-stone-800">
                WhatsApp Oficial de Atención (con código de país ej: 5493493664420)
              </Label>
              <Input
                id="vendedorWhatsapp"
                name="vendedorWhatsapp"
                defaultValue={config.vendedor_whatsapp ?? "5493493664420"}
                placeholder="5493493664420"
                className="rounded-xl text-xs bg-white mt-1"
                required
              />
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* ─── FILA 4: SECCIÓN SOBRE MÍ (SPAN COMPLETO CON 2 SUBCOLUMNAS) ─── */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        
        {/* 🙋‍♀️ 6. PERSONALIZACIÓN DE SOBRE MÍ */}
        <section className="lg:col-span-2 rounded-3xl border border-[#E5E0D8] bg-[#FAF7F2]/80 p-5 sm:p-6 shadow-2xs space-y-5">
          <div className="space-y-1 border-b border-[#E5E0D8] pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🙋‍♀️</span>
              <h2 className="text-sm sm:text-base font-serif font-bold text-chocolate">
                Sección &ldquo;Sobre Mí&rdquo; (Historia, Foto y Encuadre)
              </h2>
            </div>
            <p className="text-[11px] text-stone-600">
              Personalizá la foto de la artista, su encuadre y los textos que se ven en /sobre-mi.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Subcolumna Izquierda: Foto y Controles de Encuadre */}
            <div className="lg:col-span-5 space-y-4 flex flex-col items-center sm:items-stretch">
              <div className="flex flex-col items-center">
                <div className="relative aspect-[3/4] w-full max-w-[210px] overflow-hidden rounded-2xl border-2 border-stone-300 bg-white shadow-md">
                  <img
                    src={sobreMiFotoUrl}
                    alt="Sobre Mí"
                    className="h-full w-full rounded-2xl transition-all duration-150"
                    style={{
                      objectFit: imageFit,
                      objectPosition: `${posX}% ${posY}%`,
                      transform: `scale(${zoomLevel / 100})`,
                    }}
                  />
                </div>
                <input
                  ref={sobreMiInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleSobreMiFotoUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => sobreMiInputRef.current?.click()}
                  isLoading={pending}
                  className="mt-2.5 rounded-xl text-xs bg-white font-semibold border-stone-300 w-full max-w-[210px] cursor-pointer"
                >
                  📷 Cambiar Foto
                </Button>
              </div>

              {/* Controles de Zoom y Posición */}
              <div className="space-y-3.5 pt-2 w-full">
                <div>
                  <Label className="text-xs font-bold text-stone-800">Modo de Cobertura</Label>
                  <div className="mt-1.5 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setImageFit("cover")}
                      className={`rounded-xl border p-2 text-[11px] font-semibold transition-all cursor-pointer ${
                        imageFit === "cover"
                          ? "border-chocolate bg-chocolate text-crema-cruda shadow-xs"
                          : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
                      }`}
                    >
                      ✨ Rellenar todo
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageFit("contain")}
                      className={`rounded-xl border p-2 text-[11px] font-semibold transition-all cursor-pointer ${
                        imageFit === "contain"
                          ? "border-chocolate bg-chocolate text-crema-cruda shadow-xs"
                          : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
                      }`}
                    >
                      🖼️ Enmarcar
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-stone-800 mb-1">
                    <span>🔍 Zoom:</span>
                    <span className="text-chocolate font-bold">{zoomLevel}%</span>
                  </div>
                  <input
                    type="range"
                    min="70"
                    max="150"
                    value={zoomLevel}
                    onChange={(e) => setZoomLevel(Number(e.target.value))}
                    className="w-full accent-chocolate cursor-pointer h-2 bg-stone-200 rounded-lg"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-stone-800 mb-1">
                    <span>↕️ Posición Vertical:</span>
                    <span className="text-chocolate font-bold">{posY}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={posY}
                    onChange={(e) => setPosY(Number(e.target.value))}
                    className="w-full accent-chocolate cursor-pointer h-2 bg-stone-200 rounded-lg"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-stone-800 mb-1">
                    <span>↔️ Posición Horizontal:</span>
                    <span className="text-chocolate font-bold">{posX}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={posX}
                    onChange={(e) => setPosX(Number(e.target.value))}
                    className="w-full accent-chocolate cursor-pointer h-2 bg-stone-200 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Subcolumna Derecha: Textos de Sobre Mí */}
            <div className="lg:col-span-7 space-y-3.5">
              <div>
                <Label htmlFor="sobreMiTitulo" className="text-xs font-bold text-stone-800">
                  Nombre / Título de la Artista
                </Label>
                <Input
                  id="sobreMiTitulo"
                  name="sobreMiTitulo"
                  defaultValue={config.sobre_mi_titulo ?? "Mili Ferrero"}
                  placeholder="Mili Ferrero"
                  className="rounded-xl text-xs bg-white font-medium mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="sobreMiFrase" className="text-xs font-bold text-stone-800">
                  Frase / Cita Inspiracional
                </Label>
                <Input
                  id="sobreMiFrase"
                  name="sobreMiFrase"
                  defaultValue={
                    config.sobre_mi_frase ?? "Cada pieza tiene alma propia y provoca una sonrisa."
                  }
                  placeholder="Cada pieza tiene alma propia y provoca una sonrisa."
                  className="rounded-xl text-xs bg-white font-medium mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="sobreMiTexto" className="text-xs font-bold text-stone-800">
                  Historia / Texto Bio (párrafos)
                </Label>
                <Textarea
                  id="sobreMiTexto"
                  name="sobreMiTexto"
                  defaultValue={config.sobre_mi_texto ?? DEFAULT_SOBRE_MI_TEXTO}
                  placeholder="Escribí tu historia artesanal..."
                  rows={7}
                  className="rounded-xl text-xs bg-white font-sans leading-relaxed mt-1"
                  required
                />
              </div>
            </div>
          </div>
        </section>

        {/* 🎨 7. ILUSTRACIÓN DE INICIO DE SESIÓN (LOGIN & AUTH) */}
        <section className="lg:col-span-2 flex flex-col justify-between rounded-3xl border border-[#E5E0D8] bg-[#FAF7F2]/80 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎨</span>
              <h2 className="text-sm sm:text-base font-serif font-bold text-chocolate">
                Ilustración de Inicio de Sesión & Cuentas (Login, Registro y Recuperación)
              </h2>
            </div>
            <p className="text-[11px] text-stone-600">
              Esta ilustración acompaña a la derecha en la versión de escritorio de las páginas de Login, Registro y Recuperar Contraseña. En móviles se adapta con estética limpia.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-12 items-center">
            <div className="lg:col-span-4 flex justify-center">
              <div className="relative aspect-[3/4] w-44 sm:w-48 overflow-hidden rounded-2xl border-2 border-stone-200 bg-white shadow-md">
                <img
                  src={loginImageUrl}
                  alt="Ilustración de Login"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            <div className="lg:col-span-8 space-y-3">
              <p className="text-xs text-stone-700 leading-relaxed">
                Podés subir una ilustración propia de Milideas (como la chica en el taller con el gato, tazas o cerámica de autor) con paleta pastel y cálida.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <input
                  ref={loginInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLoginImageUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => loginInputRef.current?.click()}
                  isLoading={pending}
                  className="rounded-xl text-xs bg-white hover:bg-stone-50 border-stone-300 font-semibold cursor-pointer"
                >
                  🖼️ Subir / Cambiar Ilustración de Login
                </Button>
                <span className="text-[11px] text-stone-500">
                  Formato vertical recomendado (ej. 3:4 o 4:5 en JPG, PNG o WEBP)
                </span>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* ─── BOTÓN FLOTANTE ÚNICO: "GUARDAR" (SIN CONTENEDOR BLANCO GRANDE) ─── */}
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          type="submit"
          isLoading={pending}
          className="rounded-full bg-chocolate text-crema-cruda hover:bg-chocolate/90 px-7 py-3 text-sm font-bold shadow-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2 border border-white/20 backdrop-blur-md"
        >
          <span>💾</span>
          <span>Guardar</span>
        </Button>
      </div>
    </form>
  );
}
