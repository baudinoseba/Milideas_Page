export const APP_NAME = "Milideas";
export const APP_DESCRIPTION =
  "Cerámica de autor y arte. Lanzamientos y piezas únicas.";

export const PERSONALIZATION_SURCHARGE = 0.15;
export const TRANSFER_DISCOUNT = 0;

export const WHOLESALE_TIERS = [
  { minPieces: 35, discount: 0.2 },
  { minPieces: 20, discount: 0.15 },
  { minPieces: 15, discount: 0.1 },
] as const;

export const PAYMENT_GRACE_HOURS = 24;

export const NAV_LINKS = [
  { href: "/catalogo/ceramica", label: "🏺 Cerámica" },
  { href: "/catalogo/esculturas", label: "🗿 Esculturas" },
  { href: "/catalogo/ilustraciones", label: "🎨 Ilustraciones" },
  { href: "/colecciones", label: "✨ Colecciones" },
] as const;
