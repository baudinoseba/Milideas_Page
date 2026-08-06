# Contexto del Proyecto: Milideas E-commerce
Proyecto de comercio electrónico para venta de cerámica de autor y arte. El modelo de negocio se basa en "Drops" (Lanzamientos mensuales) y piezas únicas.

## Stack Tecnológico
* Framework: Next.js (App Router)
* Lenguaje: TypeScript
* Estilos: Tailwind CSS
* Backend & BD: Supabase (PostgreSQL, Auth, Storage)
* Estado Global: Zustand (o Context API para el carrito)

## Arquitectura de Base de Datos (Supabase)
1. `perfiles`: PK `id` (FK a auth.users). Contiene `nombre_completo`, `whatsapp`, `es_admin`.
2. `categorias`: PK `id`. Contiene `nombre`.
3. `productos`: PK `id`. FK `categoria_id`. Contiene `nombre`, `slug`, `precio_base`, `es_personalizable`, `stock_disponible`, `es_entrega_inmediata`.
4. `producto_imagenes`: PK `id`. FK `producto_id` (ON DELETE CASCADE). Contiene `url_imagen`, `orden`.
5. `pedidos`: PK `id`. FK `usuario_id` (Nullable para invitados). Contiene `estado`, `subtotal`, `descuento_aplicado`, `total`, `tipo_envio`, `direccion_envio`, `comprobante_url`.
6. `items_pedido`: PK `id`. FK `pedido_id`, `producto_id`. Contiene `cantidad`, `precio_unitario_final`.
7. `configuracion_logistica`: PK `id`. Contiene `zona_nombre`, `precio_agencia`, `precio_domicilio`, `activa`.

## Reglas de Negocio Core
* Gestión de Stock: Los productos con `stock_disponible = 0` se consideran "bajo pedido".
* Personalización: Si un producto tiene `es_personalizable = true` y el usuario lo selecciona, se aplica un 15% de recargo al precio base.
* Descuentos Mayoristas: 15-20 piezas (-10%), 20-35 piezas (-15%), 35-50 piezas (-20%).
* Descuento Transferencia: -20% adicional sobre el total si el método de pago es transferencia.
* Seguridad: Existen políticas RLS. La escritura en catálogo es exclusiva para `es_admin = true`.

## Reglas de Interfaz y Desarrollo (UI/UX)
* Enfoque: 100% Mobile-First.
* Diseño: "Ghost UI" (Minimalista, fondos crudos/blancos). El color lo aportan únicamente las imágenes de los productos.
* Componentes: Modulares, reutilizables y fuertemente tipados con TypeScript.
* Rendimiento: Uso estricto de `next/image` para optimización webP y lazy loading.