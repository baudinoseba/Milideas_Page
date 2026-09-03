import type { Tables, Enums } from "./database.types";

export type EstadoPedido = Enums<"estado_pedido">;
export type MetodoPago = Enums<"metodo_pago">;
export type TipoEnvio = Enums<"tipo_envio"> | "taller";
export type TipoRubro = "ceramica" | "ilustracion";
export type TipoCatalogo = "ceramica" | "esculturas" | "ilustraciones" | "ilustracion";

export const CATALOGO_DEFAULT_LABEL = {
  nombre: "Cerámica",
  titulo: "Catálogo de Cerámica Artesanal",
  emoji: "🏺",
  desc: "Piezas de autor únicas, moldeadas e ilustradas 100% a mano por Mili Ferrero en Sunchales. Obra original no producida en serie.",
};

export const CATALOGO_LABELS: Record<string, { nombre: string; titulo: string; emoji: string; desc: string }> = {
  ceramica: CATALOGO_DEFAULT_LABEL,
  ilustracion: {
    nombre: "Ilustración",
    titulo: "Catálogo de Ilustración & Arte Original",
    emoji: "🎨",
    desc: "Obras de arte, acuarelas y dibujos originales pintados a mano por Mili Ferrero en papel de alta calidad.",
  },
  ilustraciones: {
    nombre: "Ilustraciones",
    titulo: "Catálogo de Ilustración & Arte Original",
    emoji: "🎨",
    desc: "Obras de arte, acuarelas y dibujos originales pintados a mano por Mili Ferrero en papel de alta calidad.",
  },
  esculturas: {
    nombre: "Esculturas",
    titulo: "Esculturas y Obras de Autor",
    emoji: "🗿",
    desc: "Obras tridimensionales modeladas y pintadas a mano.",
  },
};

export function getCatalogoMeta(tipo?: string): { nombre: string; titulo: string; emoji: string; desc: string } {
  if (!tipo) return CATALOGO_DEFAULT_LABEL;
  return CATALOGO_LABELS[tipo] ?? CATALOGO_DEFAULT_LABEL;
}


export type Producto = Tables<"productos">;
export type ProductoImagen = Tables<"producto_imagenes">;
export type Categoria = Tables<"categorias">;
export type Pedido = Tables<"pedidos">;
export type ItemPedido = Tables<"items_pedido">;
export type Perfil = Tables<"perfiles">;
export type ZonaLogistica = Tables<"configuracion_logistica">;

export type Produccion = {
  id: string;
  nombre: string;
  descripcion: string | null;
  tipo_catalogo?: TipoCatalogo;
  fecha_lanzamiento: string | null;
  activa: boolean;
  created_at: string;
  updated_at: string;
};

export type EstadoEncargo = "pendiente" | "aceptado" | "en_proceso" | "listo" | "entregado" | "rechazado" | "cancelado";

export type MedidaIlustracion = {
  id: string;
  nombre: string;
  recargo: number;
};

export type ConfiguracionEncargos = {
  id: string;
  medidas_ilustraciones?: MedidaIlustracion[];
  precio_marco_madera: number;
  porcentaje_recargo_personalizado: number;
  demora_default_dias: number;
  porcentaje_sena?: number;
  updated_at?: string;
};

export type FormatoCatalogo = {
  id: string;
  rubro: "ceramica" | "ilustracion";
  nombre: string;
  categoria: string | null;
  medidas: string | null;
  precio_base: number;
  foto_url: string | null;
  orden: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
};

export type PortfolioColeccion = {
  id: string;
  rubro: "ceramica" | "ilustracion";
  nombre: string;
  descripcion: string | null;
  portada_url: string | null;
  fotos: string[];
  disenos_disponibles: string[];
  orden: number;
  activa: boolean;
  created_at: string;
  updated_at: string;
};

export type CategoriaObra = "murales" | "esculturas" | "ilustraciones" | "gran_dimension_b2b" | "miniaturas" | (string & {});

export type ObraProyecto = {
  id: string;
  categoria: CategoriaObra;
  titulo: string;
  subtitulo: string | null;
  descripcion: string | null;
  cliente_lugar: string | null;
  portada_url: string | null;
  fotos: string[];
  destacado_home: boolean;
  orden: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
};

export type ItemEncargoSeleccionado = {
  formato: FormatoCatalogo;
  cantidad: number;
  disenoSeleccionado: string;
  detallePersonalizacion?: string;
  precioUnitario: number;
  subtotal: number;
};

export type Encargo = {
  id: string;
  producto_id: string | null;
  nombre_contacto: string;
  whatsapp_contacto: string;
  email_contacto: string | null;
  tipo_catalogo: TipoCatalogo;
  es_personalizado: boolean;
  detalle_personalizacion: string | null;
  medida_seleccionada: string | null;
  con_marco: boolean;
  metodo_entrega: string;
  direccion_envio: Record<string, unknown> | null;
  precio_estimado: number;
  recargo_personalizado: number;
  adicional_medida: number;
  adicional_marco: number;
  total_estimado: number;
  estado: EstadoEncargo;
  demora_estimada_dias: number | null;
  notas_admin: string | null;
  created_at: string;
  updated_at: string;
  productos?: ProductoConImagenes | null;
  items_encargo?: Record<string, unknown>[];
};

export type ConfiguracionSitio = {
  id: string;
  logo_url: string | null;
  hero_titulo: string;
  hero_subtitulo: string;
  hero_imagen_url: string | null;
  login_imagen_url?: string | null;
  coleccion_destacada_id: string | null;
  sobre_mi_foto_url?: string | null;
  sobre_mi_titulo?: string | null;
  sobre_mi_frase?: string | null;
  sobre_mi_texto?: string | null;
  sobre_mi_foto_pos_x?: number | null;
  sobre_mi_foto_pos_y?: number | null;
  sobre_mi_foto_zoom?: number | null;
  sobre_mi_foto_fit?: string | null;
  banco_titular?: string | null;
  banco_cuit?: string | null;
  banco_nombre?: string | null;
  banco_alias?: string | null;
  banco_cbu?: string | null;
  taller_direccion?: string | null;
  taller_ciudad?: string | null;
  taller_provincia?: string | null;
  taller_codigo_postal?: string | null;
  vendedor_whatsapp?: string | null;
  updated_at?: string;
};

export type ProductoConImagenes = Producto & {
  producto_imagenes: ProductoImagen[];
  categorias: Categoria | null;
  producciones?: Produccion | null;
};

export type PedidoConItems = Pedido & {
  items_pedido: (ItemPedido & { productos: Producto | null })[];
};

export type StockStatus = "disponible" | "bajo_pedido" | "no_disponible";

export type LineaCarrito = {
  productoId: string;
  slug: string;
  nombre: string;
  imagenUrl: string | null;
  precioBase: number;
  cantidad: number;
  esPersonalizable: boolean;
  personalizado: boolean;
  stockDisponible: number;
};

export type DireccionEnvio = {
  calle: string;
  numero: string;
  ciudad: string;
  codigoPostal: string;
  referencia?: string;
};

export type PricingBreakdown = {
  subtotal: number;
  descuentoMayorista: number;
  descuentoTransferencia: number;
  descuentoTotal: number;
  subtotalConDescuentos: number;
  costoEnvio: number;
  total: number;
  totalPiezas: number;
};

export type CrearPedidoItem = {
  producto_id: string;
  cantidad: number;
  es_personalizado: boolean;
  precio_unitario_final: number;
};
