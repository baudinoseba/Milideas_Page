"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { formatPrecio } from "@/lib/pricing";
import { crearEncargoAction } from "@/lib/actions";
import { useEncargosCartStore } from "@/stores/encargos-cart-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";

export function EncargosCartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getTotalItems,
  } = useEncargosCartStore();

  const [isCheckoutFormOpen, setIsCheckoutFormOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form state
  const [nombreContacto, setNombreContacto] = useState("");
  const [whatsappContacto, setWhatsappContacto] = useState("");
  const [emailContacto, setEmailContacto] = useState("");
  const [metodoEntrega, setMetodoEntrega] = useState<"taller" | "domicilio" | "agencia">("taller");

  const [calle, setCalle] = useState("");
  const [numero, setNumero] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [codigoPostal, setCodigoPostal] = useState("");
  const [referencia, setReferencia] = useState("");

  if (!isOpen) return null;

  const totalPrice = getTotalPrice();
  const totalItemsCount = getTotalItems();

  const handleSubmitEncargos = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreContacto.trim() || !whatsappContacto.trim()) {
      setErrorMsg("Por favor completá tu nombre y WhatsApp.");
      return;
    }

    setErrorMsg(null);
    const formData = new FormData();
    formData.append("nombreContacto", nombreContacto);
    formData.append("whatsappContacto", whatsappContacto);
    formData.append("emailContacto", emailContacto);
    formData.append("metodoEntrega", metodoEntrega);
    formData.append("totalEstimado", String(totalPrice));

    // Send items serialized for backend
    formData.append("itemsJson", JSON.stringify(items));

    if (metodoEntrega === "domicilio") {
      formData.append("calle", calle);
      formData.append("numero", numero);
      formData.append("ciudad", ciudad);
      formData.append("codigoPostal", codigoPostal);
      formData.append("referencia", referencia);
    } else if (metodoEntrega === "agencia") {
      formData.append("ciudad", ciudad);
    }

    startTransition(async () => {
      const res = await crearEncargoAction(formData);
      if (!res.success) {
        setErrorMsg(res.error || "No se pudo registrar la solicitud.");
        return;
      }

      // Build consolidated WhatsApp message
      const itemsFormattedText = items
        .map((it, idx) => {
          let specs = [];
          if (it.medidaSeleccionada) specs.push(`Medida: ${it.medidaSeleccionada}`);
          if (it.conMarco) specs.push("Con marco de madera");
          if (it.esPersonalizado) {
            specs.push(`Personalizado (+15%)${it.detallePersonalizacion ? `: "${it.detallePersonalizacion}"` : ""}`);
          }

          const specsString = specs.length > 0 ? `\n  - ${specs.join("\n  - ")}` : "";
          return `${idx + 1}. *${it.nombre}* (${it.tipoCatalogo.toUpperCase()}) x ${it.cantidad} => ${formatPrecio(it.precioUnitarioFinal * it.cantidad)}${specsString}`;
        })
        .join("\n\n");

      let entregaText = "*Entrega:* Retiro en Taller (Sunchales)";
      if (metodoEntrega === "domicilio") {
        entregaText = `*Entrega:* Envío a Domicilio Vía Cargo (${ciudad})`;
      } else if (metodoEntrega === "agencia") {
        entregaText = `*Entrega:* Retiro en Sucursal Vía Cargo (${ciudad})`;
      }

      const text = `*MILIDEAS ARTE - SOLICITUD DE ENCARGOS MÚLTIPLES*

--------------------------------
*PIEZAS ENCARGADAS (${totalItemsCount} ítems):*

${itemsFormattedText}

--------------------------------
*TOTAL ESTIMADO:* ${formatPrecio(totalPrice)}

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
      setIsCheckoutFormOpen(false);
      closeCart();
      window.open(waUrl, "_blank");
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={closeCart}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-surface border-l border-border shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
          {/* Top Header */}
          <div className="flex items-center justify-between border-b border-border/80 p-5 bg-surface/90">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-admin-accent">
                Bolsa de Encargos Especiales
              </span>
              <h2 className="text-lg font-serif font-medium text-chocolate">
                Tus Piezas a Medida ({totalItemsCount})
              </h2>
            </div>
            <button
              onClick={closeCart}
              className="rounded-full p-2 text-muted hover:bg-arena hover:text-foreground transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Cart Content / Item List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3">
                <span className="text-4xl">🎨</span>
                <p className="text-sm font-medium text-muted">Tu bolsa de encargos está vacía.</p>
                <p className="text-xs text-muted/80 max-w-xs">
                  Explorá el catálogo y presioná &quot;Encargar esta pieza&quot; para agregar tus obras personalizadas.
                </p>
                <Button variant="outline" onClick={closeCart} className="rounded-xl text-xs">
                  Explorar Catálogo
                </Button>
              </div>
            ) : !isCheckoutFormOpen ? (
              <div className="space-y-4">
                {items.map((it) => (
                  <div
                    key={it.id}
                    className="flex gap-3 rounded-2xl border border-border/70 bg-arena/20 p-3 relative group transition-all hover:border-admin-accent/50"
                  >
                    {/* Thumbnail */}
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-surface border border-border/40">
                      {it.imagenUrl ? (
                        <Image
                          src={it.imagenUrl}
                          alt={it.nombre}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xl bg-arena">
                          🏺
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 pr-6 space-y-1">
                      <h4 className="text-sm font-semibold text-chocolate truncate">
                        {it.nombre}
                      </h4>
                      <p className="text-[11px] text-muted">
                        Catálogo: <span className="font-semibold text-foreground uppercase">{it.tipoCatalogo}</span>
                      </p>

                      {/* Specs tags */}
                      <div className="text-[11px] text-chocolate/90 space-y-0.5">
                        {it.medidaSeleccionada && (
                          <p>📐 <strong className="text-foreground">{it.medidaSeleccionada}</strong></p>
                        )}
                        {it.conMarco && (
                          <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            ✓ Con marco de madera artesanal (+{formatPrecio(it.adicionalMarco)})
                          </p>
                        )}
                        {it.esPersonalizado && (
                          <p className="text-terracota font-semibold">
                            ✨ Personalizado (+15%)
                            {it.detallePersonalizacion && (
                              <span className="block text-[10px] text-muted italic font-normal">
                                &ldquo;{it.detallePersonalizacion}&rdquo;
                              </span>
                            )}
                          </p>
                        )}
                      </div>

                      {/* Price & Stepper */}
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center rounded-lg border border-border bg-surface px-1.5 py-0.5">
                          <button
                            onClick={() => updateQuantity(it.id, it.cantidad - 1)}
                            className="px-1 text-xs font-bold hover:text-admin-accent"
                          >
                            −
                          </button>
                          <span className="px-2 text-xs font-bold text-chocolate">{it.cantidad}</span>
                          <button
                            onClick={() => updateQuantity(it.id, it.cantidad + 1)}
                            className="px-1 text-xs font-bold hover:text-admin-accent"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-sm font-bold text-chocolate font-serif">
                          {formatPrecio(it.precioUnitarioFinal * it.cantidad)}
                        </span>
                      </div>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => removeItem(it.id)}
                      className="absolute top-2 right-2 text-muted hover:text-red-500 text-xs font-bold p-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              /* Checkout Form step */
              <form onSubmit={handleSubmitEncargos} className="space-y-4">
                <button
                  type="button"
                  onClick={() => setIsCheckoutFormOpen(false)}
                  className="text-xs text-admin-accent font-semibold flex items-center gap-1 mb-2 hover:underline"
                >
                  ← Volver a revisar encargos
                </button>

                {errorMsg && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600">
                    {errorMsg}
                  </div>
                )}

                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted font-sans">
                    Datos de Contacto
                  </h4>
                  <div>
                    <Label htmlFor="nombreContacto">Tu Nombre y Apellido *</Label>
                    <Input
                      id="nombreContacto"
                      placeholder="ej. María González"
                      value={nombreContacto}
                      onChange={(e) => setNombreContacto(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="whatsappContacto">WhatsApp de Contacto *</Label>
                    <Input
                      id="whatsappContacto"
                      placeholder="ej. 3493456789"
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

                {/* Delivery Option */}
                <div className="space-y-2 pt-2 border-t border-border/40">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted font-sans">
                    Método de Entrega
                  </Label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setMetodoEntrega("taller")}
                      className={`rounded-lg border p-2 text-center text-[11px] font-medium transition-colors ${
                        metodoEntrega === "taller"
                          ? "border-admin-accent bg-admin-accent/10 text-admin-accent font-semibold"
                          : "border-border bg-surface text-muted"
                      }`}
                    >
                      🏪 Taller
                    </button>
                    <button
                      type="button"
                      onClick={() => setMetodoEntrega("agencia")}
                      className={`rounded-lg border p-2 text-center text-[11px] font-medium transition-colors ${
                        metodoEntrega === "agencia"
                          ? "border-admin-accent bg-admin-accent/10 text-admin-accent font-semibold"
                          : "border-border bg-surface text-muted"
                      }`}
                    >
                      📦 Agencia
                    </button>
                    <button
                      type="button"
                      onClick={() => setMetodoEntrega("domicilio")}
                      className={`rounded-lg border p-2 text-center text-[11px] font-medium transition-colors ${
                        metodoEntrega === "domicilio"
                          ? "border-admin-accent bg-admin-accent/10 text-admin-accent font-semibold"
                          : "border-border bg-surface text-muted"
                      }`}
                    >
                      🏠 Domicilio
                    </button>
                  </div>

                  {metodoEntrega !== "taller" && (
                    <div className="pt-2 space-y-2">
                      <Label htmlFor="ciudad" className="text-xs text-muted">Ciudad / Localidad</Label>
                      <Input
                        id="ciudad"
                        placeholder="ej. Sunchales, Rosario, Rafaela"
                        value={ciudad}
                        onChange={(e) => setCiudad(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isPending}
                  className="w-full bg-[#25D366] text-white hover:bg-[#20bd5a] flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold shadow-md mt-4"
                >
                  <WhatsAppIcon className="h-5 w-5 fill-current" />
                  <span>{isPending ? "Enviando encargos..." : "Solicitar por WhatsApp"}</span>
                </Button>
              </form>
            )}
          </div>

          {/* Footer Summary Bar */}
          {items.length > 0 && !isCheckoutFormOpen && (
            <div className="border-t border-border/80 p-5 bg-surface/95 space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-xs uppercase tracking-wider text-muted font-sans font-semibold">
                  TOTAL ESTIMADO:
                </span>
                <span className="text-xl font-bold font-serif text-chocolate">
                  {formatPrecio(totalPrice)}
                </span>
              </div>

              <Button
                onClick={() => setIsCheckoutFormOpen(true)}
                className="w-full bg-admin-accent text-white hover:bg-admin-accent-hover py-3.5 rounded-xl font-semibold shadow-md flex items-center justify-center gap-2"
              >
                <span>Finalizar Solicitud de Encargos ({totalItemsCount}) →</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
