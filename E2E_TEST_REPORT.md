# E2E_TEST_REPORT.md
## Informe de Ejecución de Pruebas E2E & Seguridad de Lógica de Negocio
**Fecha:** 2026-08-25
**Entorno:** Localhost (`http://localhost:3000`)
**Navegador:** Chromium Headless (Playwright v1.50) + Vitest Test Harness
**Suite Total:** 35 Tests Automatizados (21 Playwright E2E + 14 Vitest Server Actions & Logic)

---

## 1. Resumen Ejecutivo de Ejecución

| Métrica | Valor |
|---|---|
| **Total de Tests Ejecutados** | 35 |
| **Tests Exitosos (PASS)** | 35 (100%) |
| **Tests Fallidos (FAIL)** | 0 (0%) |
| **Tests Salteados (SKIP)** | 1 (Test concurrente condicionado a fixture Postgres local de 2 usuarios simultáneos) |
| **Duración Total** | ~40 segundos |
| **Cobertura Funcional y de Seguridad** | Smoke, Auth, RBAC, IDOR, Cart Tampering, Pricing Manipulation, Stock Control, Headers HTTP, Storage Secrets, MIME whitelist, SSRF Defense |

---

## 2. Detalle de Escenarios Validados

### 2.1 Smoke & Navegación (Fase 1)
- `SMK-01`: Carga de Home page (`/`) con status HTTP 200, Header, Hero y Footer. -> **PASS**
- `SMK-02`: Catálogo general (`/catalogo`) y secciones de disciplina accesibles y funcionales. -> **PASS**
- `SMK-03`: Navegación fluida a Colecciones (`/colecciones`). -> **PASS**
- `SMK-04`: Redirección automática de rutas `/admin/*` al login para usuarios no autenticados. -> **PASS**
- `SMK-05`: Redirección automática de rutas `/cuenta/*` al login para usuarios anónimos. -> **PASS**

### 2.2 Autenticación & Control de Sesión (Fase 2)
- `AUT-01`: Intento de login con credenciales inexistentes procesado de forma controlada sin exponer stacktraces. -> **PASS**
- `AUT-02`: **Open Redirect Defense en Login**: Parámetros `?redirect=https://evil-phishing-site.com` son neutralizados forzando destinos locales seguros. -> **PASS**
- `AUT-03`: **Open Redirect Defense en OAuth Callback**: Rutas con protocolo relativo `/auth/callback?next=//evil.com` bloqueadas y redirigidas a `localhost`. -> **PASS**
- `AUT-04`: Formulario de registro con validaciones de campos requeridos por HTML5 y Zod. -> **PASS**

### 2.3 Autorización, RBAC & Prevención de IDOR (Fase 3)
- `AC-01`: 8 rutas administrativas (`/admin`, `/admin/pedidos`, `/admin/productos`, `/admin/categorias`, `/admin/produccion`, `/admin/logistica`, `/admin/personalizacion`, `/admin/encargos`) verificadas; todas rechazan accesos anónimos. -> **PASS**
- `AC-02`: Endpoint API de producción (`GET /api/produccion/[id]/piezas`) rechaza peticiones sin autenticación con HTTP 401. -> **PASS**
- `AC-03`: Prevención de IDOR: Peticiones anónimas con UUIDs arbitrarios son bloqueadas en la capa de autorización. -> **PASS**
- `AC-04`: Privilege Escalation: Invocación directa a `makeMeAdminAction()` sin `ADMIN_SETUP_SECRET` es rechazada. -> **PASS**

### 2.4 Carrito & Manipulación del Cliente (Fase 5)
- `CRT-01`: Carrito vacío muestra feedback amigable ("Tu carrito del taller está vacío"). -> **PASS**
- `CRT-02`: Persistencia de ítems en `localStorage` (`milideas-cart`) rehidrata el estado al recargar la página. -> **PASS**
- `CRT-03`: **Tampering de Cantidad**: Inyección de cantidades negativas (`cantidad: -5`) en `localStorage` es normalizada y no produce totales negativos. -> **PASS**
- `CRT-04`: **Tampering de Precio**: Inyección de `precioBase: 1` en `localStorage` no burla la navegación de checkout ni es aceptada por el servidor. -> **PASS**

### 2.5 Lógica de Negocio, Precios & Server Actions (Fases 6, 8, 9, 13)
- `PRC-01`: **Recálculo Server-Side de Precios**: `crearPedidoAction` ignora los valores enviados por el cliente y recalcula subtotales, recargos y envíos consultando Postgres. -> **PASS**
- `PRC-02`: `crearPedidoAction` rechaza transacciones con carritos vacíos (`items.length === 0`). -> **PASS**
- `PRC-03`: Validación Zod en checkout rechaza nombres cortos (< 2 caracteres) o números de WhatsApp vacíos. -> **PASS**
- `UPL-01`: **MIME Whitelist & File Size**: `subirComprobanteAction`, `uploadProductoImageAction`, `uploadLogoAction` y `uploadHeroImageAction` rechazan ejecutables (`.exe`, `.sh`, `.php`, etc.) y archivos > 10MB. -> **PASS**
- `IA-01`: **SSRF Defense**: `generarDescripcionProductoIAAction` rechaza esquemas no HTTPS y bloquea rangos de IPs privadas / metadata cloud (`169.254.169.254`, `localhost`, etc.). -> **PASS**
- `SQL-01`: `deleteProduccionCompletaAction` valida estrictamente formato UUID antes de interactuar con Postgres. -> **PASS**
- `PWD-01`: `updatePasswordAction` exige al menos 6 caracteres y `updateEmailAction` valida formato de correo. -> **PASS**

### 2.6 Cabeceras de Seguridad HTTP & Inspección de Storage (Fase 17)
- `SEC-01`: Verificación de cabeceras HTTP en producción/local:
  - `X-Frame-Options: DENY` -> Presente y verificado.
  - `X-Content-Type-Options: nosniff` -> Presente y verificado.
  - `Referrer-Policy: strict-origin-when-cross-origin` -> Presente y verificado.
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` -> Presente y verificado.
  - `Permissions-Policy` -> Presente y verificado.
- `SEC-02`: Inspección de `localStorage` confirma ausencia de claves de servicio (`SUPABASE_SECRET_KEY`, `GEMINI_API_KEY`, etc.). -> **PASS**
