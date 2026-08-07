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

/**
 * Algoritmo de Cotización por Proximidad Geográfica (Vía Cargo) desde Sunchales, Santa Fe.
 * Determina automáticamente el costo aproximado de envío según la Provincia o Ciudad seleccionada.
 */
export function calcularTarifaPorProvincia(
  provincia: string,
  tipoEnvio: TipoEnvio,
): { precio: number; regionNombre: string } {
  if (!provincia) {
    return {
      precio: tipoEnvio === "agencia" ? 17000 : 25000,
      regionNombre: "Selecciona tu provincia",
    };
  }

  const provNorm = provincia.trim().toLowerCase();

  // 1. Origen / Cercanía (Provincia de Santa Fe)
  if (provNorm.includes("santa fe")) {
    return {
      precio: tipoEnvio === "agencia" ? 15000 : 22000,
      regionNombre: "Santa Fe (Cercanía Local)",
    };
  }

  // 2. Zona Centro (CABA, Buenos Aires, Córdoba, Entre Ríos, San Luis)
  const centroProvincias = [
    "buenos aires",
    "caba",
    "ciudad autonoma",
    "cordoba",
    "córdoba",
    "entre rios",
    "entre ríos",
    "san luis",
  ];
  if (centroProvincias.some((p) => provNorm.includes(p))) {
    return {
      precio: tipoEnvio === "agencia" ? 17000 : 25000,
      regionNombre: "Zona Centro Argentina",
    };
  }

  // 3. Zona Norte y Cuyo (Misiones, Salta, Jujuy, Chaco, Formosa, Corrientes, Tucumán, Catamarca, La Rioja, Santiago del Estero, San Juan, Mendoza)
  const norteCuyoProvincias = [
    "misiones",
    "salta",
    "jujuy",
    "chaco",
    "formosa",
    "corrientes",
    "tucuman",
    "tucumán",
    "catamarca",
    "la rioja",
    "santiago del estero",
    "san juan",
    "mendoza",
  ];
  if (norteCuyoProvincias.some((p) => provNorm.includes(p))) {
    return {
      precio: tipoEnvio === "agencia" ? 20000 : 28000,
      regionNombre: "Zona Norte / Cuyo",
    };
  }

  // 4. Zona Patagonia / Sur (Río Negro, Neuquén, Chubut, Santa Cruz, Tierra del Fuego)
  const surProvincias = [
    "rio negro",
    "río negro",
    "neuquen",
    "neuquén",
    "chubut",
    "santa cruz",
    "tierra del fuego",
  ];
  if (surProvincias.some((p) => provNorm.includes(p))) {
    return {
      precio: tipoEnvio === "agencia" ? 24000 : 32000,
      regionNombre: "Zona Patagonia / Sur",
    };
  }

  // Default fallback (Zona Centro)
  return {
    precio: tipoEnvio === "agencia" ? 17000 : 25000,
    regionNombre: "Argentina (Tarifa General)",
  };
}

/**
 * Busca si existe una zona personalizada en BD (ej: Bariloche, Puerto Madryn).
 * Si no existe, aplica el Algoritmo Inteligente por Proximidad de Provincia.
 */
export function obtenerCostoAutomaticoProximidad(
  provincia: string,
  ciudad: string,
  tipoEnvio: TipoEnvio,
  zonasExistentes: ZonaLogistica[],
): { precio: number; regionNombre: string; esPersonalizada: boolean } {
  // Check if city or province matches a specific custom zone in DB
  const ciudadNorm = ciudad.trim().toLowerCase();
  const provNorm = provincia.trim().toLowerCase();

  const zonaEncontrada = zonasExistentes.find((z) => {
    const name = z.zona_nombre.toLowerCase();
    return (
      (ciudadNorm && name.includes(ciudadNorm)) ||
      (provNorm && name.includes(provNorm))
    );
  });

  if (zonaEncontrada) {
    return {
      precio: tipoEnvio === "agencia" ? zonaEncontrada.precio_agencia : zonaEncontrada.precio_domicilio,
      regionNombre: zonaEncontrada.zona_nombre,
      esPersonalizada: true,
    };
  }

  // Otherwise calculate with automatic proximity algorithm
  const auto = calcularTarifaPorProvincia(provincia, tipoEnvio);
  return {
    precio: auto.precio,
    regionNombre: auto.regionNombre,
    esPersonalizada: false,
  };
}
