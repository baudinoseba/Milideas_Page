# PRODUCTION_READINESS_REPORT.md
## Informe de Evaluación para Despliegue en Staging y Producción
**Proyecto:** Milideas Page
**Fecha:** 2026-08-25
**Auditor Lead:** Senior DevSecOps & Cloud Security Engineer
**Estado:** Evaluación Completada & Ajustes de Configuración Aplicados

---

## 1. Evaluación de Infraestructura y Servicios Cloud

### 1.1 Plataforma de Hosting Recomendada: Vercel Pro
- **SSL/TLS:** Terminado en Edge con TLS 1.3 / 1.2, certificados gestionados automáticamente y renovación sin downtime.
- **Next.js 16 Runtime:** Soporte nativo de Server Actions, streaming SSR, optimización de imágenes y Middleware Edge.
- **Preview Deployments (Staging):** Cada Pull Request o rama `staging` genera automáticamente una URL aislada (`https://milideas-page-git-staging-*.vercel.app`), ideal para pruebas DAST y validaciones previas a producción.

### 1.2 Base de Datos: Supabase Managed Postgres
- **Conectividad:** Pooler de conexiones PgBouncer/Supavisor en puerto 6543 y conexión directa por SSL en puerto 5432.
- **Row Level Security (RLS):** Activado en todas las tablas (`productos`, `pedidos`, `items_pedido`, `encargos`, `items_encargo`, `configuracion_sitio`, `configuracion_logistica`, `perfiles`).
- **RPCs Transaccionales:** `crear_pedido` opera con `FOR UPDATE` para garantizar la consistencia atómica del stock sin condiciones de carrera.

### 1.3 Almacenamiento: Supabase Storage
- `productos`: Bucket público para fotos de piezas del catálogo (con CDN y caché).
- `comprobantes`: Bucket privado. Solo administradores pueden leer comprobantes de pago mediante la policy `comprobantes_storage_admin_read`.
- `sitio`: Bucket para logos y banners institucionales.

---

## 2. Auditoría de Seguridad Aplicada

### 2.1 Cookies y Sesiones
- **JWT en Cookies:** Las cookies `sb-*-auth-token` de Supabase SSR utilizan `HttpOnly`, `SameSite=Lax` y `Secure` cuando se ejecutan bajo HTTPS.
- **Middleware Proxy:** Verifica la validez del token y el claim `es_admin` en cada petición protegida.

### 2.2 Cabeceras HTTP de Seguridad
Configuradas en [`next.config.ts`](file:///c:/Users/Seba/Desktop/Milideas_Page/next.config.ts):
- `Strict-Transport-Security`: `max-age=63072000; includeSubDomains; preload` (fuerza HTTPS durante 2 años).
- `X-Frame-Options`: `DENY` (bloquea ataques de Clickjacking).
- `X-Content-Type-Options`: `nosniff` (previene MIME Confusion).
- `Referrer-Policy`: `strict-origin-when-cross-origin` (protege la privacidad de URLs).
- `Permissions-Policy`: `camera=(), microphone=(), geolocation=(), browsing-topics=()`.
- `Content-Security-Policy`: Restringe la carga de scripts, fuentes e imágenes a orígenes autorizados (`'self'`, Google Fonts, Supabase, Placehold).

### 2.3 Orígenes Autorizados en Server Actions
- `allowedOrigins` dinamizado para incluir `localhost`, `NEXT_PUBLIC_APP_URL`, `process.env.VERCEL_URL` y `*.vercel.app`, evitando bloqueos de CORS o errores 403 en Staging.

---

## 3. Guía Paso a Paso para Desplegar Staging

Para probar la aplicación en un entorno idéntico a producción antes del lanzamiento:

### Paso 1: Crear Proyecto de Staging en Supabase
1. Ingresar a [supabase.com](https://supabase.com) y crear un nuevo proyecto: `milideas-staging`.
2. En el SQL Editor de Supabase, ejecutar todas las migraciones en orden (o usar `supabase db push`):
   - `supabase/migrations/*.sql`
3. Ejecutar `supabase/seed.sql` para cargar los datos sintéticos de prueba.

### Paso 2: Conectar el Repositorio a Vercel
1. En [vercel.com](https://vercel.com), importar el repositorio de GitHub `baudinoseba/Milideas_Page`.
2. En la sección **Environment Variables**, cargar las variables de Staging (según [`.env.example`](file:///c:/Users/Seba/Desktop/Milideas_Page/.env.example)):
   - `NEXT_PUBLIC_SUPABASE_URL`: URL del proyecto de Staging.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Anon Key de Staging.
   - `SUPABASE_SECRET_KEY`: Service Role Key de Staging (privada).
   - `NEXT_PUBLIC_APP_URL`: `https://staging.milideas.com` o la URL de Vercel.
   - `ADMIN_SETUP_SECRET`: Token seguro generado para el entorno.
   - `GEMINI_API_KEY`: API Key de Google AI.

### Paso 3: Ejecución de Pruebas DAST sobre Staging
Una vez desplegado el entorno de Staging:
1. Ejecutar escaneo dinámico con **OWASP ZAP** (Baseline Scan) sobre `https://staging.milideas.com` para verificar cabeceras en vivo, cookies seguras y ausencia de información sensible expuesta.
2. Ejecutar la suite Playwright apuntando a la URL de Staging:
   ```bash
   NEXT_PUBLIC_APP_URL=https://staging.milideas.com npm run test:e2e
   ```

---

## 4. Plan de Rollback y Continuidad Operativa

| Escenario | Acción de Recuperación | Tiempo de Respuesta |
|---|---|:---:|
| **Bug crítico en nuevo despliegue** | Vercel Dashboard -> Deployments -> Selección de versión previa -> *Instant Rollback* | < 5 segundos |
| **Error en base de datos / migración** | Supabase Dashboard -> Database -> Backups -> *Point-in-Time Restore* | < 10 minutos |
| **Falla en servicio de IA (Gemini)** | Fallback automático: la creación de productos continúa de forma manual sin bloquear el admin | Inmediato |
