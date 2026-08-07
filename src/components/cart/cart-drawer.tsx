"use client";

import { useState, useEffect, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useCartStore } from "@/stores/cart-store";
import { useEncargosCartStore } from "@/stores/encargos-cart-store";
import { formatPrecio, calcularSubtotal, calcularPrecioUnitario } from "@/lib/pricing";
import { createClient } from "@/lib/supabase/client";
import { crearEncargoAction } from "@/lib/actions";
import { CartReservationTimer } from "@/components/cart/cart-reservation-timer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";

interface CrossSellProduct {
  id: string;
  slug: string;
  nombre: string;
  precio: number;
  imagen: string;
  esPersonalizable: boolean;
  stockDisponible: number;
}

export function CartDrawer() {
  const isOpen = useCartStore((s) => s.isOpen);
  const closeCart = useCartStore((s) => s.closeCart);

  // Stock Cart Store
  const items = useCartStore((s) => s.items);
  const updateQty = useCartStore((s) => s.updateQty);
  const removeItem = useCartStore((s) => s.removeItem);
  const addItem = useCartStore((s) => s.addItem);
  const router = useRouter();

  // Encargos Store
  const encargoItems = useEncargosCartStore((s) => s.items);
  const removeEncargoItem = useEncargosCartStore((s) => s.removeItem);
  const updateEncargoQuantity = useEncargosCartStore((s) => s.updateQuantity);
  const clearEncargosCart = useEncargosCartStore((s) => s.clearCart);
  const getEncargosTotalPrice = useEncargosCartStore((s) => s.getTotalPrice);
  const getEncargosTotalItems = useEncargosCartStore((s) => s.getTotalItems);

  // Tab State: "stock" | "encargos"
  const [activeTab, setActiveTab] = useState<"stock" | "encargos">("stock");

  // Auto-switch to "encargos" if stock is empty but encargos has items
  useEffect(() => {
    if (items.length === 0 && encargoItems.length > 0) {
      setActiveTab("encargos");
    } else if (items.length > 0 && encargoItems.length === 0) {
      setActiveTab("stock");
    }
  }, [items.length, encargoItems.length]);

  // Encargos Checkout Form State
  const [isEncargosFormOpen, setIsEncargosFormOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [encargosError, setEncargosError] = useState<string | null>(null);

  const [nombreContacto, setNombreContacto] = useState("");
  const [whatsappContacto, setWhatsappContacto] = useState("");
  const [emailContacto, setEmailContacto] = useState("");
  const [metodoEntrega, setMetodoEntrega] = useState<"taller" | "domicilio" | "agencia">("taller");
  const [ciudad, setCiudad] = useState("");

  const [crossSellItems, setCrossSellItems] = useState<CrossSellProduct[]>([]);
  const subtotalStock = calcularSubtotal(items);
  const totalEncargosPrice = getEncargosTotalPrice();
  const totalEncargosCount = getEncargosTotalItems();

  // Fetch Cross-sell items
  useEffect(() => {
    if (!isOpen) return;
    const supabase = createClient();
    supabase
      .from("productos")
      .select("id, slug, nombre, precio_base, es_personalizable, stock_disponible, producto_imagenes(url_imagen, orden)")
      .eq("activo", true)
      .limit(8)
      .then(({ data }) => {
        if (data) {
          const cartIds = new Set(items.map((i) => i.productoId));
          const available = data.filter((p) => !cartIds.has(p.id));
          const mapped = available.slice(0, 2).map((p) => {
            const sortedImg = [...(p.producto_imagenes ?? [])].sort((a, b) => a.orden - b.orden);
            return {
              id: p.id,
              slug: p.slug,
              nombre: p.nombre,
              precio: p.precio_base,
              imagen: sortedImg[0]?.url_imagen ?? "https://placehold.co/300x300",
              esPersonalizable: p.es_personalizable,
              stockDisponible: p.stock_disponible,
            };
          });
          setCrossSellItems(mapped);
        }
      });
  }, [isOpen, items]);

  const handleCheckoutStock = () => {
    closeCart();
    router.push("/carrito");
  };

  const handleSubmitEncargos = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreContacto.trim() || !whatsappContacto.trim()) {
      setEncargosError("Por favor completá tu nombre y WhatsApp.");
      return;
    }

    setEncargosError(null);
    const formData = new FormData();
    formData.append("nombreContacto", nombreContacto);
    formData.append("whatsappContacto", whatsappContacto);
    formData.append("emailContacto", emailContacto);
    formData.append("metodoEntrega", metodoEntrega);
    formData.append("totalEstimado", String(totalEncargosPrice));
    formData.append("itemsJson", JSON.stringify(encargoItems));

    if (metodoEntrega !== "taller") {
      formData.append("ciudad", ciudad);
    }

    startTransition(async () => {
      const res = await crearEncargoAction(formData);
      if (!res.success) {
        setEncargosError(res.error || "No se pudo registrar la solicitud.");
        return;
      }

      // Build consolidated WhatsApp message
      const itemsFormattedText = encargoItems
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
*PIEZAS ENCARGADAS (${totalEncargosCount} ítems):*

${itemsFormattedText}

--------------------------------
*TOTAL ESTIMADO:* ${formatPrecio(totalEncargosPrice)}

--------------------------------
*DATOS DEL CLIENTE:*
*Nombre:* ${nombreContacto}
*WhatsApp:* ${whatsappContacto}
${emailContacto ? `*Email:* ${emailContacto}\n` : ""}${entregaText}

--------------------------------
¡Hola Mili! Quisiera solicitar estos encargos especiales. Quedo a la espera de la confirmación y tiempo estimado de producción.`;

      const vendorWhatsapp = process.env.NEXT_PUBLIC_VENDOR_WHATSAPP || "5493493668308";
      const waUrl = `https://wa.me/${vendorWhatsapp}?text=${encodeURIComponent(text)}`;

      clearEncargosCart();
      setIsEncargosFormOpen(false);
      closeCart();
      window.open(waUrl, "_blank");
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Warm Ceramic Studio Backdrop */}
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
                <h2 className="text-lg font-medium font-serif text-chocolate">
                  Tu Bolsa ({items.length + totalEncargosCount})
                </h2>
                <p className="text-[11px] font-sans text-muted">
                  Piezas elegidas e ilustradas a mano
                </p>
              </div>
              <button
                type="button"
                onClick={closeCart}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-surface border border-border text-chocolate transition-colors hover:bg-terracota hover:text-white"
                aria-label="Cerrar carrito"
              >
                ✕
              </button>
            </div>

            {/* Sub-Header Tabs if both or encargos exist */}
            {(items.length > 0 && encargoItems.length > 0) && (
              <div className="flex border-b border-border bg-arena/30 text-xs font-semibold">
                <button
                  onClick={() => { setActiveTab("stock"); setIsEncargosFormOpen(false); }}
                  className={`flex-1 py-2.5 text-center transition-colors border-b-2 ${
                    activeTab === "stock"
                      ? "border-terracota text-terracota bg-surface"
                      : "border-transparent text-muted hover:text-chocolate"
                  }`}
                >
                  📦 En Stock ({items.length})
                </button>
                <button
                  onClick={() => setActiveTab("encargos")}
                  className={`flex-1 py-2.5 text-center transition-colors border-b-2 ${
                    activeTab === "encargos"
                      ? "border-admin-accent text-admin-accent bg-surface"
                      : "border-transparent text-muted hover:text-chocolate"
                  }`}
                >
                  🎨 Encargos ({totalEncargosCount})
                </button>
              </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-background/40">
              {activeTab === "stock" ? (
                <>
                  <CartReservationTimer />

                  {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                      <span className="text-4xl">🏺</span>
                      <p className="text-lg font-medium font-serif text-chocolate">Tu carrito está vacío</p>
                      <p className="text-xs text-muted max-w-xs leading-relaxed font-sans">
                        Explorá las piezas disponibles moldeadas e ilustradas a mano.
                      </p>
                      {encargoItems.length > 0 && (
                        <Button
                          variant="outline"
                          onClick={() => setActiveTab("encargos")}
                          className="rounded-xl text-xs mt-2"
                        >
                          Ver tus encargos a medida ({totalEncargosCount}) →
                        </Button>
                      )}
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {items.map((item) => {
                        const unitario = calcularPrecioUnitario(
                          item.precioBase,
                          item.esPersonalizable,
                          item.personalizado
                        );

                        return (
                          <li
                            key={item.productoId}
                            className="flex gap-3.5 rounded-2xl bg-surface p-3 border border-border shadow-xs transition-all hover:border-terracota/40"
                          >
                            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-arena/50 p-1 border border-border/40">
                              <Image
                                src={item.imagenUrl || "https://placehold.co/800x800"}
                                alt={item.nombre}
                                fill
                                className="object-contain p-0.5"
                                sizes="80px"
                              />
                            </div>

                            <div className="flex flex-1 flex-col justify-between py-0.5">
                              <div>
                                <div className="flex items-start justify-between gap-2">
                                  <h3 className="text-sm font-medium font-serif text-chocolate leading-snug">
                                    {item.nombre}
                                  </h3>
                                  <button
                                    type="button"
                                    onClick={() => removeItem(item.productoId)}
                                    className="text-muted hover:text-terracota transition-colors p-1"
                                    aria-label={`Quitar ${item.nombre}`}
                                  >
                                    ✕
                                  </button>
                                </div>
                                <p className="text-[11px] text-muted font-sans pt-0.5">
                                  Esculpido & ilustrado a mano
                                </p>
                              </div>

                              <div className="flex items-center justify-between pt-2">
                                <span className="text-sm font-semibold font-sans text-terracota">
                                  {formatPrecio(unitario * item.cantidad)}
                                </span>

                                <div className="flex items-center rounded-lg border border-border bg-arena/40">
                                  <button
                                    type="button"
                                    onClick={() => updateQty(item.productoId, item.cantidad - 1)}
                                    className="flex h-7 w-7 items-center justify-center text-xs font-semibold text-chocolate hover:bg-surface transition-colors"
                                  >
                                    −
                                  </button>
                                  <span className="w-6 text-center text-xs font-semibold text-chocolate">
                                    {item.cantidad}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => updateQty(item.productoId, item.cantidad + 1)}
                                    className="flex h-7 w-7 items-center justify-center text-xs font-semibold text-chocolate hover:bg-surface transition-colors"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {/* Cross-Selling */}
                  {items.length > 0 && crossSellItems.length > 0 && (
                    <div className="pt-5 border-t border-border space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-terracota font-sans">
                          Compañeros ideales
                        </span>
                        <span className="text-[11px] font-handwritten text-muted">De la misma colección</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        {crossSellItems.map((prod) => (
                          <div
                            key={prod.id}
                            className="flex flex-col gap-1.5 rounded-xl bg-surface p-2.5 border border-border shadow-xs"
                          >
                            <div className="relative h-20 w-full overflow-hidden rounded-lg bg-arena/50 p-1">
                              <img src={prod.imagen} alt={prod.nombre} className="h-full w-full object-contain" />
                            </div>
                            <p className="text-xs font-medium font-serif text-chocolate truncate">{prod.nombre}</p>
                            <p className="text-[11px] font-semibold text-terracota">{formatPrecio(prod.precio)}</p>
                            <button
                              type="button"
                              onClick={() => {
                                addItem({
                                  productoId: prod.id,
                                  slug: prod.slug,
                                  nombre: prod.nombre,
                                  imagenUrl: prod.imagen,
                                  precioBase: prod.precio,
                                  esPersonalizable: prod.esPersonalizable,
                                  personalizado: false,
                                  stockDisponible: prod.stockDisponible,
                                });
                              }}
                              className="mt-1 w-full rounded-full bg-arena py-1 text-[11px] font-semibold text-chocolate hover:bg-terracota hover:text-white transition-colors border border-border/40"
                            >
                              + Agregar
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Encargos Tab Content */
                <>
                  {encargoItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                      <span className="text-4xl">🎨</span>
                      <p className="text-lg font-serif font-medium text-chocolate">Sin encargos en la bolsa</p>
                      <p className="text-xs text-muted max-w-xs leading-relaxed font-sans">
                        Explorá las piezas en el catálogo y presioná &quot;Encargar esta pieza&quot; para sumar tus encargos a medida.
                      </p>
                      {items.length > 0 && (
                        <Button
                          variant="outline"
                          onClick={() => setActiveTab("stock")}
                          className="rounded-xl text-xs mt-2"
                        >
                          Ver tus piezas en stock ({items.length}) →
                        </Button>
                      )}
                    </div>
                  ) : !isEncargosFormOpen ? (
                    <ul className="space-y-3">
                      {encargoItems.map((it) => (
                        <li
                          key={it.id}
                          className="flex gap-3.5 rounded-2xl bg-surface p-3 border border-border shadow-xs transition-all hover:border-admin-accent/40"
                        >
                          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-arena/50 p-1 border border-border/40">
                            {it.imagenUrl ? (
                              <Image
                                src={it.imagenUrl}
                                alt={it.nombre}
                                fill
                                className="object-cover rounded-lg"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-2xl">
                                🏺
                              </div>
                            )}
                          </div>

                          <div className="flex flex-1 flex-col justify-between py-0.5 min-w-0">
                            <div>
                              <div className="flex items-start justify-between gap-1">
                                <h3 className="text-sm font-medium font-serif text-chocolate leading-snug truncate">
                                  {it.nombre}
                                </h3>
                                <button
                                  type="button"
                                  onClick={() => removeEncargoItem(it.id)}
                                  className="text-muted hover:text-terracota transition-colors p-0.5 text-xs"
                                >
                                  ✕
                                </button>
                              </div>

                              <div className="text-[11px] font-sans text-muted space-y-0.5 pt-1">
                                {it.medidaSeleccionada && (
                                  <p>📐 Medida: <strong className="text-chocolate font-semibold">{it.medidaSeleccionada}</strong></p>
                                )}
                                {it.conMarco && (
                                  <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                    ✓ Marco artesanal (+{formatPrecio(it.adicionalMarco)})
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
                            </div>

                            <div className="flex items-center justify-between pt-2">
                              <span className="text-sm font-semibold font-sans text-admin-accent">
                                {formatPrecio(it.precioUnitarioFinal * it.cantidad)}
                              </span>

                              <div className="flex items-center rounded-lg border border-border bg-arena/40">
                                <button
                                  type="button"
                                  onClick={() => updateEncargoQuantity(it.id, it.cantidad - 1)}
                                  className="flex h-6 w-6 items-center justify-center text-xs font-semibold text-chocolate hover:bg-surface transition-colors"
                                >
                                  −
                                </button>
                                <span className="w-5 text-center text-xs font-semibold text-chocolate">
                                  {it.cantidad}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateEncargoQuantity(it.id, it.cantidad + 1)}
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
                    /* Form for Encargos */
                    <form onSubmit={handleSubmitEncargos} className="space-y-4">
                      <button
                        type="button"
                        onClick={() => setIsEncargosFormOpen(false)}
                        className="text-xs text-admin-accent font-semibold flex items-center gap-1 hover:underline"
                      >
                        ← Volver a revisar encargos
                      </button>

                      {encargosError && (
                        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600">
                          {encargosError}
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
                        className="w-full bg-[#25D366] text-white hover:bg-[#20bd5a] flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold shadow-xs mt-4"
                      >
                        <WhatsAppIcon className="h-5 w-5 fill-current" />
                        <span>{isPending ? "Enviando encargos..." : "Solicitar por WhatsApp"}</span>
                      </Button>
                    </form>
                  )}
                </>
              )}
            </div>

            {/* Footer Panel */}
            {activeTab === "stock" && items.length > 0 && (
              <div className="border-t border-border bg-arena/60 p-5 space-y-3 backdrop-blur-sm">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted font-sans">Subtotal de piezas</span>
                  <span className="text-lg font-semibold font-serif text-chocolate">
                    {formatPrecio(subtotalStock)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCheckoutStock}
                  className="w-full rounded-full bg-terracota py-3.5 text-center text-sm font-semibold text-white shadow-xs transition-all hover:bg-terracota/90 hover:-translate-y-0.5 active:scale-[0.98]"
                >
                  Proceder con la compra →
                </button>
              </div>
            )}

            {activeTab === "encargos" && encargoItems.length > 0 && !isEncargosFormOpen && (
              <div className="border-t border-border bg-arena/60 p-5 space-y-3 backdrop-blur-sm">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted font-sans">Total Estimado ({totalEncargosCount} ítems)</span>
                  <span className="text-lg font-semibold font-serif text-chocolate">
                    {formatPrecio(totalEncargosPrice)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEncargosFormOpen(true)}
                  className="w-full rounded-full bg-admin-accent py-3.5 text-center text-sm font-semibold text-white shadow-xs transition-all hover:bg-admin-accent-hover hover:-translate-y-0.5 active:scale-[0.98]"
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
