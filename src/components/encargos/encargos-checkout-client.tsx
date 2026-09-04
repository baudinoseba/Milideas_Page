"use client";

import { useState, useEffect, useTransition, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { formatPrecio } from "@/lib/pricing";
import { calcularTarifaPorProvincia } from "@/lib/shipping";
import { crearEncargoAction } from "@/lib/actions";
import { useCartStore } from "@/stores/cart-store";
import { useEncargosCartStore, ItemEncargoCart } from "@/stores/encargos-cart-store";
import { EncargosSteps } from "@/components/encargos/encargos-steps";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { cleanPhoneNumber } from "@/lib/utils/encargos-whatsapp";
import type { Perfil } from "@/types";

const subscribeEmpty = () => () => {};

const MEDIDAS_DEFAULT = [
  { id: "a4", nombre: "A4 (21 x 30 cm)", recargo: 0 },
  { id: "a3", nombre: "A3 (30 x 42 cm)", recargo: 5000 },
  { id: "large", nombre: "Grand Format (50 x 70 cm)", recargo: 12000 },
];

const PRECIO_MARCO_DEFAULT = 8500;
const PORCENTAJE_RECARGO_DEFAULT = 0.15;

const PROVINCIAS_ARGENTINA = [
  "Buenos Aires",
  "CABA",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán",
];

export function EncargosCheckoutClient({
  perfil,
  userEmail,
}: {
  perfil?: Perfil | null;
  userEmail?: string;
}) {
  const isClient = useSyncExternalStore(
    subscribeEmpty,
    () => true,
    () => false,
  );

  const { items, removeItem, updateQuantity, updateItem, clearCart, getTotalPrice } =
    useEncargosCartStore();

  const stockItems = useCartStore((s) => s.items);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [whatsappUrl, setWhatsappUrl] = useState<string>("");

  // Step 2 Form State (Initialized with profile if provided)
  const [nombreContacto, setNombreContacto] = useState(perfil?.nombre_completo ?? "");
  const [whatsappContacto, setWhatsappContacto] = useState(perfil?.whatsapp ?? "");
  const [emailContacto, setEmailContacto] = useState(userEmail ?? (perfil as any)?.email ?? "");
  const [metodoEntrega, setMetodoEntrega] = useState<"taller" | "domicilio" | "agencia">(
    perfil?.direccion_calle ? "domicilio" : "taller",
  );
  const [provincia, setProvincia] = useState(perfil?.direccion_provincia || "Santa Fe");
  const [ciudad, setCiudad] = useState(perfil?.direccion_ciudad || "");
  const [calle, setCalle] = useState(perfil?.direccion_calle || "");
  const [numero, setNumero] = useState(perfil?.direccion_numero || "");
  const [piso, setPiso] = useState(perfil?.direccion_piso || "");
  const [depto, setDepto] = useState(perfil?.direccion_depto || "");
  const [codigoPostal, setCodigoPostal] = useState(perfil?.direccion_codigo_postal || "");

  // Auto-sync profile on client mount if not passed as SSR prop
  useEffect(() => {
    if (perfil) {
      setNombreContacto(perfil.nombre_completo || "");
      setWhatsappContacto(perfil.whatsapp || "");
      setEmailContacto(userEmail || (perfil as any)?.email || "");
      if (perfil.direccion_provincia) setProvincia(perfil.direccion_provincia);
      if (perfil.direccion_ciudad) setCiudad(perfil.direccion_ciudad);
      if (perfil.direccion_calle) setCalle(perfil.direccion_calle);
      if (perfil.direccion_numero) setNumero(perfil.direccion_numero);
      if (perfil.direccion_piso) setPiso(perfil.direccion_piso);
      if (perfil.direccion_depto) setDepto(perfil.direccion_depto);
      if (perfil.direccion_codigo_postal) setCodigoPostal(perfil.direccion_codigo_postal);
      if (perfil.direccion_calle) setMetodoEntrega("domicilio");
    } else {
      const supabase = createBrowserClient();
      supabase.auth.getUser().then(({ data }) => {
        const user = data?.user;
        if (user) {
          supabase
            .from("perfiles")
            .select("*")
            .eq("id", user.id)
            .single()
            .then(({ data: profileData }: { data: any }) => {
              if (profileData) {
                setNombreContacto((prev: string) => prev || profileData.nombre_completo || "");
                setWhatsappContacto((prev: string) => prev || profileData.whatsapp || "");
                setEmailContacto((prev: string) => prev || user.email || profileData.email || "");
                if (profileData.direccion_provincia) setProvincia(profileData.direccion_provincia);
                if (profileData.direccion_ciudad) setCiudad(profileData.direccion_ciudad);
                if (profileData.direccion_calle) setCalle(profileData.direccion_calle);
                if (profileData.direccion_numero) setNumero(profileData.direccion_numero);
                if (profileData.direccion_piso) setPiso(profileData.direccion_piso);
                if (profileData.direccion_depto) setDepto(profileData.direccion_depto);
                if (profileData.direccion_codigo_postal) setCodigoPostal(profileData.direccion_codigo_postal);
                if (profileData.direccion_calle) setMetodoEntrega("domicilio");
              }
            });
        }
      });
    }
  }, [perfil, userEmail]);

  if (!isClient) return null;

  if (items.length === 0 && step !== 4) {
    return (
      <div className="py-12 text-center space-y-6 max-w-xl mx-auto">
        <EncargosSteps currentStep={1} />
        <div className="rounded-3xl border border-border/80 bg-surface p-10 space-y-4 shadow-sm">
          <span className="text-5xl block">🎨</span>
          <h1 className="text-2xl font-serif font-medium text-chocolate">
            Tu bolsa de encargos está vacía
          </h1>
          <p className="text-xs text-muted leading-relaxed">
            No tenés piezas por encargo seleccionadas en este momento. Explorá el catálogo de cerámica, esculturas e ilustraciones para encargar obras a medida.
          </p>

          {stockItems.length > 0 && (
            <div className="rounded-2xl border border-terracota/30 bg-arena/30 p-4 space-y-2 text-left mt-2">
              <p className="text-xs font-semibold text-chocolate">
                📦 Tenés {stockItems.length} {stockItems.length === 1 ? "pieza" : "piezas"} de entrega inmediata en tu carrito
              </p>
              <Link href="/carrito">
                <Button className="w-full bg-terracota text-white hover:bg-terracota/90 rounded-full text-xs font-semibold py-2">
                  Ir a mi carrito de compra →
                </Button>
              </Link>
            </div>
          )}

          <Link href="/ceramica/catalogo" className="block pt-2">
            <Button variant="outline" className="rounded-full px-6 py-3 border-border text-chocolate text-xs font-semibold cursor-pointer">
              Explorar Catálogo de Autor →
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const totalPiezasPrice = getTotalPrice();
  const tarifaEnvio = calcularTarifaPorProvincia(provincia || ciudad, metodoEntrega);
  const costoEnvio = metodoEntrega === "taller" ? 0 : tarifaEnvio.precio;
  const totalEstimadoFinal = totalPiezasPrice + costoEnvio;

  // Handle live editing of an encargo item
  const handleEditItemFields = (
    item: ItemEncargoCart,
    changes: Partial<{
      medidaSeleccionada: string;
      conMarco: boolean;
      esPersonalizado: boolean;
      detallePersonalizacion: string;
    }>,
  ) => {
    const medidaNombre = changes.medidaSeleccionada ?? item.medidaSeleccionada;
    const conMarcoVal = changes.conMarco ?? item.conMarco;
    const esPersonalizadoVal = changes.esPersonalizado ?? item.esPersonalizado;
    const detalleVal = changes.detallePersonalizacion ?? item.detallePersonalizacion;

    const medidaObj = MEDIDAS_DEFAULT.find((m) => m.nombre === medidaNombre);
    const adicionalMedida = item.tipoCatalogo === "ilustraciones" ? (medidaObj?.recargo ?? 0) : 0;
    const adicionalMarco = (item.tipoCatalogo === "ilustraciones" && conMarcoVal) ? PRECIO_MARCO_DEFAULT : 0;
    const recargoPersonalizado = esPersonalizadoVal
      ? Math.round(item.precioBase * PORCENTAJE_RECARGO_DEFAULT)
      : 0;

    const precioUnitarioFinal =
      item.precioBase + recargoPersonalizado + adicionalMedida + adicionalMarco;

    updateItem(item.id, {
      ...item,
      medidaSeleccionada: item.tipoCatalogo === "ilustraciones" ? medidaNombre : null,
      adicionalMedida,
      conMarco: item.tipoCatalogo === "ilustraciones" && conMarcoVal,
      adicionalMarco,
      esPersonalizado: esPersonalizadoVal,
      detallePersonalizacion: esPersonalizadoVal ? detalleVal : "",
      recargoPersonalizado,
      precioUnitarioFinal,
    });
  };

  const handleStep2Next = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreContacto.trim() || !whatsappContacto.trim()) {
      setErrorMsg("Por favor ingresá tu nombre y número de WhatsApp.");
      return;
    }
    if (metodoEntrega !== "taller" && !ciudad.trim()) {
      setErrorMsg("Por favor ingresá tu ciudad para calcular la agencia o envío.");
      return;
    }
    setErrorMsg(null);
    setStep(3);
  };

  const handleFinalSubmit = () => {
    setErrorMsg(null);
    const formData = new FormData();
    formData.append("nombreContacto", nombreContacto);
    formData.append("whatsappContacto", whatsappContacto);
    formData.append("emailContacto", emailContacto);
    formData.append("metodoEntrega", metodoEntrega);
    formData.append("costoEnvio", String(costoEnvio));
    formData.append("totalEstimado", String(totalEstimadoFinal));
    formData.append("itemsJson", JSON.stringify(items));

    if (metodoEntrega === "domicilio") {
      formData.append("provincia", provincia);
      formData.append("ciudad", ciudad);
      formData.append("calle", calle);
      formData.append("numero", numero);
      if (piso) formData.append("piso", piso);
      if (depto) formData.append("depto", depto);
      formData.append("codigoPostal", codigoPostal);
    } else if (metodoEntrega === "agencia") {
      formData.append("provincia", provincia);
      formData.append("ciudad", ciudad);
    }

    startTransition(async () => {
      const res = await crearEncargoAction(formData);
      if (!res.success) {
        setErrorMsg(res.error || "No se pudo registrar el encargo.");
        return;
      }

      // Build consolidated WhatsApp text
      const itemsFormattedText = items
        .map((it, idx) => {
          const specs = [];
          if (it.medidaSeleccionada) specs.push(`Medida: ${it.medidaSeleccionada}`);
          if (it.conMarco) specs.push("Con marco de madera artesanal");
          if (it.esPersonalizado) {
            specs.push(
              `Personalizado (+15%)${it.detallePersonalizacion ? `: "${it.detallePersonalizacion}"` : ""}`,
            );
          }

          const specsString = specs.length > 0 ? `\n  - ${specs.join("\n  - ")}` : "";
          return `${idx + 1}. *${it.nombre}* (${it.tipoCatalogo.toUpperCase()}) x ${it.cantidad} => ${formatPrecio(it.precioUnitarioFinal * it.cantidad)}${specsString}`;
        })
        .join("\n\n");

      let entregaText = "*Entrega:* Retiro en Taller (Sunchales - Sin cargo)";
      if (metodoEntrega === "domicilio") {
        const fullAddr = `${calle} ${numero}${piso ? `, Piso ${piso}` : ""}${depto ? `, Depto ${depto}` : ""}, ${ciudad}, ${provincia} (CP ${codigoPostal})`;
        entregaText = `*Entrega:* Envío a Domicilio Vía Cargo (${fullAddr}) => +${formatPrecio(costoEnvio)}`;
      } else if (metodoEntrega === "agencia") {
        entregaText = `*Entrega:* Sucursal Vía Cargo (${ciudad}, ${provincia}) => +${formatPrecio(costoEnvio)} (Estimado ${tarifaEnvio.regionNombre})`;
      }

      const isSingle = items.length === 1;
      const title = isSingle
        ? "*MILIDEAS ARTE - SOLICITUD DE ENCARGO*"
        : "*MILIDEAS ARTE - SOLICITUD DE ENCARGOS*";

      const sectionTitle = isSingle
        ? "*PIEZA ENCARGADA (1 ítem):*"
        : `*PIEZAS ENCARGADAS (${items.length} ítems):*`;

      const closingText = isSingle
        ? "¡Hola Mili! Quisiera solicitar este encargo especial. Quedo a la espera de la confirmación y tiempo estimado de producción."
        : "¡Hola Mili! Quisiera solicitar estos encargos especiales. Quedo a la espera de la confirmación y tiempo estimado de producción.";

      const text = `${title}

--------------------------------
${sectionTitle}

${itemsFormattedText}

--------------------------------
Subtotal Piezas: ${formatPrecio(totalPiezasPrice)}
Envío (${metodoEntrega === "taller" ? "Retiro en Taller" : tarifaEnvio.regionNombre}): ${costoEnvio > 0 ? `+${formatPrecio(costoEnvio)}` : "Sin Cargo"}
*TOTAL ESTIMADO:* ${formatPrecio(totalEstimadoFinal)}

--------------------------------
*DATOS DEL CLIENTE:*
*Nombre:* ${nombreContacto}
*WhatsApp:* ${whatsappContacto}
${emailContacto ? `*Email:* ${emailContacto}\n` : ""}${entregaText}

--------------------------------
${closingText}`;

      const rawVendorWhatsapp = process.env.NEXT_PUBLIC_VENDOR_WHATSAPP || "5493493664420";
      const vendorWhatsapp = cleanPhoneNumber(rawVendorWhatsapp) || "5493493664420";
      const waUrl = `https://wa.me/${vendorWhatsapp}?text=${encodeURIComponent(text)}`;

      setWhatsappUrl(waUrl);
      clearCart();
      setStep(4);
      try {
        window.open(waUrl, "_blank");
      } catch (err) {
        console.warn("Popup blocked by browser:", err);
      }
    });
  };

  return (
    <div className="py-6 space-y-8 max-w-5xl mx-auto">
      {/* Header & Steps Bar */}
      <div className="space-y-4">
        <EncargosSteps currentStep={step} />
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between border-b border-border/60 pb-4 gap-2">
          <h1 className="text-3xl font-serif font-medium text-chocolate">
            Solicitud de Piezas por Encargo
          </h1>
          <span className="font-handwritten text-xl text-terracota">
            &ldquo;Cerámica, obras e ilustraciones creadas especialmente para vos&rdquo;
          </span>
        </div>
      </div>

      {/* STEP 1: REVIEW AND EDIT CUSTOMIZATION */}
      {step === 1 && (
        <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-8 space-y-6">
            {stockItems.length > 0 && (
              <Card className="border-terracota/30 bg-arena/30 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">📦</span>
                  <div>
                    <h4 className="font-serif font-semibold text-chocolate text-xs">
                      Tenés {stockItems.length} {stockItems.length === 1 ? "pieza" : "piezas"} de entrega inmediata en tu carrito
                    </h4>
                    <p className="text-[11px] text-barro font-sans">
                      Podés realizar primero tus encargos o ir al checkout de compra directa.
                    </p>
                  </div>
                </div>
                <Link href="/carrito" className="shrink-0">
                  <Button className="bg-terracota text-white hover:bg-terracota/90 rounded-full text-xs font-semibold px-4 py-1.5 cursor-pointer">
                    Ir a Mi Carrito →
                  </Button>
                </Link>
              </Card>
            )}

            <div className="space-y-4">
              {items.map((it) => (
                <Card
                  key={it.id}
                  className="p-5 rounded-2xl border-border/80 bg-surface shadow-xs space-y-4 transition-all hover:border-admin-accent/30"
                >
                  {/* Top: Remove button + Identity */}
                  <div className="flex items-start justify-between gap-3 border-b border-border/40 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-xl overflow-hidden bg-arena/50 border border-border/60 shrink-0 flex items-center justify-center p-1">
                        {it.imagenUrl ? (
                          <Image
                            src={it.imagenUrl}
                            alt={it.nombre}
                            fill
                            className="object-contain rounded-lg p-0.5"
                          />
                        ) : (
                          <span className="text-2xl">🏺</span>
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-admin-accent font-sans">
                          Catálogo de {it.tipoCatalogo}
                        </span>
                        <h3 className="font-serif font-semibold text-chocolate text-base leading-tight">
                          {it.nombre}
                        </h3>
                        <p className="text-xs text-muted font-mono">
                          Precio base: {formatPrecio(it.precioBase)}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(it.id)}
                      className="text-xs text-muted hover:text-red-600 transition-colors p-1"
                      title="Quitar este encargo"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Customization Options */}
                  <div className="space-y-3.5 text-xs">
                    {/* Size Selector for Illustrations */}
                    {it.tipoCatalogo === "ilustraciones" && (
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-chocolate">
                          Tamaño de la Ilustración:
                        </Label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {MEDIDAS_DEFAULT.map((m) => {
                            const isSelected = (it.medidaSeleccionada || "A4 (21 x 30 cm)") === m.nombre;
                            return (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() =>
                                  handleEditItemFields(it, { medidaSeleccionada: m.nombre })
                                }
                                className={`rounded-xl border p-2.5 text-left transition-all ${
                                  isSelected
                                    ? "border-admin-accent bg-admin-accent/10 text-admin-accent font-semibold ring-1 ring-admin-accent/20"
                                    : "border-border bg-surface text-muted hover:border-border/80"
                                }`}
                              >
                                <div className="font-medium text-xs">{m.nombre}</div>
                                <div className="text-[10px] opacity-75">
                                  {m.recargo > 0 ? `+${formatPrecio(m.recargo)}` : "Incluido"}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Frame toggle for Illustrations */}
                    {it.tipoCatalogo === "ilustraciones" && (
                      <label className="flex items-center gap-2.5 rounded-xl border border-border/70 p-3 bg-arena/20 cursor-pointer transition-all hover:bg-arena/30">
                        <input
                          type="checkbox"
                          checked={it.conMarco || false}
                          onChange={(e) =>
                            handleEditItemFields(it, { conMarco: e.target.checked })
                          }
                          className="h-4 w-4 rounded border-border text-admin-accent focus:ring-admin-accent/30"
                        />
                        <div className="flex-1">
                          <span className="font-medium text-chocolate text-xs block">
                            Enmarcado artesanal en madera de primera calidad con vidrio
                          </span>
                          <span className="text-[11px] text-muted block">
                            Listas para colgar (+{formatPrecio(PRECIO_MARCO_DEFAULT)})
                          </span>
                        </div>
                      </label>
                    )}

                    {/* Custom Engraving / Dedication */}
                    <div className="rounded-xl border border-border/70 p-3 bg-surface space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={it.esPersonalizado || false}
                            onChange={(e) =>
                              handleEditItemFields(it, { esPersonalizado: e.target.checked })
                            }
                            className="h-4 w-4 rounded border-border text-admin-accent focus:ring-admin-accent/30"
                          />
                          <span className="font-medium text-chocolate text-xs">
                            Personalizado a medida (+15%) (te cuento mi idea)
                          </span>
                        </label>
                        {it.esPersonalizado && (
                          <span className="text-[11px] font-semibold text-terracota font-mono">
                            +{formatPrecio(Math.round(it.precioBase * PORCENTAJE_RECARGO_DEFAULT))}
                          </span>
                        )}
                      </div>

                      {it.esPersonalizado && (
                        <div>
                          <Label htmlFor={`detalle-${it.id}`} className="text-[11px] text-muted block mb-1">
                            Detalle exacto del grabado o inscripción
                          </Label>
                          <Textarea
                            id={`detalle-${it.id}`}
                            placeholder="Contanos tu idea: grabado de nombres, iniciales, fechas, dedicatoria o motivo especial a mano..."
                            value={
                              it.detallePersonalizacion === "Personalizado a medida (+15%) (te cuento mi idea)" ||
                              it.detallePersonalizacion === "Colección existente (te paso captura del que me gustó)"
                                ? ""
                                : (it.detallePersonalizacion || "")
                            }
                            onChange={(e) =>
                              handleEditItemFields(it, { detallePersonalizacion: e.target.value })
                            }
                            rows={2}
                            className="bg-surface text-xs"
                          />
                        </div>
                      )}
                    </div>

                    {/* Quantity and Breakdown footer */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-border/40">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted font-medium">Cantidad:</span>
                        <div className="flex items-center rounded-lg border border-border bg-surface px-2 py-0.5">
                          <button
                            type="button"
                            onClick={() => updateQuantity(it.id, it.cantidad - 1)}
                            className="px-2 text-xs font-bold text-chocolate hover:text-admin-accent cursor-pointer"
                          >
                            −
                          </button>
                          <span className="px-2 text-xs font-bold text-chocolate">{it.cantidad}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(it.id, it.cantidad + 1)}
                            className="px-2 text-xs font-bold text-chocolate hover:text-admin-accent cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] text-muted block">Subtotal Encargo</span>
                        <span className="text-base font-bold font-serif text-admin-accent">
                          {formatPrecio(it.precioUnitarioFinal * it.cantidad)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Sidebar Summary Card */}
          <aside className="lg:col-span-4 sticky top-24">
            <Card className="p-6 rounded-2xl border-border/80 bg-surface shadow-piece space-y-5">
              <h3 className="text-lg font-serif font-semibold text-chocolate border-b border-border/60 pb-3">
                Resumen del Encargo
              </h3>

              <div className="space-y-3 text-xs font-sans">
                <div className="flex justify-between text-chocolate">
                  <span className="text-muted">Subtotal Piezas ({items.length}):</span>
                  <span className="font-semibold">{formatPrecio(totalPiezasPrice)}</span>
                </div>

                <div className="flex justify-between text-chocolate">
                  <span className="text-muted">Costo de Envío Estimado:</span>
                  <span className="font-semibold text-chocolate">
                    {metodoEntrega === "taller" ? "Sin Cargo ($0)" : costoEnvio > 0 ? formatPrecio(costoEnvio) : "Se calcula en el paso 2"}
                  </span>
                </div>

                <div className="flex justify-between border-t border-border/60 pt-4 text-base font-bold text-chocolate">
                  <span>TOTAL ESTIMADO</span>
                  <span className="text-xl font-serif text-admin-accent">{formatPrecio(totalEstimadoFinal)}</span>
                </div>
              </div>

              <Button
                onClick={() => setStep(2)}
                className="w-full py-3.5 text-sm font-semibold rounded-full bg-admin-accent text-white hover:bg-admin-accent-hover shadow-md transition-all cursor-pointer"
              >
                Continuar a Tus Datos →
              </Button>

              <p className="text-[11px] text-center text-muted font-sans">
                🎨 Elaboración artesanal con dedicación y paciencia.
              </p>
            </Card>
          </aside>
        </div>
      )}

      {/* STEP 2: CONTACT AND DELIVERY */}
      {step === 2 && (
        <form onSubmit={handleStep2Next} className="max-w-2xl mx-auto space-y-6">
          <Card className="p-6 rounded-2xl border-border/80 bg-surface shadow-xs space-y-5">
            <h2 className="text-xl font-serif font-semibold text-chocolate border-b border-border/60 pb-3">
              Datos de Contacto y Entrega
            </h2>

            {errorMsg && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600">
                {errorMsg}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <Label htmlFor="nombreContacto">Tu Nombre y Apellido *</Label>
                <Input
                  id="nombreContacto"
                  placeholder="ej. Sebastian Baudino"
                  value={nombreContacto}
                  onChange={(e) => setNombreContacto(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="whatsappContacto">Número de WhatsApp (con código de área) *</Label>
                <Input
                  id="whatsappContacto"
                  placeholder="ej. 3493664420"
                  value={whatsappContacto}
                  onChange={(e) => setWhatsappContacto(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="emailContacto">Email (opcional)</Label>
                <Input
                  id="emailContacto"
                  type="email"
                  placeholder="tu@email.com"
                  value={emailContacto}
                  onChange={(e) => setEmailContacto(e.target.value)}
                />
              </div>
            </div>

            {/* Delivery Choice */}
            <div className="space-y-3 pt-3 border-t border-border/60">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted font-sans">
                Seleccioná el Método de Entrega
              </Label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setMetodoEntrega("taller")}
                  className={`rounded-xl border p-3 text-center text-xs font-medium transition-all cursor-pointer ${
                    metodoEntrega === "taller"
                      ? "border-admin-accent bg-admin-accent/10 text-admin-accent font-semibold ring-2 ring-admin-accent/20"
                      : "border-border bg-surface text-muted hover:border-border/80"
                  }`}
                >
                  🏪 Retiro en Taller (Sunchales - Sin Cargo)
                </button>
                <button
                  type="button"
                  onClick={() => setMetodoEntrega("agencia")}
                  className={`rounded-xl border p-3 text-center text-xs font-medium transition-all cursor-pointer ${
                    metodoEntrega === "agencia"
                      ? "border-admin-accent bg-admin-accent/10 text-admin-accent font-semibold ring-2 ring-admin-accent/20"
                      : "border-border bg-surface text-muted hover:border-border/80"
                  }`}
                >
                  📦 Sucursal Vía Cargo
                </button>
                <button
                  type="button"
                  onClick={() => setMetodoEntrega("domicilio")}
                  className={`rounded-xl border p-3 text-center text-xs font-medium transition-all cursor-pointer ${
                    metodoEntrega === "domicilio"
                      ? "border-admin-accent bg-admin-accent/10 text-admin-accent font-semibold ring-2 ring-admin-accent/20"
                      : "border-border bg-surface text-muted hover:border-border/80"
                  }`}
                >
                  🏠 Domicilio Vía Cargo
                </button>
              </div>

              {/* Taller option details */}
              {metodoEntrega === "taller" && (
                <div className="pt-2">
                  <div className="rounded-2xl border border-[#C9A98C] bg-[#FAF7F2] p-4 sm:p-5 text-xs space-y-3 shadow-xs">
                    <div className="rounded-xl bg-white border border-stone-200 p-4 space-y-2.5 shadow-2xs">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 font-black text-xs sm:text-sm text-stone-950">
                          <span className="text-base">📍</span>
                          <span>Dirección del Taller para Retiro Físico</span>
                        </div>
                        <span className="rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                          Sin Cargo ($0)
                        </span>
                      </div>
                      <p className="text-sm font-bold text-chocolate">
                        Florentino Ameghino 1576, Sunchales, Santa Fe, Argentina.
                      </p>
                      <p className="text-xs leading-relaxed text-stone-900 font-sans font-medium">
                        El retiro es totalmente <strong>SIN CARGO ($0)</strong>. Al confirmar tu encargo, coordinaremos directamente con vos por WhatsApp el día y horario en que pasás a buscar tus piezas por el taller.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Agencia or Domicilio forms */}
              {metodoEntrega !== "taller" && (
                <div className="pt-3 space-y-4 bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="provincia">Provincia *</Label>
                      <select
                        id="provincia"
                        value={provincia}
                        onChange={(e) => setProvincia(e.target.value)}
                        className="mt-1 block w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs text-stone-900 focus:border-chocolate focus:outline-none"
                      >
                        {PROVINCIAS_ARGENTINA.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="ciudad">Ciudad / Localidad *</Label>
                      <Input
                        id="ciudad"
                        placeholder="ej. Sunchales, Rosario, Salta"
                        value={ciudad}
                        onChange={(e) => setCiudad(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Calculated Shipping Rate Banner */}
                  <div className="rounded-xl border border-stone-200 bg-stone-50 p-3.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-stone-900 block text-xs">
                        Costo de Envío Estimado ({tarifaEnvio.regionNombre}):
                      </span>
                      <span className="text-[11px] text-stone-500 font-sans">
                        Calculado por proximidad a Sunchales para todo el país
                      </span>
                    </div>
                    <span className="text-base font-black font-mono text-terracota">
                      {formatPrecio(costoEnvio)}
                    </span>
                  </div>

                  <div className="rounded-xl border border-[#C9A98C] bg-[#FAF7F2] p-4 text-xs space-y-2">
                    <p className="text-xs text-stone-900 font-sans leading-relaxed">
                      💡 <strong>Nota sobre las Sucursales Vía Cargo:</strong> El costo mostrado es una estimación aproximada por zona geográfica. Al solicitar el encargo por WhatsApp, Mili acordará con vos la sucursal de Vía Cargo más cercana a tu localidad o transporte alternativo (ej. Correo Argentino) si Vía Cargo no posee sucursal directa en tu ciudad.
                    </p>
                  </div>

                  {/* Full Address fields for Domicilio */}
                  {metodoEntrega === "domicilio" && (
                    <div className="space-y-3 pt-2 border-t border-border/40">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <Label htmlFor="calle">Calle *</Label>
                          <Input
                            id="calle"
                            placeholder="ej. Av. Independencia"
                            value={calle}
                            onChange={(e) => setCalle(e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="numero">Número *</Label>
                          <Input
                            id="numero"
                            placeholder="1234"
                            value={numero}
                            onChange={(e) => setNumero(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <Label htmlFor="piso">Piso (opcional)</Label>
                          <Input
                            id="piso"
                            placeholder="Ej. 4"
                            value={piso}
                            onChange={(e) => setPiso(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="depto">Depto (opcional)</Label>
                          <Input
                            id="depto"
                            placeholder="Ej. B"
                            value={depto}
                            onChange={(e) => setDepto(e.target.value)}
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="codigoPostal">Código Postal</Label>
                          </div>
                          <Input
                            id="codigoPostal"
                            placeholder="Ej. S2322"
                            value={codigoPostal}
                            onChange={(e) => setCodigoPostal(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="pt-1">
                        <p className="text-[11px] text-muted">
                          ¿No sabés tu código postal?{" "}
                          <a
                            href="https://www.correoargentino.com.ar/formularios/cpa"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-terracota underline hover:text-chocolate font-medium"
                          >
                            Buscalo acá →
                          </a>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border/60">
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="rounded-full text-xs cursor-pointer">
                ← Volver a Edición
              </Button>
              <Button type="submit" className="rounded-full bg-admin-accent text-white hover:bg-admin-accent-hover text-xs font-semibold px-6 cursor-pointer">
                Revisar Resumen Final →
              </Button>
            </div>
          </Card>
        </form>
      )}

      {/* STEP 3: FINAL REVIEW */}
      {step === 3 && (
        <div className="max-w-3xl mx-auto space-y-6">
          <Card className="p-6 rounded-2xl border-border/80 bg-surface shadow-sm space-y-6">
            <h2 className="text-xl font-serif font-semibold text-chocolate border-b border-border/60 pb-3">
              Resumen Final del Encargo
            </h2>

            {errorMsg && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600">
                {errorMsg}
              </div>
            )}

            {/* Buyer and Shipping Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-arena/20 p-4 rounded-xl border border-border/50">
              <div className="space-y-1">
                <p className="font-semibold text-chocolate">👤 Cliente</p>
                <p><strong>{nombreContacto}</strong></p>
                <p className="text-muted">WhatsApp: {whatsappContacto}</p>
                {emailContacto && <p className="text-muted">Email: {emailContacto}</p>}
              </div>

              <div className="space-y-1">
                <p className="font-semibold text-chocolate">🚚 Método de Entrega</p>
                <p className="font-semibold text-foreground">
                  {metodoEntrega === "taller"
                    ? "Retiro en Taller (Florentino Ameghino 1576, Sunchales - Sin Cargo)"
                    : metodoEntrega === "agencia"
                    ? `Sucursal Vía Cargo (${ciudad}, ${provincia}) => ${formatPrecio(costoEnvio)}`
                    : `Domicilio Vía Cargo (${calle} ${numero}${piso ? `, Piso ${piso}` : ""}${depto ? `, Depto ${depto}` : ""}, ${ciudad}, ${provincia}${codigoPostal ? ` - CP ${codigoPostal}` : ""}) => ${formatPrecio(costoEnvio)}`}
                </p>
              </div>
            </div>

            {/* Items Breakdown Table */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted font-sans">
                Piezas Incluidas ({items.length})
              </h3>
              <div className="divide-y divide-border/40 border border-border/60 rounded-xl bg-surface p-4 text-xs space-y-3">
                {items.map((it) => (
                  <div key={it.id} className="pt-3 first:pt-0 space-y-1">
                    <div className="flex justify-between font-semibold text-chocolate text-sm">
                      <span>{it.nombre} x {it.cantidad}</span>
                      <span>{formatPrecio(it.precioUnitarioFinal * it.cantidad)}</span>
                    </div>
                    <div className="text-[11px] text-muted space-y-0.5 pl-3 border-l-2 border-admin-accent/40">
                      <p>· Base: {formatPrecio(it.precioBase)} / unitario</p>
                      {it.medidaSeleccionada && <p>· Tamaño: {it.medidaSeleccionada}</p>}
                      {it.conMarco && <p className="text-emerald-600 dark:text-emerald-400 font-semibold">· Enmarcado artesanal en madera (+{formatPrecio(it.adicionalMarco)})</p>}
                      {it.esPersonalizado && (
                        <p className="text-terracota font-medium">
                          · Personalización (+15%): +{formatPrecio(it.recargoPersonalizado)}
                          {it.detallePersonalizacion ? ` ("${it.detallePersonalizacion}")` : ""}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Table Total */}
            <div className="space-y-2 border-t border-border/60 pt-4 text-chocolate font-serif text-sm">
              <div className="flex justify-between text-muted text-xs font-sans">
                <span>Subtotal Piezas ({items.length}):</span>
                <span className="font-semibold text-chocolate">{formatPrecio(totalPiezasPrice)}</span>
              </div>
              <div className="flex justify-between text-muted text-xs font-sans">
                <span>Costo Envío Estimado ({metodoEntrega === "taller" ? "Retiro en Taller" : tarifaEnvio.regionNombre}):</span>
                <span className="font-semibold text-chocolate">{costoEnvio > 0 ? formatPrecio(costoEnvio) : "Sin Cargo"}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-border/40">
                <span>TOTAL ESTIMADO:</span>
                <span className="text-2xl text-admin-accent">{formatPrecio(totalEstimadoFinal)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border/60">
              <Button type="button" variant="outline" onClick={() => setStep(2)} className="rounded-full text-xs cursor-pointer">
                ← Modificar Datos
              </Button>
              <Button
                onClick={handleFinalSubmit}
                disabled={isPending}
                className="rounded-full bg-[#25D366] text-white hover:bg-[#20bd5a] text-xs font-semibold px-6 py-3.5 flex items-center gap-2 shadow-md cursor-pointer"
              >
                <WhatsAppIcon className="h-5 w-5 fill-current" />
                <span>{isPending ? "Registrando Encargo..." : "Solicitar por WhatsApp →"}</span>
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* STEP 4: SUCCESS CONFIRMATION */}
      {step === 4 && (
        <div className="max-w-xl mx-auto text-center space-y-6 py-8">
          <Card className="p-8 rounded-3xl border-emerald-500/30 bg-emerald-500/5 shadow-md space-y-5">
            <span className="text-6xl block">✨</span>
            <h2 className="text-2xl font-serif font-semibold text-chocolate">
              ¡Solicitud de Encargo Registrada!
            </h2>
            <p className="text-xs text-muted leading-relaxed">
              Tu encargo fue registrado con éxito en nuestro sistema. Si no se abrió WhatsApp automáticamente, hacé clic en el botón verde a continuación para enviarle el mensaje ya preparado a <strong>Mili</strong>:
            </p>

            {whatsappUrl && (
              <div className="pt-2">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2.5 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white py-3.5 px-6 text-sm font-bold shadow-md transition-transform active:scale-98"
                >
                  <WhatsAppIcon className="h-5 w-5 fill-current" />
                  <span>💬 Enviar Solicitud por WhatsApp a Mili</span>
                </a>
              </div>
            )}

            <div className="pt-4 border-t border-border/60 space-y-3">
              <Link href="/ceramica/catalogo">
                <Button variant="outline" className="w-full rounded-full border-border bg-surface text-chocolate hover:bg-stone-100 py-3 text-xs font-semibold cursor-pointer">
                  Volver al Catálogo
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
