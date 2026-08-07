"use client";

import { useState, useTransition } from "react";
import type { ProductoConImagenes, ConfiguracionEncargos, TipoCatalogo } from "@/types";
import { formatPrecio } from "@/lib/pricing";
import { crearEncargoAction } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";

interface EncargoModalProps {
  producto: ProductoConImagenes;
  config: ConfiguracionEncargos;
  isOpen: boolean;
  onClose: () => void;
}

export function EncargoModal({
  producto,
  config,
  isOpen,
  onClose,
}: EncargoModalProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const tipoCatalogo: TipoCatalogo = ((producto as any).tipo_catalogo as TipoCatalogo) || "ceramica";
  const precioBase = producto.precio_base;

  // Customization state
  const [esPersonalizado, setEsPersonalizado] = useState(false);
  const [detallePersonalizacion, setDetallePersonalizacion] = useState("");

  // Ilustración specific state
  const medidas = config.medidas_ilustraciones ?? [
    { id: "a4", nombre: "A4 (21 x 30 cm)", recargo: 0 },
    { id: "a3", nombre: "A3 (30 x 42 cm)", recargo: 5000 },
  ];
  const [medidaSeleccionada, setMedidaSeleccionada] = useState(medidas[0]?.nombre ?? "A4");
  const [conMarco, setConMarco] = useState(false);

  // Customer contact state
  const [nombreContacto, setNombreContacto] = useState("");
  const [whatsappContacto, setWhatsappContacto] = useState("");
  const [emailContacto, setEmailContacto] = useState("");
  const [metodoEntrega, setMetodoEntrega] = useState<"taller" | "domicilio" | "agencia">("taller");

  // Shipping details state
  const [calle, setCalle] = useState("");
  const [numero, setNumero] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [codigoPostal, setCodigoPostal] = useState("");
  const [referencia, setReferencia] = useState("");

  // Calculations
  const recargoPersonalizadoCalculado = esPersonalizado
    ? Math.round(precioBase * (config.porcentaje_recargo_personalizado ?? 0.15))
    : 0;

  const medidaObj = medidas.find((m) => m.nombre === medidaSeleccionada);
  const adicionalMedidaCalculado = tipoCatalogo === "ilustraciones" ? (medidaObj?.recargo ?? 0) : 0;
  const adicionalMarcoCalculado = (tipoCatalogo === "ilustraciones" && conMarco) ? (config.precio_marco_madera ?? 8500) : 0;

  const totalEstimado = precioBase + recargoPersonalizadoCalculado + adicionalMedidaCalculado + adicionalMarcoCalculado;

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreContacto.trim() || !whatsappContacto.trim()) {
      setErrorMsg("Por favor completá tu nombre y WhatsApp.");
      return;
    }

    setErrorMsg(null);
    const formData = new FormData();
    formData.append("productoId", producto.id);
    formData.append("nombreContacto", nombreContacto);
    formData.append("whatsappContacto", whatsappContacto);
    formData.append("emailContacto", emailContacto);
    formData.append("tipoCatalogo", tipoCatalogo);
    formData.append("esPersonalizado", String(esPersonalizado));
    formData.append("detallePersonalizacion", detallePersonalizacion);
    formData.append("medidaSeleccionada", medidaSeleccionada);
    formData.append("conMarco", String(conMarco));
    formData.append("metodoEntrega", metodoEntrega);

    formData.append("precioEstimado", String(precioBase));
    formData.append("recargoPersonalizado", String(recargoPersonalizadoCalculado));
    formData.append("adicionalMedida", String(adicionalMedidaCalculado));
    formData.append("adicionalMarco", String(adicionalMarcoCalculado));
    formData.append("totalEstimado", String(totalEstimado));

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

      // Build WhatsApp message
      let especificacionesText = "";
      if (tipoCatalogo === "ilustraciones") {
        especificacionesText += `\n- *Medida:* ${medidaSeleccionada}`;
        especificacionesText += `\n- *Marco:* ${conMarco ? `Con marco de madera artesanal (+${formatPrecio(adicionalMarcoCalculado)})` : "Sin marco"}`;
      }

      if (esPersonalizado) {
        especificacionesText += `\n- *Personalización (+15%):* Sí (+${formatPrecio(recargoPersonalizadoCalculado)})`;
        if (detallePersonalizacion) {
          especificacionesText += `\n  *Detalle:* ${detallePersonalizacion}`;
        }
      }

      let entregaText = "*Entrega:* Retiro en Taller (Sunchales)";
      if (metodoEntrega === "domicilio") {
        entregaText = `*Entrega:* Envío a Domicilio Vía Cargo (${ciudad})`;
      } else if (metodoEntrega === "agencia") {
        entregaText = `*Entrega:* Retiro en Sucursal Vía Cargo (${ciudad})`;
      }

      const text = `*MILIDEAS ARTE - SOLICITUD DE ENCARGO*

--------------------------------
*Pieza:* ${producto.nombre} (${tipoCatalogo.toUpperCase()})
*Precio Base:* ${formatPrecio(precioBase)}${especificacionesText}

--------------------------------
*TOTAL ESTIMADO:* ${formatPrecio(totalEstimado)}

--------------------------------
*DATOS DEL CLIENTE:*
*Nombre:* ${nombreContacto}
*WhatsApp:* ${whatsappContacto}
${emailContacto ? `*Email:* ${emailContacto}\n` : ""}${entregaText}

--------------------------------
¡Hola Mili! Quisiera encargar esta pieza. Quedo a la espera de la confirmación y tiempo estimado de producción.`;

      const vendorWhatsapp = process.env.NEXT_PUBLIC_VENDOR_WHATSAPP || "5493493668308";
      const waUrl = `https://wa.me/${vendorWhatsapp}?text=${encodeURIComponent(text)}`;

      window.open(waUrl, "_blank");
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-border/80 bg-surface/90 px-6 py-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-admin-accent">
              Solicitud de Encargo Especial
            </span>
            <h3 className="text-lg font-semibold text-foreground truncate">
              {producto.nombre}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-muted hover:bg-arena hover:text-foreground transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400">
              {errorMsg}
            </div>
          )}

          {/* Catalog specific configuration */}
          {tipoCatalogo === "ilustraciones" && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 space-y-3">
              <Label className="text-xs font-semibold text-chocolate">
                🎨 Configuración de Ilustración
              </Label>
              <div>
                <Label htmlFor="medida" className="text-xs text-muted">Tamaño de Lámina</Label>
                <select
                  id="medida"
                  value={medidaSeleccionada}
                  onChange={(e) => setMedidaSeleccionada(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-admin-accent focus:outline-none"
                >
                  {medidas.map((m) => (
                    <option key={m.id} value={m.nombre}>
                      {m.nombre} {m.recargo > 0 ? `(+${formatPrecio(m.recargo)})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="conMarco"
                  checked={conMarco}
                  onChange={(e) => setConMarco(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-admin-accent cursor-pointer"
                />
                <Label htmlFor="conMarco" className="text-xs cursor-pointer">
                  Incluir enmarcado en madera artesanal (+{formatPrecio(config.precio_marco_madera ?? 8500)})
                </Label>
              </div>
            </div>
          )}

          {/* Personalization option (+15%) */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="esPersonalizado"
                checked={esPersonalizado}
                onChange={(e) => setEsPersonalizado(e.target.checked)}
                className="h-4 w-4 rounded border-border text-admin-accent cursor-pointer"
              />
              <Label htmlFor="esPersonalizado" className="text-sm font-semibold cursor-pointer text-chocolate">
                ✨ ¿Deseás personalizar esta pieza? (+15%)
              </Label>
            </div>
            {esPersonalizado && (
              <div>
                <Label htmlFor="detallePersonalizacion" className="text-xs text-muted">
                  Detalle del grabado, nombre, fecha o motivo especial
                </Label>
                <Textarea
                  id="detallePersonalizacion"
                  placeholder="ej. Inscribir iniciales M&S y fecha 15/09"
                  value={detallePersonalizacion}
                  onChange={(e) => setDetallePersonalizacion(e.target.value)}
                  rows={2}
                  className="mt-1"
                />
              </div>
            )}
          </div>

          {/* Customer contact fields */}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          </div>

          {/* Delivery option */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted font-sans">
              Método de Entrega
            </Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMetodoEntrega("taller")}
                className={`rounded-lg border p-2 text-center text-xs font-medium transition-colors ${
                  metodoEntrega === "taller"
                    ? "border-admin-accent bg-admin-accent/10 text-admin-accent font-semibold"
                    : "border-border bg-surface text-muted hover:border-muted"
                }`}
              >
                🏪 Retiro Taller
              </button>
              <button
                type="button"
                onClick={() => setMetodoEntrega("agencia")}
                className={`rounded-lg border p-2 text-center text-xs font-medium transition-colors ${
                  metodoEntrega === "agencia"
                    ? "border-admin-accent bg-admin-accent/10 text-admin-accent font-semibold"
                    : "border-border bg-surface text-muted hover:border-muted"
                }`}
              >
                📦 Sucursal Cargo
              </button>
              <button
                type="button"
                onClick={() => setMetodoEntrega("domicilio")}
                className={`rounded-lg border p-2 text-center text-xs font-medium transition-colors ${
                  metodoEntrega === "domicilio"
                    ? "border-admin-accent bg-admin-accent/10 text-admin-accent font-semibold"
                    : "border-border bg-surface text-muted hover:border-muted"
                }`}
              >
                🏠 A Domicilio
              </button>
            </div>

            {metodoEntrega !== "taller" && (
              <div className="space-y-2 pt-1">
                <Label htmlFor="ciudadEnvio" className="text-xs text-muted">Ciudad / Localidad</Label>
                <Input
                  id="ciudadEnvio"
                  placeholder="ej. Rosario, Santa Fe"
                  value={ciudad}
                  onChange={(e) => setCiudad(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Price summary */}
          <div className="rounded-xl border border-border bg-arena/30 p-4 space-y-2 text-sm">
            <div className="flex justify-between text-muted text-xs">
              <span>Precio Base:</span>
              <span>{formatPrecio(precioBase)}</span>
            </div>
            {adicionalMedidaCalculado > 0 && (
              <div className="flex justify-between text-muted text-xs">
                <span>Adicional Medida ({medidaSeleccionada}):</span>
                <span>+{formatPrecio(adicionalMedidaCalculado)}</span>
              </div>
            )}
            {adicionalMarcoCalculado > 0 && (
              <div className="flex justify-between text-muted text-xs">
                <span>Marco de Madera:</span>
                <span>+{formatPrecio(adicionalMarcoCalculado)}</span>
              </div>
            )}
            {recargoPersonalizadoCalculado > 0 && (
              <div className="flex justify-between text-muted text-xs">
                <span>Personalización (+15%):</span>
                <span>+{formatPrecio(recargoPersonalizadoCalculado)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-border/60 pt-2 font-bold text-foreground text-base">
              <span>Total Estimado:</span>
              <span className="text-admin-accent">{formatPrecio(totalEstimado)}</span>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-[#25D366] text-white hover:bg-[#20bd5a] flex items-center justify-center gap-2 py-3 rounded-xl font-semibold shadow-md transition-transform active:scale-[0.98]"
          >
            <WhatsAppIcon className="h-5 w-5 fill-current" />
            <span>{isPending ? "Enviando solicitud..." : "Encargar por WhatsApp"}</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
