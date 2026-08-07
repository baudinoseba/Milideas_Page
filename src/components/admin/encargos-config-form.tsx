"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { formatPrecio } from "@/lib/pricing";
import { saveConfiguracionEncargosAction } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BackButton } from "@/components/ui/back-button";
import type { ConfiguracionEncargos, MedidaIlustracion } from "@/types";

export function EncargosConfigForm({ initialConfig }: { initialConfig: ConfiguracionEncargos }) {
  const [isPending, startTransition] = useTransition();
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [precioMarco, setPrecioMarco] = useState(initialConfig.precio_marco_madera ?? 8500);
  const [porcentajeRecargo, setPorcentajeRecargo] = useState(
    (initialConfig.porcentaje_recargo_personalizado ?? 0.15) * 100,
  );
  const [demoraDefault, setDemoraDefault] = useState(initialConfig.demora_default_dias ?? 15);

  const [medidas, setMedidas] = useState<MedidaIlustracion[]>(
    initialConfig.medidas_ilustraciones ?? [
      { id: "a4", nombre: "A4 (21 x 30 cm)", recargo: 0 },
      { id: "a3", nombre: "A3 (30 x 42 cm)", recargo: 5000 },
      { id: "large", nombre: "Grand Format (50 x 70 cm)", recargo: 12000 },
    ],
  );

  const [nuevaMedidaNombre, setNuevaMedidaNombre] = useState("");
  const [nuevaMedidaRecargo, setNuevaMedidaRecargo] = useState(0);

  const handleAgregarMedida = () => {
    if (!nuevaMedidaNombre.trim()) return;
    const newId = `m-${Date.now()}`;
    setMedidas((prev) => [
      ...prev,
      { id: newId, nombre: nuevaMedidaNombre.trim(), recargo: Number(nuevaMedidaRecargo) || 0 },
    ]);
    setNuevaMedidaNombre("");
    setNuevaMedidaRecargo(0);
  };

  const handleEliminarMedida = (id: string) => {
    setMedidas((prev) => prev.filter((m) => m.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(false);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append("medidasJson", JSON.stringify(medidas));
    formData.append("precioMarcoMadera", String(precioMarco));
    formData.append("porcentajeRecargoPersonalizado", String(porcentajeRecargo / 100));
    formData.append("demoraDefaultDias", String(demoraDefault));

    startTransition(async () => {
      const res = await saveConfiguracionEncargosAction(formData);
      if (!res.success) {
        setErrorMsg(res.error || "Error al guardar la configuración.");
      } else {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between border-b border-border/60 pb-4">
        <div>
          <BackButton fallbackHref="/admin/encargos">Volver a Encargos</BackButton>
          <h1 className="text-2xl font-serif font-medium text-chocolate mt-2">
            Configuración de Encargos
          </h1>
          <p className="text-xs text-muted font-sans">
            Administrá las medidas de ilustraciones, precios de enmarcado y recargos
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
          ✓ Configuración guardada correctamente.
        </div>
      )}

      {errorMsg && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs font-semibold text-red-600">
          {errorMsg}
        </div>
      )}

      {/* General Commission Parameters */}
      <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
        <h3 className="text-sm font-semibold text-chocolate">Tarifas y Tiempos de Encargo</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="precioMarco" className="text-xs text-muted">
              Precio Marco Madera (ARS)
            </Label>
            <Input
              id="precioMarco"
              type="number"
              value={precioMarco}
              onChange={(e) => setPrecioMarco(Number(e.target.value))}
              placeholder="8500"
            />
          </div>

          <div>
            <Label htmlFor="porcentajeRecargo" className="text-xs text-muted">
              Recargo Personalización (%)
            </Label>
            <Input
              id="porcentajeRecargo"
              type="number"
              value={porcentajeRecargo}
              onChange={(e) => setPorcentajeRecargo(Number(e.target.value))}
              placeholder="15"
            />
          </div>

          <div>
            <Label htmlFor="demoraDefault" className="text-xs text-muted">
              Demora Default (Días)
            </Label>
            <Input
              id="demoraDefault"
              type="number"
              value={demoraDefault}
              onChange={(e) => setDemoraDefault(Number(e.target.value))}
              placeholder="15"
            />
          </div>
        </div>
      </div>

      {/* Ilustración Sizes Config */}
      <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
        <h3 className="text-sm font-semibold text-chocolate">Medidas Disponibles para Ilustraciones</h3>

        <div className="space-y-2">
          {medidas.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-arena/20 p-3 text-xs"
            >
              <div>
                <span className="font-semibold text-chocolate">{m.nombre}</span>
                <span className="text-muted ml-2">
                  Adicional: {m.recargo > 0 ? formatPrecio(m.recargo) : "Sin recargo"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleEliminarMedida(m.id)}
                className="text-red-500 hover:text-red-700 font-bold px-2 py-1"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>

        {/* Add New Size Inline Form */}
        <div className="pt-3 border-t border-border/40 space-y-2">
          <Label className="text-xs font-semibold text-muted">Agregar Nueva Medida</Label>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <div className="sm:col-span-7">
              <Input
                placeholder="ej. A2 (42 x 60 cm)"
                value={nuevaMedidaNombre}
                onChange={(e) => setNuevaMedidaNombre(e.target.value)}
              />
            </div>
            <div className="sm:col-span-3">
              <Input
                type="number"
                placeholder="Recargo ($)"
                value={nuevaMedidaRecargo}
                onChange={(e) => setNuevaMedidaRecargo(Number(e.target.value))}
              />
            </div>
            <div className="sm:col-span-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleAgregarMedida}
                className="w-full text-xs font-semibold"
              >
                + Añadir
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="w-full py-3.5 bg-admin-accent text-white hover:bg-admin-accent-hover rounded-xl font-semibold shadow-md"
      >
        {isPending ? "Guardando..." : "Guardar Configuración"}
      </Button>
    </form>
  );
}
