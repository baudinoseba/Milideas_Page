"use client";

import { useState, useTransition, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
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

export function EncargosCheckoutClient() {
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

  // Step 2 Form State
  const [nombreContacto, setNombreContacto] = useState("");
  const [whatsappContacto, setWhatsappContacto] = useState("");
  const [emailContacto, setEmailContacto] = useState("");
  const [metodoEntrega, setMetodoEntrega] = useState<"taller" | "domicilio" | "agencia">("taller");
  const [provincia, setProvincia] = useState("Santa Fe");
  const [ciudad, setCiudad] = useState("");
  const [calle, setCalle] = useState("");
  const [numero, setNumero] = useState("");
  const [codigoPostal, _setCodigoPostal] = useState("");

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

          <Link href="/ceramica" className="block pt-2">
            <Button variant="outline" className="rounded-full px-6 py-3 border-border text-chocolate text-xs font-semibold">
              Explorar Catálogo de Autor →
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const totalPiezasPrice = getTotalPrice();
  const tarifaEnvio = calcularTarifaPorProvincia(provincia || ciudad, metodoEntrega);
  const costoEnvio = tarifaEnvio.precio;
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
        entregaText = `*Entrega:* Envío a Domicilio Vía Cargo (${ciudad}, ${provincia}) => +${formatPrecio(costoEnvio)}`;
      } else if (metodoEntrega === "agencia") {
        entregaText = `*Entrega:* Sucursal Vía Cargo (${ciudad}, ${provincia}) => +${formatPrecio(costoEnvio)} (Estimado ${tarifaEnvio.regionNombre})`;
      }

      const text = `*MILIDEAS ARTE - SOLICITUD DE ENCARGOS MÚLTIPLES*

--------------------------------
*PIEZAS ENCARGADAS (${items.length} ítems):*

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
¡Hola Mili! Quisiera solicitar estos encargos especiales. Quedo a la espera de la confirmación y tiempo estimado de producción.`;

      const vendorWhatsapp = process.env.NEXT_PUBLIC_VENDOR_WHATSAPP || "5493493668308";
      const waUrl = `https://wa.me/${vendorWhatsapp}?text=${encodeURIComponent(text)}`;

      clearCart();
      setStep(4);
      window.open(waUrl, "_blank");
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
                  <Button className="bg-terracota text-white hover:bg-terracota/90 rounded-full text-xs font-semibold px-4 py-1.5">
                    Ir a Mi Carrito →
                  </Button>
                </Link>
              </Card>
            )}

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-serif font-semibold text-chocolate">
                Configuración y Personalización de tus Encargos ({items.length})
              </h2>
              <span className="text-xs text-muted">Ajustá medidas, grabados y detalles</span>
            </div>

            <div className="space-y-6">
              {items.map((it) => (
                <Card
                  key={it.id}
                  className="p-5 rounded-2xl border-border/80 bg-surface shadow-xs space-y-4 relative"
                >
                  <button
                    type="button"
                    onClick={() => removeItem(it.id)}
                    className="absolute top-4 right-4 text-muted hover:text-red-500 text-sm p-1 font-bold"
                    title="Eliminar encargo"
                  >
                    ✕
                  </button>

                  <div className="flex gap-4 items-start">
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-arena/50 border border-border/40">
                      {it.imagenUrl ? (
                        <Image src={it.imagenUrl} alt={it.nombre} fill className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-3xl">🏺</div>
                      )}
                    </div>

                    <div className="flex-1 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-admin-accent font-sans">
                        Catálogo de {it.tipoCatalogo}
                      </span>
                      <h3 className="text-base font-serif font-semibold text-chocolate">{it.nombre}</h3>
                      <p className="text-xs text-muted">
                        Precio base: <strong className="text-foreground">{formatPrecio(it.precioBase)}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Interactive Customization Section */}
                  <div className="space-y-4 pt-3 border-t border-border/50 bg-arena/20 p-4 rounded-xl text-xs">
                    {/* Ilustración specific options */}
                    {it.tipoCatalogo === "ilustraciones" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-chocolate font-semibold block mb-1">
                            📐 Tamaño de Lámina
                          </Label>
                          <select
                            value={it.medidaSeleccionada || "A4 (21 x 30 cm)"}
                            onChange={(e) =>
                              handleEditItemFields(it, { medidaSeleccionada: e.target.value })
                            }
                            className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-foreground focus:border-admin-accent focus:outline-none"
                          >
                            {MEDIDAS_DEFAULT.map((m) => (
                              <option key={m.id} value={m.nombre}>
                                {m.nombre} {m.recargo > 0 ? `(+${formatPrecio(m.recargo)})` : ""}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center gap-2 pt-5">
                          <input
                            type="checkbox"
                            id={`marco-${it.id}`}
                            checked={it.conMarco}
                            onChange={(e) =>
                              handleEditItemFields(it, { conMarco: e.target.checked })
                            }
                            className="h-4 w-4 rounded border-border text-admin-accent cursor-pointer"
                          />
                          <Label htmlFor={`marco-${it.id}`} className="text-xs cursor-pointer font-medium">
                            Enmarcado en madera artesanal (+{formatPrecio(PRECIO_MARCO_DEFAULT)})
                          </Label>
                        </div>
                      </div>
                    )}

                    {/* Personalization (+15%) */}
                    <div className="space-y-2 pt-1 border-t border-border/40">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`custom-${it.id}`}
                          checked={it.esPersonalizado}
                          onChange={(e) =>
                            handleEditItemFields(it, { esPersonalizado: e.target.checked })
                          }
                          className="h-4 w-4 rounded border-border text-admin-accent cursor-pointer"
                        />
                        <Label htmlFor={`custom-${it.id}`} className="text-xs font-semibold text-chocolate cursor-pointer">
                          ✨ ¿Deseás personalizar esta pieza con nombres, frases o motivos? (+15%)
                        </Label>
                      </div>

                      {it.esPersonalizado && (
                        <div>
                          <Label htmlFor={`detalle-${it.id}`} className="text-[11px] text-muted block mb-1">
                            Detalle exacto del grabado o inscripción
                          </Label>
                          <Textarea
                            id={`detalle-${it.id}`}
                            placeholder="ej. Inscribir 'M&S - 15/09' en la base de la pieza"
                            value={it.detallePersonalizacion}
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
                            className="px-2 text-xs font-bold text-chocolate hover:text-admin-accent"
                          >
                            −
                          </button>
                          <span className="px-2 text-xs font-bold text-chocolate">{it.cantidad}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(it.id, it.cantidad + 1)}
                            className="px-2 text-xs font-bold text-chocolate hover:text-admin-accent"
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
                    {costoEnvio > 0 ? formatPrecio(costoEnvio) : "Se calcula en el paso 2"}
                  </span>
                </div>

                <div className="flex justify-between border-t border-border/60 pt-4 text-base font-bold text-chocolate">
                  <span>TOTAL ESTIMADO</span>
                  <span className="text-xl font-serif text-admin-accent">{formatPrecio(totalEstimadoFinal)}</span>
                </div>
              </div>

              <Button
                onClick={() => setStep(2)}
                className="w-full py-3.5 text-sm font-semibold rounded-full bg-admin-accent text-white hover:bg-admin-accent-hover shadow-md transition-all"
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
                  placeholder="ej. 3493668308"
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
                  className={`rounded-xl border p-3 text-center text-xs font-medium transition-all ${
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
                  className={`rounded-xl border p-3 text-center text-xs font-medium transition-all ${
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
                  className={`rounded-xl border p-3 text-center text-xs font-medium transition-all ${
                    metodoEntrega === "domicilio"
                      ? "border-admin-accent bg-admin-accent/10 text-admin-accent font-semibold ring-2 ring-admin-accent/20"
                      : "border-border bg-surface text-muted hover:border-border/80"
                  }`}
                >
                  🏠 Domicilio Vía Cargo
                </button>
              </div>

              {metodoEntrega !== "taller" && (
                <div className="pt-3 space-y-4 bg-arena/20 p-4 rounded-xl border border-border/50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="provincia">Provincia *</Label>
                      <select
                        id="provincia"
                        value={provincia}
                        onChange={(e) => setProvincia(e.target.value)}
                        className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-admin-accent focus:outline-none"
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
                  <div className="rounded-xl border border-admin-accent/30 bg-surface p-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-chocolate block">
                        Costo de Envío Estimado ({tarifaEnvio.regionNombre}):
                      </span>
                      <span className="text-[11px] text-muted">
                        Calculado por proximidad a Sunchales para todo el país
                      </span>
                    </div>
                    <span className="text-base font-bold font-serif text-admin-accent">
                      {formatPrecio(costoEnvio)}
                    </span>
                  </div>

                  <p className="text-[11px] text-muted leading-relaxed italic bg-surface/50 p-2.5 rounded-lg border border-border/30">
                    💡 <strong>Nota sobre las Sucursales Vía Cargo:</strong> El costo mostrado es una estimación aproximada por zona geográfica. Al solicitar el encargo por WhatsApp, Mili acordará con vos la sucursal de Vía Cargo más cercana a tu localidad o transporte alternativo (ej. Correo Argentino) si Vía Cargo no posee sucursal directa en tu ciudad.
                  </p>

                  {metodoEntrega === "domicilio" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/40">
                      <div>
                        <Label htmlFor="calle">Calle</Label>
                        <Input
                          id="calle"
                          placeholder="ej. Av. Independencia"
                          value={calle}
                          onChange={(e) => setCalle(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="numero">Número</Label>
                        <Input
                          id="numero"
                          placeholder="1234"
                          value={numero}
                          onChange={(e) => setNumero(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border/60">
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="rounded-full text-xs">
                ← Volver a Edición
              </Button>
              <Button type="submit" className="rounded-full bg-admin-accent text-white hover:bg-admin-accent-hover text-xs font-semibold px-6">
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
                <p className="capitalize font-semibold text-foreground">
                  {metodoEntrega === "taller"
                    ? "Retiro en Taller Mili Ferrero (Sunchales - Sin Cargo)"
                    : metodoEntrega === "agencia"
                    ? `Sucursal Vía Cargo (${ciudad}, ${provincia}) => ${formatPrecio(costoEnvio)}`
                    : `Domicilio Vía Cargo (${calle} ${numero}, ${ciudad}, ${provincia}) => ${formatPrecio(costoEnvio)}`}
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
                <span>Costo Envío Estimado ({tarifaEnvio.regionNombre}):</span>
                <span className="font-semibold text-chocolate">{costoEnvio > 0 ? formatPrecio(costoEnvio) : "Sin Cargo"}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-border/40">
                <span>TOTAL ESTIMADO:</span>
                <span className="text-2xl text-admin-accent">{formatPrecio(totalEstimadoFinal)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border/60">
              <Button type="button" variant="outline" onClick={() => setStep(2)} className="rounded-full text-xs">
                ← Modificar Datos
              </Button>
              <Button
                onClick={handleFinalSubmit}
                disabled={isPending}
                className="rounded-full bg-[#25D366] text-white hover:bg-[#20bd5a] text-xs font-semibold px-6 py-3.5 flex items-center gap-2 shadow-md"
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
              ¡Solicitud de Encargo Enviada!
            </h2>
            <p className="text-xs text-muted leading-relaxed">
              Tu encargo fue registrado exitosamente. Se ha abierto una ventana de WhatsApp para conversar con <strong>Mili Ferrero</strong> y coordinar la producción, entrega y sucursal.
            </p>

            <div className="pt-4 border-t border-border/60 space-y-3">
              <Link href="/ceramica">
                <Button className="w-full rounded-full bg-chocolate text-crema-cruda hover:bg-chocolate/90 py-3 text-xs font-semibold">
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
