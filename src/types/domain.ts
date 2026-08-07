import type { Tables, Enums } from "./database.types";

export type EstadoPedido = Enums<"estado_pedido">;
export type MetodoPago = Enums<"metodo_pago">;
export type TipoEnvio = Enums<"tipo_envio"> | "taller";

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
  fecha_lanzamiento: string | null;
  activa: boolean;
  created_at: string;
  updated_at: string;
};


export type ConfiguracionSitio = {
  id: string;
  logo_url: string | null;
  hero_titulo: string;
  hero_subtitulo: string;
  hero_imagen_url: string | null;
  coleccion_destacada_id: string | null;
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
