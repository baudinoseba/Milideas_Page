/** Calcula horas restantes hasta una fecha ISO dada. */
export function getHoursUntil(isoDate: string, nowMs: number): number {
  return (new Date(isoDate).getTime() - nowMs) / (1000 * 60 * 60);
}

/** Indica si un pedido pendiente vence en menos de 24 horas. */
export function isPedidoProximoAVencer(
  estado: string,
  fechaLimitePago: string,
  nowMs: number,
): boolean {
  if (estado !== "pendiente_pago") return false;
  const horas = getHoursUntil(fechaLimitePago, nowMs);
  return horas > 0 && horas < 24;
}
