"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { bulkAdjustZonasAction } from "@/lib/actions";

export function BulkAdjustShippingForm() {
  const [porcentaje, setPorcentaje] = useState<string>("");
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleApply = (pctValue: number) => {
    if (isNaN(pctValue) || pctValue === 0) return;
    const sign = pctValue > 0 ? "+" : "";
    if (
      !confirm(
        `¿Confirmás ajustar TODAS las tarifas de envío un ${sign}${pctValue}%?\nEsto modificará automáticamente los valores de Agencia y Domicilio de las zonas registradas.`
      )
    ) {
      return;
    }

    startTransition(async () => {
      setMsg(null);
      const res = await bulkAdjustZonasAction(pctValue);
      if (res.success) {
        setMsg({
          text: `¡Tarifas ajustadas un ${sign}${pctValue}% correctamente en ${res.count ?? 0} zonas!`,
          type: "success",
        });
        setPorcentaje("");
      } else {
        setMsg({ text: res.error ?? "Error al actualizar tarifas", type: "error" });
      }
    });
  };

  return (
    <div className="mb-6 rounded-2xl border border-border/80 bg-surface p-5 space-y-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div>
          <h2 className="text-base font-semibold flex items-center gap-2 text-chocolate">
            <span>📈</span>
            <span>Aumento / Ajuste Masivo de Tarifas (Vía Cargo)</span>
          </h2>
          <p className="text-xs text-muted">
            Modificá todas las zonas registradas de forma simultánea aplicando un porcentaje global de ajuste.
          </p>
        </div>
      </div>

      {msg && (
        <div
          className={`rounded-xl p-3 text-xs font-medium ${
            msg.type === "success"
              ? "bg-verde-menta/20 text-chocolate border border-verde-menta/40"
              : "bg-red-500/10 text-red-600 border border-red-500/30"
          }`}
        >
          {msg.text}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-barro">Acceso rápido:</span>
        {["+5%", "+10%", "+15%", "+20%", "+25%", "+30%"].map((preset) => {
          const val = parseFloat(preset.replace("%", "").replace("+", ""));
          return (
            <button
              key={preset}
              type="button"
              onClick={() => handleApply(val)}
              disabled={pending}
              className="rounded-lg border border-border bg-arena/40 px-3 py-1.5 text-xs font-semibold text-chocolate hover:bg-terracota hover:text-white transition-all disabled:opacity-50"
            >
              {preset}
            </button>
          );
        })}
      </div>

      <div className="flex items-end gap-3 pt-1">
        <div className="flex-1 max-w-xs">
          <Label htmlFor="porcentajeAjuste" className="text-xs">
            Porcentaje personalizado (%):
          </Label>
          <Input
            id="porcentajeAjuste"
            type="number"
            step="0.1"
            placeholder="ej. 12.5 (aumento) o -5 (descuento)"
            value={porcentaje}
            onChange={(e) => setPorcentaje(e.target.value)}
          />
        </div>
        <Button
          type="button"
          onClick={() => handleApply(parseFloat(porcentaje))}
          disabled={!porcentaje || isNaN(parseFloat(porcentaje)) || pending}
          isLoading={pending}
          className="bg-admin-accent hover:bg-admin-accent/90 text-white"
        >
          Aplicar Ajuste
        </Button>
      </div>
    </div>
  );
}
