# E2E_SECURITY_TEST_PLAN.md
## Plan Integral de Validación E2E, Lógica de Negocio y Seguridad en Profundidad
**Proyecto:** Milideas Page (Next.js 16 + Supabase + PostgreSQL)
**Fecha:** 2026-08-25
**Rol:** Senior QA Automation & Application Security Engineer
**Versión:** 2.0 (Segunda Capa de Validación Post-Auditoría Estática)

---

## 1. Alcance y Objetivos

### 1.1 Objetivo Principal
Validar que la aplicación web **Milideas Page** funcione correctamente bajo flujos de usuario legítimos y, al mismo tiempo, **sea completamente resistente a manipulaciones maliciosas, ataques a la lógica de negocio, condiciones de carrera, accesos no autorizados (IDOR/BOLA) y discrepancias entre cliente y servidor**.

> **Premisa Fundamental:**
> *"El frontend nunca es una frontera de seguridad. Todo dato, estado local (`localStorage`/Zustand), precio, stock o identificador originado en el navegador debe ser tratado como hostil y validado rigurosamente en el servidor."*

### 1.2 Dimensiones Evaluadas
1. **Flujos Funcionales E2E:** Navegación, catálogo, selección de variantes, carrito, checkout, seguimiento de orden, autenticación y panel de administración.
2. **Lógica de Negocio & Consistencia Transaccional:** Control de stock atómico, reservas temporales de 24h/48h, cálculo de descuentos mayoristas, recargos de personalización, costos de logística.
3. **Seguridad & Autorización:** Bypass de middleware, IDOR en pedidos y comprobantes, escalada de privilegios (RBAC), manipulación de precios/cantidades en Server Actions, SSRF en servicios de IA.
4. **Concurrencia & Idempotencia:** Doble clic en checkout, compra simultánea de la última unidad por dos usuarios (Race Conditions), reintentos de pago.
5. **Resiliencia & Browser Security:** Manejo de sesiones expiradas, cookies `HttpOnly`/`SameSite`, headers HSTS/CSP/Permissions-Policy, inputs maliciosos (XSS/SQLi injection fuzzing).

---

## 2. Arquitectura de la Suite de Pruebas

La estrategia de testing combina dos niveles de ejecución complementarios:

- **Nivel 1: Pruebas E2E en Navegador Real (Playwright):**
  - Smoke & User Journey Specs
  - Cart & UI Validation Specs
  - Admin Workflow & UI Auth Specs
- **Nivel 2: Pruebas Directas de Server Actions & APIs (Harness Automatizado):**
  - Business Logic & Price Tampering Specs
  - Stock Collision & Race Condition Specs
  - IDOR & Broken Access Control Specs
  - Negative Inputs & Schema Fuzzing Specs

### 2.1 Herramientas Seleccionadas
- **Playwright Test (@playwright/test):** Automatización de navegador (Chromium/Webkit/Firefox) para flujos E2E, multi-contexto para pruebas de dos usuarios simultáneos, captura automática de screenshots, traces y videos en caso de fallo.
- **Direct Server Action / API Harness (Vitest + Next.js Server Client):** Pruebas de bajo nivel que llaman directamente a las Server Actions (`crearPedidoAction`, `crearEncargoAction`, `subirComprobanteAction`, `saveProductoAction`, etc.) simulando peticiones HTTP/FormData alteradas desde fuera de la UI.
- **Supabase SSR / Postgres Direct Assertions:** Verificación de estado en base de datos para confirmar que los registros persistidos coinciden exactamente con la lógica esperada y no con los valores alterados por el atacante.

---

## 3. Ambientes, Usuarios y Datos de Prueba

### 3.1 Ambientes de Ejecución
- **Base URL:** `http://localhost:3000` (desarrollo local / build preview `npm run build && npm run start`).
- **Supabase:** Base de datos Postgres con migraciones aplicadas (esquema inicial + reservas de stock + fix de comprobantes privados).

### 3.2 Matriz de Usuarios de Prueba
| Identificador | Rol | Propósito | Credenciales de Prueba |
|---|---|---|---|
| `test_buyer_1` | Cliente Registrado | Flujos de compra normales, verificación de órdenes propias. | `buyer1@test.milideas.local` / `Pass123!_test` |
| `test_buyer_2` | Cliente Registrado | Pruebas de concurrencia e intentos de acceso cruzado (IDOR). | `buyer2@test.milideas.local` / `Pass123!_test` |
| `test_admin` | Administrador (`es_admin: true`) | Gestión de catálogo, producciones, cambio de estados de pedidos. | `admin@test.milideas.local` / `AdminPass123!_test` |
| `guest_user` | Usuario Anónimo | Compras sin cuenta, acceso exclusivo a páginas públicas. | N/A (Sesión anónima) |

### 3.3 Fixtures y Datos de Prueba Controlados
- **Producto `PROD-STOCK-ALTO`:** Stock = 10, Precio Base = $15.000, No personalizable.
- **Producto `PROD-STOCK-UNO`:** Stock = 1, Precio Base = $25.000, Personalizable. (Crítico para pruebas de colisión).
- **Producto `PROD-STOCK-CERO`:** Stock = 0, Activo = true. (Verificar rechazo de compra).
- **Producto `PROD-INACTIVO`:** Stock = 5, Activo = false. (Borrador/oculto, verificar invisibilidad).
- **Zona Logística de Prueba:** CABA ($4.500 agencia / $6.500 domicilio).

---

## 4. Matriz Detallada de Casos de Prueba (Fases 1 a 20)

### FASE 1 — Smoke & Navegación Base (Critical)
- `SMK-01`: La página Home carga correctamente (`/`) con status 200 y renderiza Hero, categorías y footer.
- `SMK-02`: El catálogo (`/catalogo`, `/catalogo/ceramica`) lista productos activos con imagen y precio.
- `SMK-03`: La página de detalle (`/producto/[slug]`) renderiza datos completos, selector de cantidad y botón de compra.
- `SMK-04`: Rutas protegidas (`/admin`, `/admin/pedidos`, `/cuenta/perfil`) redirigen inmediatamente al login si no hay sesión.

### FASE 2 — Autenticación & Ciclo de Sesión (High)
- `AUT-01`: Login exitoso redirige al destino adecuado (`/cuenta/perfil` o `/admin` según rol).
- `AUT-02`: Login con credenciales inválidas muestra mensaje amigable sin enumerar usuarios.
- `AUT-03`: Logout invalida la sesión y bloquea la navegación posterior a páginas protegidas (incluso con botón "Atrás" del browser).
- `AUT-04`: Open Redirect Defense: Intentos de login con `?redirect=https://evil.com` o `//evil.com` deben forzar redirección relativa segura (`/`).

### FASE 3 — Autorización & Control de Acceso (Critical / High)
- `AC-01`: Usuario normal intentando acceder a `/admin/*` es redirigido a `/` (bloqueo en middleware y en layout).
- `AC-02` (IDOR Pedidos): Usuario A no puede ver los detalles del pedido de Usuario B en `/cuenta/pedidos/[id]`.
- `AC-03` (IDOR Comprobantes): Invocación directa de `subirComprobanteAction` sobre un `pedidoId` ajeno es rechazada con `403/Error: No tenés permiso`.
- `AC-04` (Privilege Escalation): Invocación de `makeMeAdminAction()` sin `ADMIN_SETUP_SECRET` es rechazada.
- `AC-05` (Admin Server Actions): Llamadas directas a `confirmarPagoAction`, `cancelarPedidoAction`, `saveProductoAction` desde un cliente no admin son rechazadas.

### FASE 4 — Productos & Visualización de Catálogo (Medium)
- `PRD-01`: Productos con `activo: false` no aparecen en catálogo público ni son accesibles por slug directo (devuelve 404).
- `PRD-02`: Productos con `stock_disponible = 0` muestran etiqueta "No disponible" o "Bajo pedido" y deshabilitan compra directa.

### FASE 5 — Carrito & Manipulación del Cliente (Critical)
- `CRT-01`: Agregar, modificar cantidad y eliminar productos en carrito actualiza subtotales y contador de badge.
- `CRT-02`: Persistencia en `localStorage`: El carrito sobrevive al refresh de página y cambio de pestañas.
- `CRT-03` (Tampering de Cantidad): Manipular `localStorage` inyectando `cantidad = -1`, `cantidad = 0`, `cantidad = 999999` o `NaN` es normalizado o rechazado por el backend al procesar la orden.
- `CRT-04` (Tampering de Precio en Carrito): Inyectar `precioBase: 1` en el store de Zustand es completamente ignorado por `crearPedidoAction`, recalculando el monto legítimo desde Postgres.

### FASE 6 — Control de Stock & Límite de Disponibilidad (Critical)
- `STK-01`: Intento de compra con cantidad > stock disponible es rechazado con error `STOCK_INSUFICIENTE`.
- `STK-02`: Compra de producto con stock = 0 es bloqueada en el servidor.
- `STK-03`: Compra de producto con stock = 1 decrementa el stock a 0 en la base de datos de forma atómica.

### FASE 7 — Carrito con Estados Mixtos (High)
- `MIX-01`: Carrito con Producto A (disponible, stock=2) y Producto B (agotado durante la sesión, stock=0). Al intentar checkout, el backend rechaza la transacción de forma atómica (rollback total) y notifica qué ítem causó la colisión.

### FASE 8 — Manipulación de Precios & Subtotales (Critical)
- `PRC-01`: Envío de FormData con `total: 10`, `subtotal: 10`, `costoEnvio: 0` para un producto de $20.000 + envío $4.500. El pedido registrado en la tabla `pedidos` de Supabase debe tener `total: 24500` (cálculo del servidor).
- `PRC-02`: Manipulación de recargos en encargos (`crearEncargoAction`): Valores alterados en cliente son reemplazados por el cálculo oficial de `configuracion_encargos`.

### FASE 9 — Descuentos & Tiers Mayoristas (Medium)
- `DSC-01`: Carrito con 15 a 19 piezas aplica automáticamente 10% de descuento mayorista en servidor.
- `DSC-02`: Carrito con 20 a 34 piezas aplica 15% de descuento en servidor.
- `DSC-03`: Carrito con 35+ piezas aplica 20% de descuento en servidor.
- `DSC-04`: Intentos de aplicar descuento mayorista con menos de 15 piezas modificando el payload son ignorados.

### FASE 10 — Checkout End-to-End & Transaccionalidad (Critical)
- `CHK-01`: Flujo completo Happy Path: Selección de producto -> Carrito -> Checkout domicilio -> Creación de pedido en estado `reservado`/`pendiente_pago` -> Redirección a `/checkout/exito/[id]`.
- `CHK-02`: Validación de formulario con Zod: WhatsApp inválido, nombre vacío o dirección incompleta devuelven errores inline y no tocan la base de datos.
- `CHK-03`: Selección de retiro en taller aplica costo de envío $0.

### FASE 11 — Idempotencia & Doble Envío (High)
- `IDP-01`: Doble clic rápido en "Confirmar pedido" no debe crear dos registros duplicados en la tabla `pedidos` ni descontar doble stock.
- `IDP-02`: Doble invocación de `confirmarPagoAction` sobre un pedido ya confirmado no genera errores ni inconsistencias.

### FASE 12 — Concurrencia & Race Conditions (Critical)
- `CON-01`: Dos usuarios intentando comprar simultáneamente la última unidad de `PROD-STOCK-UNO` mediante requests concurrentes con `Promise.all()`.
  - **Resultado Esperado:** Exactamente 1 pedido exitoso, 1 pedido rechazado con mensaje de colisión de stock, y `stock_disponible = 0` (nunca negativo).

### FASE 13 — Direct API & Server Actions Security (High)
- `API-01`: Invocación de `uploadProductoImageAction` enviando un script `.php`/`.sh`/`.exe` camuflado es rechazada por la whitelist de MIME types.
- `API-02`: Invocación de `generarDescripcionProductoIAAction` enviando `http://169.254.169.254/latest/meta-data/` es bloqueada por la protección SSRF.
- `API-03`: Invocación de `deleteProduccionCompletaAction` con payload SQLi/PostgREST en `targetId` es rechazada por la validación UUID.

### FASE 14 — Validación Frontend vs Backend
- `VFB-01`: Matriz comparativa de validaciones documentada y verificada en código.

### FASE 15 — Suite de Regresión Automatizada (Medium)
- `REG-01`: Suite completa ejecutable vía `npm run test:e2e` y `npm run test` lista para CI/CD en GitHub Actions.

### FASE 16 — Manejo de Errores & Resiliencia (Medium)
- `ERR-01`: Respuestas de error no filtran stacktraces internos de Node/PostgreSQL al usuario final.

### FASE 17 — Seguridad en Navegador & Almacenamiento (Medium)
- `SEC-01`: Cookies de sesión de Supabase poseen flags de seguridad adecuadas.
- `SEC-02`: `localStorage` no contiene tokens de service-role ni datos bancarios secretos.

### FASE 18 — Accesibilidad Smoke (Low)
- `A11Y-01`: Formularios principales poseen `labels` asociados y campos con `aria-invalid` en error.

### FASE 19 — Performance Básica (Low)
- `PERF-01`: Carga de catálogo y detalle de producto responden en < 1.5s en entorno local.

### FASE 20 — Reporte de Evidencias & Veredicto (Final)
- `REP-01`: Generación de `E2E_TEST_REPORT.md`, `E2E_SECURITY_RISK_MATRIX.md` y `E2E_FINAL_REPORT.md`.

---

## 5. Criterios de Aprobación

- **Zero Critical / High Failures:** Ningún fallo en control de stock, manipulación de precios, escalada de privilegios, IDOR o concurrencia.
- **Pass Rate:** >= 95% en pruebas funcionales y de lógica de negocio.
- **Veredicto Final:** `GO`, `GO WITH CONDITIONS`, o `NO-GO`.
