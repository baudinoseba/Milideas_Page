import type { Tables, Enums } from "./database.types";

export type EstadoPedido = Enums<"estado_pedido">;
export type MetodoPago = Enums<"metodo_pago">;
export type TipoEnvio = Enums<"tipo_envio">;

export type Producto = Tables<"productos">;
export type ProductoImagen = Tables<"producto_imagenes">;
export type Categoria = Tables<"categorias">;
export type Pedido = Tables<"pedidos">;
export type ItemPedido = Tables<"items_pedido">;
export type Perfil = Tables<"perfiles">;
export type ZonaLogistica = Tables<"configuracion_logistica">;

export type ProductoConImagenes = Producto & {
  producto_imagenes: ProductoImagen[];
  categorias: Categoria | null;
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
