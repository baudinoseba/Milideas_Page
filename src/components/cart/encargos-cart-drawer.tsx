"use client";

import { useState, useEffect, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
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

  const [calle, _setCalle] = useState("");
  const [numero, _setNumero] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [codigoPostal, _setCodigoPostal] = useState("");
  const [referencia, _setReferencia] = useState("");

  useEffect(() => {
    const supabase = createClient();
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
              if (profileData.direccion_ciudad) setCiudad(profileData.direccion_ciudad);
              if (profileData.direccion_calle) _setCalle(profileData.direccion_calle);
              if (profileData.direccion_numero) _setNumero(profileData.direccion_numero);
              if (profileData.direccion_codigo_postal) _setCodigoPostal(profileData.direccion_codigo_postal);
              if (profileData.direccion_calle) setMetodoEntrega("domicilio");
            }
          });
      }
    });
  }, []);

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
          const specs = [];
          if (it.medidaSeleccionada) specs.push(`Medida: ${it.medidaSeleccionada}`);
          if (it.conMarco) specs.push("Con marco de madera");
          if (it.esPersonalizado) {
            specs.push(`Personalizado (+15%)${it.detallePersonalizacion ? `: "${it.detallePersonalizacion}"` : ""}`);
          }

          const specsString = specs.length > 0 ? `\n  - ${specs.join("\n  - ")}` : "";
          return `${idx + 1}. *${it.nombre}* (${it.tipoCatalogo.toUpperCase()}) x ${it.cantidad} => ${formatPrecio(it.precioUnitarioFinal * it.cantidad)}${specsString}`;
        })
        .join("\n\n");

      let entregaText = "*Entrega:* Retiro en Taller (Sunchales - Sin Cargo)";
      if (metodoEntrega === "domicilio") {
        entregaText = `*Entrega:* Envío a Domicilio Vía Cargo (${ciudad})`;
      } else if (metodoEntrega === "agencia") {
        entregaText = `*Entrega:* Retiro en Sucursal Vía Cargo (${ciudad})`;
      }

      const isSingle = totalItemsCount === 1;
      const title = isSingle
        ? "*MILIDEAS ARTE - SOLICITUD DE ENCARGO*"
        : "*MILIDEAS ARTE - SOLICITUD DE ENCARGOS*";

      const sectionTitle = isSingle
        ? "*PIEZA ENCARGADA (1 ítem):*"
        : `*PIEZAS ENCARGADAS (${totalItemsCount} ítems):*`;

      const closingText = isSingle
        ? "¡Hola Mili! Quisiera solicitar este encargo especial. Quedo a la espera de la confirmación y tiempo estimado de producción."
        : "¡Hola Mili! Quisiera solicitar estos encargos especiales. Quedo a la espera de la confirmación y tiempo estimado de producción.";

      const text = `${title}

--------------------------------
${sectionTitle}

${itemsFormattedText}

--------------------------------
*TOTAL ESTIMADO:* ${formatPrecio(totalPrice)}

--------------------------------
*DATOS DEL CLIENTE:*
*Nombre:* ${nombreContacto}
*WhatsApp:* ${whatsappContacto}
${emailContacto ? `*Email:* ${emailContacto}\n` : ""}${entregaText}

--------------------------------
${closingText}`;

      const vendorWhatsapp = process.env.NEXT_PUBLIC_VENDOR_WHATSAPP || "5493493668308";
      const waUrl = `https://wa.me/${vendorWhatsapp}?text=${encodeURIComponent(text)}`;

      clearCart();
      setIsCheckoutFormOpen(false);
      closeCart();
      window.open(waUrl, "_blank");
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeCart}
            className="fixed inset-0 bg-chocolate/40 backdrop-blur-md cursor-pointer"
            aria-hidden="true"
          />

          {/* Slide-out Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="relative z-10 flex h-full w-full max-w-md flex-col bg-surface text-chocolate shadow-piece border-l border-border"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border bg-arena/60 p-5 backdrop-blur-sm">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-admin-accent font-sans block">
                  Bolsa de Encargos Especiales
                </span>
                <h2 className="text-lg font-serif font-medium text-chocolate">
                  Piezas a Medida ({totalItemsCount})
                </h2>
              </div>
              <button
                type="button"
                onClick={closeCart}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-surface border border-border text-chocolate transition-colors hover:bg-terracota hover:text-white"
                aria-label="Cerrar bolsa de encargos"
              >
                ✕
              </button>
            </div>

            {/* Content / Items List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-background/40">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                  <span className="text-4xl">🎨</span>
                  <p className="text-lg font-serif font-medium text-chocolate">Tu bolsa de encargos está vacía</p>
                  <p className="text-xs text-muted max-w-xs leading-relaxed font-sans">
                    Explorá las piezas en el catálogo y presioná &quot;Encargar esta pieza&quot; para agregar tus obras personalizadas a medida.
                  </p>
                  <Button variant="outline" onClick={closeCart} className="rounded-xl text-xs mt-2">
                    Explorar Catálogo
                  </Button>
                </div>
              ) : !isCheckoutFormOpen ? (
                <ul className="space-y-3">
                  {items.map((it) => (
                    <li
                      key={it.id}
                      className="flex gap-3 rounded-2xl bg-surface p-3 border border-border shadow-xs transition-all hover:border-terracota/40"
                    >
                      {/* Thumbnail */}
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-arena/50 p-1 border border-border/40">
                        {it.imagenUrl ? (
                          <Image
                            src={it.imagenUrl}
                            alt={it.nombre}
                            fill
                            className="object-contain rounded-lg p-0.5"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xl">
                            🏺
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 pr-2 space-y-1">
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="text-sm font-medium font-serif text-chocolate truncate">
                            {it.nombre}
                          </h4>
                          <button
                            type="button"
                            onClick={() => removeItem(it.id)}
                            className="text-muted hover:text-terracota transition-colors p-0.5 text-xs"
                            aria-label={`Quitar ${it.nombre}`}
                          >
                            ✕
                          </button>
                        </div>

                        {/* Specs tags */}
                        <div className="text-[11px] font-sans text-muted space-y-0.5">
                          {it.medidaSeleccionada && (
                            <p>📐 Medida: <strong className="text-chocolate font-semibold">{it.medidaSeleccionada}</strong></p>
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

                        {/* Price & Touch Stepper */}
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-sm font-semibold font-sans text-terracota">
                            {formatPrecio(it.precioUnitarioFinal * it.cantidad)}
                          </span>

                          <div className="flex items-center rounded-lg border border-border bg-arena/40">
                            <button
                              type="button"
                              onClick={() => updateQuantity(it.id, it.cantidad - 1)}
                              className="flex h-6 w-6 items-center justify-center text-xs font-semibold text-chocolate hover:bg-surface transition-colors"
                            >
                              −
                            </button>
                            <span className="w-5 text-center text-xs font-semibold text-chocolate">
                              {it.cantidad}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(it.id, it.cantidad + 1)}
                              className="flex h-6 w-6 items-center justify-center text-xs font-semibold text-chocolate hover:bg-surface transition-colors"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                /* Checkout Form Step */
                <form onSubmit={handleSubmitEncargos} className="space-y-4">
                  <button
                    type="button"
                    onClick={() => setIsCheckoutFormOpen(false)}
                    className="text-xs text-terracota font-semibold flex items-center gap-1 hover:underline"
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
                  <div className="space-y-2 pt-2 border-t border-border">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted font-sans">
                      Método de Entrega
                    </Label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setMetodoEntrega("taller")}
                        className={`rounded-lg border p-2 text-center text-[11px] font-medium transition-colors ${
                          metodoEntrega === "taller"
                            ? "border-terracota bg-terracota/10 text-terracota font-semibold"
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
                            ? "border-terracota bg-terracota/10 text-terracota font-semibold"
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
                            ? "border-terracota bg-terracota/10 text-terracota font-semibold"
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
                    className="w-full bg-[#25D366] text-white hover:bg-[#20bd5a] flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold shadow-sm mt-4"
                  >
                    <WhatsAppIcon className="h-5 w-5 fill-current" />
                    <span>{isPending ? "Enviando encargos..." : "Solicitar por WhatsApp"}</span>
                  </Button>
                </form>
              )}
            </div>

            {/* Footer CTA Panel */}
            {items.length > 0 && !isCheckoutFormOpen && (
              <div className="border-t border-border bg-arena/60 p-5 space-y-3 backdrop-blur-sm">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted font-sans">Total Estimado ({totalItemsCount} ítems)</span>
                  <span className="text-lg font-semibold font-serif text-chocolate">
                    {formatPrecio(totalPrice)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCheckoutFormOpen(true)}
                  className="w-full rounded-full bg-terracota py-3.5 text-center text-sm font-semibold text-white shadow-sm transition-all hover:bg-terracota/90 hover:-translate-y-0.5 active:scale-[0.98]"
                >
                  Finalizar Solicitud de Encargos →
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
