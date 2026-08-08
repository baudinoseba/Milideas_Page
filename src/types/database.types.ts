export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12";
  };
  public: {
    Tables: {
      categorias: {
        Row: {
          id: string;
          nombre: string;
          tipo_catalogo?: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          tipo_catalogo?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          tipo_catalogo?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      configuracion_logistica: {
        Row: {
          id: string;
          zona_nombre: string;
          precio_agencia: number;
          precio_domicilio: number;
          activa: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          zona_nombre: string;
          precio_agencia: number;
          precio_domicilio: number;
          activa?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          zona_nombre?: string;
          precio_agencia?: number;
          precio_domicilio?: number;
          activa?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      items_pedido: {
        Row: {
          id: string;
          pedido_id: string;
          producto_id: string;
          cantidad: number;
          precio_unitario_final: number;
          es_personalizado: boolean;
        };
        Insert: {
          id?: string;
          pedido_id: string;
          producto_id: string;
          cantidad: number;
          precio_unitario_final: number;
          es_personalizado?: boolean;
        };
        Update: {
          id?: string;
          pedido_id?: string;
          producto_id?: string;
          cantidad?: number;
          precio_unitario_final?: number;
          es_personalizado?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "items_pedido_pedido_id_fkey";
            columns: ["pedido_id"];
            isOneToOne: false;
            referencedRelation: "pedidos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "items_pedido_producto_id_fkey";
            columns: ["producto_id"];
            isOneToOne: false;
            referencedRelation: "productos";
            referencedColumns: ["id"];
          },
        ];
      };
      pedidos: {
        Row: {
          id: string;
          usuario_id: string | null;
          estado: Database["public"]["Enums"]["estado_pedido"];
          subtotal: number;
          descuento_aplicado: number;
          costo_envio: number;
          total: number;
          tipo_envio: Database["public"]["Enums"]["tipo_envio"];
          metodo_pago: Database["public"]["Enums"]["metodo_pago"];
          direccion_envio: Json | null;
          zona_logistica_id: string | null;
          comprobante_url: string | null;
          nombre_contacto: string;
          whatsapp_contacto: string;
          email_contacto: string | null;
          fecha_limite_pago: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          usuario_id?: string | null;
          estado?: Database["public"]["Enums"]["estado_pedido"];
          subtotal: number;
          descuento_aplicado?: number;
          costo_envio?: number;
          total: number;
          tipo_envio: Database["public"]["Enums"]["tipo_envio"];
          metodo_pago?: Database["public"]["Enums"]["metodo_pago"];
          direccion_envio?: Json | null;
          zona_logistica_id?: string | null;
          comprobante_url?: string | null;
          nombre_contacto: string;
          whatsapp_contacto: string;
          email_contacto?: string | null;
          fecha_limite_pago?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          usuario_id?: string | null;
          estado?: Database["public"]["Enums"]["estado_pedido"];
          subtotal?: number;
          descuento_aplicado?: number;
          costo_envio?: number;
          total?: number;
          tipo_envio?: Database["public"]["Enums"]["tipo_envio"];
          metodo_pago?: Database["public"]["Enums"]["metodo_pago"];
          direccion_envio?: Json | null;
          zona_logistica_id?: string | null;
          comprobante_url?: string | null;
          nombre_contacto?: string;
          whatsapp_contacto?: string;
          email_contacto?: string | null;
          fecha_limite_pago?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pedidos_zona_logistica_id_fkey";
            columns: ["zona_logistica_id"];
            isOneToOne: false;
            referencedRelation: "configuracion_logistica";
            referencedColumns: ["id"];
          },
        ];
      };
      perfiles: {
        Row: {
          id: string;
          nombre_completo: string | null;
          whatsapp: string | null;
          es_admin: boolean;
          created_at: string;
          updated_at: string;
          nombre_usuario: string | null;
          dni: string | null;
          direccion_calle: string | null;
          direccion_numero: string | null;
          direccion_piso: string | null;
          direccion_depto: string | null;
          direccion_ciudad: string | null;
          direccion_provincia: string | null;
          direccion_codigo_postal: string | null;
          direccion_referencia: string | null;
        };
        Insert: {
          id: string;
          nombre_completo?: string | null;
          whatsapp?: string | null;
          es_admin?: boolean;
          created_at?: string;
          updated_at?: string;
          nombre_usuario?: string | null;
          dni?: string | null;
          direccion_calle?: string | null;
          direccion_numero?: string | null;
          direccion_piso?: string | null;
          direccion_depto?: string | null;
          direccion_ciudad?: string | null;
          direccion_provincia?: string | null;
          direccion_codigo_postal?: string | null;
          direccion_referencia?: string | null;
        };
        Update: {
          id?: string;
          nombre_completo?: string | null;
          whatsapp?: string | null;
          es_admin?: boolean;
          created_at?: string;
          updated_at?: string;
          nombre_usuario?: string | null;
          dni?: string | null;
          direccion_calle?: string | null;
          direccion_numero?: string | null;
          direccion_piso?: string | null;
          direccion_depto?: string | null;
          direccion_ciudad?: string | null;
          direccion_provincia?: string | null;
          direccion_codigo_postal?: string | null;
          direccion_referencia?: string | null;
        };
        Relationships: [];
      };
      producto_imagenes: {
        Row: {
          id: string;
          producto_id: string;
          url_imagen: string;
          orden: number;
        };
        Insert: {
          id?: string;
          producto_id: string;
          url_imagen: string;
          orden?: number;
        };
        Update: {
          id?: string;
          producto_id?: string;
          url_imagen?: string;
          orden?: number;
        };
        Relationships: [
          {
            foreignKeyName: "producto_imagenes_producto_id_fkey";
            columns: ["producto_id"];
            isOneToOne: false;
            referencedRelation: "productos";
            referencedColumns: ["id"];
          },
        ];
      };
      productos: {
        Row: {
          id: string;
          categoria_id: string | null;
          nombre: string;
          slug: string;
          tipo_catalogo?: string | null;
          descripcion: string | null;
          precio_base: number;
          es_personalizable: boolean;
          stock_disponible: number;
          es_entrega_inmediata: boolean;
          fecha_lanzamiento: string | null;
          activo: boolean;
          alto_cm: number | null;
          ancho_cm: number | null;
          dimensiones: string | null;
          capacidad_ml?: number | null;
          papel_soporte?: string | null;
          material_tecnica?: string | null;
          edicion_numerada?: string | null;
          marco_incluido?: boolean | null;
          pedestal_incluido?: boolean | null;
          apto_lavavajillas?: boolean | null;
          apto_microondas?: boolean | null;
          atributos_especificos?: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          categoria_id?: string | null;
          nombre: string;
          slug: string;
          tipo_catalogo?: string | null;
          descripcion?: string | null;
          precio_base: number;
          es_personalizable?: boolean;
          stock_disponible?: number;
          es_entrega_inmediata?: boolean;
          fecha_lanzamiento?: string | null;
          activo?: boolean;
          alto_cm?: number | null;
          ancho_cm?: number | null;
          dimensiones?: string | null;
          capacidad_ml?: number | null;
          papel_soporte?: string | null;
          material_tecnica?: string | null;
          edicion_numerada?: string | null;
          marco_incluido?: boolean | null;
          pedestal_incluido?: boolean | null;
          apto_lavavajillas?: boolean | null;
          apto_microondas?: boolean | null;
          atributos_especificos?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          categoria_id?: string | null;
          nombre?: string;
          slug?: string;
          tipo_catalogo?: string | null;
          descripcion?: string | null;
          precio_base?: number;
          es_personalizable?: boolean;
          stock_disponible?: number;
          es_entrega_inmediata?: boolean;
          fecha_lanzamiento?: string | null;
          activo?: boolean;
          alto_cm?: number | null;
          ancho_cm?: number | null;
          dimensiones?: string | null;
          capacidad_ml?: number | null;
          papel_soporte?: string | null;
          material_tecnica?: string | null;
          edicion_numerada?: string | null;
          marco_incluido?: boolean | null;
          pedestal_incluido?: boolean | null;
          apto_lavavajillas?: boolean | null;
          apto_microondas?: boolean | null;
          atributos_especificos?: any;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "productos_categoria_id_fkey";
            columns: ["categoria_id"];
            isOneToOne: false;
            referencedRelation: "categorias";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      actualizar_comprobante: {
        Args: { p_pedido_id: string; p_comprobante_url: string };
        Returns: undefined;
      };
      cancelar_pedido: {
        Args: { p_pedido_id: string };
        Returns: undefined;
      };
      confirmar_pago: {
        Args: { p_pedido_id: string };
        Returns: undefined;
      };
      crear_pedido: {
        Args: {
          p_items: Json;
          p_nombre_contacto: string;
          p_whatsapp_contacto: string;
          p_email_contacto: string;
          p_tipo_envio: Database["public"]["Enums"]["tipo_envio"];
          p_zona_logistica_id: string;
          p_direccion_envio: Json;
          p_metodo_pago: Database["public"]["Enums"]["metodo_pago"];
          p_subtotal: number;
          p_descuento_aplicado: number;
          p_costo_envio: number;
          p_total: number;
        };
        Returns: string;
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {
      estado_pedido: "pendiente_pago" | "confirmado" | "enviado" | "cancelado";
      metodo_pago: "transferencia" | "mercadopago" | "efectivo";
      tipo_envio: "agencia" | "domicilio" | "taller";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
