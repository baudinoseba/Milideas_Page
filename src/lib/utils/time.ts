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

/** Formatea la fecha y tiempo restante de vencimiento de pago para el panel admin. */
export function formatTiempoRestanteVencimiento(
  isoDate: string,
  nowMs: number = Date.now(),
): string {
  if (!isoDate) return "";
  const fecha = new Date(isoDate);
  const diffMs = fecha.getTime() - nowMs;
  const horasRestantes = diffMs / (1000 * 60 * 60);

  const dia = fecha.getDate();
  const mes = fecha.getMonth() + 1;
  const horaStr = fecha.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (diffMs <= 0) {
    return `Venció el ${dia}/${mes} ${horaStr} hs`;
  }

  const horas = Math.floor(horasRestantes);
  const minutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (horas < 1) {
    return `Vence hoy ${horaStr} hs (${minutos} min)`;
  }
  if (horas < 24) {
    return `Vence hoy ${horaStr} hs (${horas}h ${minutos}m)`;
  }
  const dias = Math.floor(horas / 24);
  const horasModulo = horas % 24;
  return `Vence ${dia}/${mes} ${horaStr} hs (${dias}d ${horasModulo}h)`;
}
