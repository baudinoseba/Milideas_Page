"use client";

import { useState, useTransition } from "react";
import { saveConfiguracionEncargosAction } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BackButton } from "@/components/ui/back-button";
import { toast } from "@/stores/toast-store";
import type { ConfiguracionEncargos } from "@/types";

export function EncargosConfigForm({ initialConfig }: { initialConfig: ConfiguracionEncargos }) {
  const [isPending, startTransition] = useTransition();

  const [porcentajeSena, setPorcentajeSena] = useState(
    Math.round((initialConfig.porcentaje_sena ?? 0.2) * 100),
  );
  const [porcentajeRecargo, setPorcentajeRecargo] = useState(
    Math.round((initialConfig.porcentaje_recargo_personalizado ?? 0.15) * 100),
  );
  const [demoraDefault, setDemoraDefault] = useState(initialConfig.demora_default_dias ?? 30);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("porcentajeSena", String(porcentajeSena / 100));
    formData.append("porcentajeRecargoPersonalizado", String(porcentajeRecargo / 100));
    formData.append("demoraDefaultDias", String(demoraDefault));

    startTransition(async () => {
      const res = await saveConfiguracionEncargosAction(formData);
      if (!res.success) {
        toast.error(res.error || "Error al guardar la configuración.");
      } else {
        toast.success("Configuración de encargos guardada con éxito");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between border-b border-border/60 pb-4">
        <div>
          <BackButton fallbackHref="/admin/encargos">Volver a Encargos</BackButton>
          <h1 className="text-2xl font-serif font-medium text-chocolate mt-2">
            Configuración de Encargos
          </h1>
          <p className="text-xs text-muted font-sans">
            Ajustá el porcentaje de seña, recargo por personalización y tiempos estándar de producción
          </p>
        </div>
      </div>

      {/* General Commission Parameters */}
      <div className="rounded-3xl border border-border/80 bg-surface p-6 space-y-5 shadow-xs">
        <h3 className="text-sm font-semibold text-chocolate flex items-center gap-2">
          <span>⚙️</span>
          <span>Parámetros de Encargos en Taller</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Porcentaje Seña */}
          <div className="space-y-1.5 bg-arena/20 p-4 rounded-2xl border border-border/50 flex flex-col justify-between">
            <div>
              <Label htmlFor="porcentajeSena" className="text-xs font-semibold text-foreground block">
                Seña Requerida (%)
              </Label>
              <p className="text-[11px] text-muted mt-1 leading-snug">
                Porcentaje solicitado al cliente para reservar e iniciar el trabajo.
              </p>
            </div>
            <div className="relative mt-3">
              <Input
                id="porcentajeSena"
                type="number"
                min={1}
                max={100}
                value={porcentajeSena}
                onChange={(e) => setPorcentajeSena(Number(e.target.value))}
                placeholder="20"
                className="text-xs rounded-xl bg-surface pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted">%</span>
            </div>
          </div>

          {/* Recargo Personalización */}
          <div className="space-y-1.5 bg-arena/20 p-4 rounded-2xl border border-border/50 flex flex-col justify-between">
            <div>
              <Label htmlFor="porcentajeRecargo" className="text-xs font-semibold text-foreground block">
                Recargo Personalizado (%)
              </Label>
              <p className="text-[11px] text-muted mt-1 leading-snug">
                Adicional por piezas a medida con diseño o grabado custom.
              </p>
            </div>
            <div className="relative mt-3">
              <Input
                id="porcentajeRecargo"
                type="number"
                min={0}
                max={100}
                value={porcentajeRecargo}
                onChange={(e) => setPorcentajeRecargo(Number(e.target.value))}
                placeholder="15"
                className="text-xs rounded-xl bg-surface pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted">%</span>
            </div>
          </div>

          {/* Demora Default */}
          <div className="space-y-1.5 bg-arena/20 p-4 rounded-2xl border border-border/50 flex flex-col justify-between">
            <div>
              <Label htmlFor="demoraDefault" className="text-xs font-semibold text-foreground block">
                Demora Estándar (Días)
              </Label>
              <p className="text-[11px] text-muted mt-1 leading-snug">
                Días hábiles promedio sugeridos al aceptar un nuevo encargo.
              </p>
            </div>
            <div className="relative mt-3">
              <Input
                id="demoraDefault"
                type="number"
                min={1}
                value={demoraDefault}
                onChange={(e) => setDemoraDefault(Number(e.target.value))}
                placeholder="30"
                className="text-xs rounded-xl bg-surface pr-14"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted font-medium">días</span>
            </div>
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="w-full py-3.5 bg-admin-accent text-white hover:bg-admin-accent-hover rounded-xl font-semibold shadow-md min-h-11 cursor-pointer"
      >
        {isPending ? "Guardando..." : "Guardar Configuración"}
      </Button>
    </form>
  );
}
