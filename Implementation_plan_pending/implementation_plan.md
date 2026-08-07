# Flujo de Creación de Producción (Colección) — Admin Panel

## Contexto

El cliente necesita un flujo intuitivo de "Producción" en el admin panel. Actualmente, crear productos requiere navegar entre múltiples páginas (crear categoría → crear producto → subir fotos por separado). El nuevo flujo debe permitir crear una colección completa **sin salir de la página**.

## Concepto: "Producción"

Una **producción** es el acto de lanzar una colección completa de piezas. El flujo es:

1. **Definir la producción**: nombre de la colección (categoría), descripción general
2. **Cargar piezas una por una**: nombre, descripción, precio, stock, fotos — todo en la misma vista
3. **Guardar y avanzar**: cada pieza se guarda individualmente, permitiendo avanzar a la siguiente
4. **Pausar y retomar**: el progreso se guarda automáticamente; el admin puede irse y volver después
5. **Finalizar y previsualizar**: un botón "Finalizar producción" muestra una vista previa de la colección completa antes de publicarla

## Mapeo a la Base de Datos Existente

No necesitamos crear nuevas tablas. Usamos las existentes:

| Concepto | Tabla | Campo clave |
|---|---|---|
| Producción/Colección | `categorias` | `nombre` |
| Pieza individual | `productos` | `categoria_id` → la categoría |
| Fotos de pieza | `producto_imagenes` | `producto_id` |
| Estado publicación | `productos.activo` | `false` = borrador, `true` = publicado |

Las piezas se crean con `activo = false` (borrador) hasta que se "publique" la producción.

## Proposed Changes

### Nuevo Flujo de Producción

#### [NEW] [page.tsx](file:///c:/Users/Seba/Desktop/Milideas_Page/src/app/admin/produccion/nueva/page.tsx)

Página server-side que carga las categorías existentes y renderiza el componente de producción.

#### [NEW] [produccion-wizard.tsx](file:///c:/Users/Seba/Desktop/Milideas_Page/src/components/admin/produccion-wizard.tsx)

Componente client-side principal — un wizard de varios pasos en una sola vista:

**Paso 1 — Configurar Colección**
- Input: Nombre de la colección
- Select + botón "Nueva categoría": seleccionar categoría existente o crear una nueva inline
- Textarea: Descripción general (se usará para metadata)
- Botón: "Comenzar a cargar piezas →"

**Paso 2 — Cargar Piezas (loop)**
- Header: "Pieza #N de la colección [nombre]"
- Barra de progreso: muestra cuántas piezas se han cargado
- Formulario de pieza:
  - Nombre de la pieza
  - Descripción
  - Precio (ARS)
  - Stock disponible
  - Checkbox: ¿Es personalizable?
  - **Subida de fotos inline** (drag & drop, múltiples fotos)
- Acciones:
  - "💾 Guardar y agregar otra pieza" — guarda la pieza actual, limpia el form, avanza el contador
  - "✅ Finalizar producción" — guarda la pieza actual y pasa al paso 3
  - "⏸️ Guardar borrador y salir" — guarda y vuelve al dashboard

**Paso 3 — Previsualización**
- Muestra todas las piezas de la colección en un grid (como se verán en la tienda)
- Para cada pieza: imagen principal, nombre, precio, estado
- Acciones por pieza: "Editar" (vuelve al form con datos precargados), "Eliminar"
- Acciones globales:
  - "🚀 Publicar colección" — pone `activo = true` en todos los productos
  - "✏️ Seguir editando" — vuelve al paso 2
  - "💾 Guardar como borrador" — deja todo en `activo = false` y redirige al dashboard

#### [NEW] [page.tsx](file:///c:/Users/Seba/Desktop/Milideas_Page/src/app/admin/produccion/[categoriaId]/page.tsx)

Página para retomar una producción en progreso (piezas en borrador de una categoría).

#### [MODIFY] [index.ts](file:///c:/Users/Seba/Desktop/Milideas_Page/src/lib/actions/index.ts)

Nuevas server actions:
- `createCategoriaInlineAction(nombre)` — crea categoría y devuelve `{ id, nombre }`
- `savePiezaProduccionAction(formData, categoriaId, productoId?)` — guarda pieza como borrador (`activo = false`)
- `publicarProduccionAction(categoriaId)` — pone `activo = true` en todos los productos de la categoría que estén en borrador
- `deletePiezaAction(productoId)` — elimina una pieza y sus imágenes

#### [MODIFY] [index.ts](file:///c:/Users/Seba/Desktop/Milideas_Page/src/lib/supabase/queries/index.ts)

Nuevas queries:
- `getPiezasBorrador(categoriaId)` — obtiene productos con `activo = false` de una categoría
- `getProduccionesEnProgreso()` — categorías que tienen al menos un producto con `activo = false`

#### [MODIFY] [admin-sidebar.tsx](file:///c:/Users/Seba/Desktop/Milideas_Page/src/components/admin/admin-sidebar.tsx)

Agregar enlace "🎬 Producción" en la navegación del sidebar.

#### [MODIFY] [page.tsx](file:///c:/Users/Seba/Desktop/Milideas_Page/src/app/admin/page.tsx)

Agregar acción rápida "🎬 Nueva producción" y sección "Producciones en progreso" en el dashboard.

---

## Open Questions

> [!IMPORTANT]
> **¿La subida de fotos durante la creación de una pieza debe funcionar sin haber guardado la pieza primero?**
> En el sistema actual, las fotos se suben **después** de crear el producto (porque necesitan el `producto_id`). En el nuevo flujo, propongo guardar la pieza automáticamente apenas se empiece a llenar (como borrador), para que las fotos se puedan subir inmediatamente. ¿Te parece bien?

> [!IMPORTANT]
> **¿Querés que la previsualización muestre exactamente cómo se ve en la tienda (con el mismo diseño de cards)?** ¿O con un diseño más simple de tabla/grid administrativo?

## Verification Plan

### Manual Verification
1. Crear una nueva producción con 3 piezas y fotos
2. Pausar a mitad de camino, salir, volver y retomar
3. Previsualizar la colección
4. Publicar y verificar que aparezca en la tienda pública
