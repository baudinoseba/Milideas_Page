import type { TipoEnvio, ZonaLogistica } from "@/types";

export function calcularCostoEnvio(
  zona: Pick<ZonaLogistica, "precio_agencia" | "precio_domicilio">,
  tipoEnvio: TipoEnvio,
): number {
  return tipoEnvio === "agencia" ? zona.precio_agencia : zona.precio_domicilio;
}

export function getTipoEnvioLabel(tipo: TipoEnvio): string {
  return tipo === "agencia" ? "Retiro en agencia" : "Envío a domicilio";
}
