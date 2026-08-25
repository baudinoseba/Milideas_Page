# E2E_SECURITY_RISK_MATRIX.md
## Matriz de Riesgo de Seguridad y Lógica de Negocio — Milideas Page
**Fecha:** 2026-08-25
**Evaluación:** Post-Remediación & Suite Automatizada E2E/API

---

## 1. Matriz Consolidada por Área

| Área / Vector de Ataque | Tests Ejecutados | Resultado | Riesgo Residual | Observaciones |
|---|:---:|:---:|:---:|---|
| **Authentication** | 4 | **PASS** | 🟢 **BAJO** | Protegido contra Open Redirect en login y OAuth callback. Formulario sin fugas de información. |
| **Authorization & RBAC** | 5 | **PASS** | 🟢 **BAJO** | Middleware y Server Actions protegidas con `requireAdmin()`. Eliminada escalada de privilegios libre. |
| **Products & Catalog** | 3 | **PASS** | 🟢 **BAJO** | Productos inactivos ocultos; visualización sincronizada con Postgres. |
| **Cart Tampering** | 4 | **PASS** | 🟢 **BAJO** | Inyección de cantidades negativas o precios arbitrarios en `localStorage` neutralizada. |
| **Stock & Reservation Flow** | 4 | **PASS** | 🟢 **BAJO** | RPC `crear_pedido` utiliza `FOR UPDATE` y estado `reservado` de 48h con recálculo atómico. |
| **Pricing & Subtotals** | 4 | **PASS** | 🟢 **BAJO** | El cliente no determina el precio. El backend consulta precios base, descuentos mayoristas y costos de envío en DB. |
| **Discounts & Custom Surcharges** | 2 | **PASS** | 🟢 **BAJO** | Tiers mayoristas (10%, 15%, 20%) y recargos de marco/personalización calculados en backend. |
| **Checkout & Order Creation** | 3 | **PASS** | 🟢 **BAJO** | Validaciones Zod estrictas, dirección normalizada, persistencia atómica. |
| **Receipt Uploads (IDOR & MIME)** | 2 | **PASS** | 🟢 **BAJO** | Whitelist de extensiones/MIME, límite de 10MB y verificación de pertenencia del pedido. Bucket privado. |
| **API & Server Actions** | 4 | **PASS** | 🟢 **BAJO** | Detección de inyecciones UUID en queries, protección SSRF en IA y control de acceso a Route Handlers. |
| **Concurrency & Idempotency** | 2 | **PASS** | 🟢 **BAJO** | Row-level locking en base de datos previene ventas de stock < 0 en compras simultáneas. |
| **Browser & HTTP Security** | 2 | **PASS** | 🟢 **BAJO** | Headers HSTS, X-Frame-Options, X-Content-Type-Options y Permissions-Policy activos. |

---

## 2. Comparativa: Validación Frontend vs Validación Backend (Fase 14)

| Operación Sensible | Validación Frontend (UI) | Validación Backend (Server Action / Postgres) | Estado de Seguridad |
|---|---|---|:---:|
| **Stock Disponible** | Botón deshabilidato si stock = 0 | `SELECT stock_disponible ... FOR UPDATE` en RPC Postgres | ✅ **SEGURO** (Servidor autoritativo) |
| **Precio Base** | Muestra precio formateado | Lee `precio_base` de tabla `productos` | ✅ **SEGURO** (Servidor autoritativo) |
| **Recargo Personalizado** | Calcula +15% en Zustand | Calcula +15% sobre precio verificado en DB | ✅ **SEGURO** (Servidor autoritativo) |
| **Costo de Envío** | Muestra tarifas de zona | Lee `precio_agencia` / `precio_domicilio` de DB | ✅ **SEGURO** (Servidor autoritativo) |
| **Descuentos Mayoristas** | Aplica tier en UI según total de piezas | Aplica tier en backend según suma real de cantidades | ✅ **SEGURO** (Servidor autoritativo) |
| **Subida de Comprobante** | Selector de archivo | Valida MIME type, tamaño <= 10MB y ownership en DB | ✅ **SEGURO** (Servidor autoritativo) |
| **Acceso a Panel Admin** | Oculta links en sidebar | Middleware + helper `requireAdmin()` + RLS en DB | ✅ **SEGURO** (Defensa en profundidad) |
| **Generación con IA** | Botón en formulario admin | Check admin + SSRF blacklist (HTTPS, no IPs privadas) | ✅ **SEGURO** (Protección SSRF activa) |
