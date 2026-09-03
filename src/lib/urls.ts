/**
 * Módulo Centralizado de URLs y Rutas de Milideas
 * Resuelve dinámicamente el dominio base según el entorno:
 * - Producción (milideasarte.com.ar / vercel)
 * - Preview / Staging (ramas de test en Vercel)
 * - Desarrollo Local (localhost:3000)
 */

export function getBaseUrl(): string {
  // 1. Variable de entorno explícita (en producción o .env.local)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }

  // 2. En el navegador del cliente (resuelve automáticamente el dominio actual)
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  // 3. En servidores Vercel (URLs de ramas de test o previews)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // 4. Fallback estándar para desarrollo local
  return "http://localhost:3000";
}

/** URL base canónica del sitio para el entorno actual */
export const SITE_URL = getBaseUrl();

/**
 * Constantes de todas las rutas internas de la aplicación.
 * Permite cambiar cualquier ruta en un solo archivo.
 */
export const ROUTES = {
  HOME: "/",
  CERAMICA: {
    ROOT: "/ceramica",
    STOCK: "/ceramica/stock",
    CATALOGO: "/ceramica/catalogo",
    PORTFOLIO: "/ceramica/portfolio",
  },
  ILUSTRACION: {
    ROOT: "/ilustracion",
    STOCK: "/ilustracion/stock",
    CATALOGO: "/ilustracion/catalogo",
    PORTFOLIO: "/ilustracion/portfolio",
  },
  OBRAS: "/obras",
  SOBRE_MI: "/sobre-mi",
  CARRITO: "/carrito",
  CHECKOUT: "/checkout",
  CHECKOUT_EXITO: "/checkout/exito",
  AUTH: {
    LOGIN: "/login",
    REGISTRO: "/registro",
    RECUPERAR: "/recuperar",
  },
  CUENTA: {
    ROOT: "/cuenta",
    PERFIL: "/cuenta/perfil",
    PEDIDOS: "/cuenta/pedidos",
  },
  ADMIN: {
    ROOT: "/admin",
    VENTAS: "/admin/pedidos",
    ENCARGOS: "/admin/encargos",
    PRODUCTOS: "/admin/productos",
    CATEGORIAS: "/admin/categorias",
    CERAMICA: "/admin/ceramica",
    ILUSTRACION: "/admin/ilustracion",
    OBRAS: "/admin/obras",
    LOGISTICA: "/admin/logistica",
    PORTADA: "/admin/personalizacion",
  },
} as const;
