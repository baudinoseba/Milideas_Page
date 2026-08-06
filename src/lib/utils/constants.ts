export const APP_NAME = "Milideas";
export const APP_DESCRIPTION =
  "Cerámica de autor y arte. Lanzamientos mensuales y piezas únicas.";

export const PERSONALIZATION_SURCHARGE = 0.15;
export const TRANSFER_DISCOUNT = 0.2;

export const WHOLESALE_TIERS = [
  { minPieces: 35, discount: 0.2 },
  { minPieces: 20, discount: 0.15 },
  { minPieces: 15, discount: 0.1 },
] as const;

export const PAYMENT_GRACE_HOURS = 24;

export const NAV_LINKS = [
  { href: "/catalogo", label: "Catálogo" },
  { href: "/drops", label: "Drops" },
] as const;
