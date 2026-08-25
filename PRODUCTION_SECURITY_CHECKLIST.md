# PRODUCTION_SECURITY_CHECKLIST.md
## Security Gate & Production Readiness Checklist — Milideas Page
**Fecha:** 2026-08-25
**Evaluación:** Pre-Deployment a Staging y Producción

---

## 1. Auditoría de Código y Lógica de Negocio
- [x] **Código auditado:** Reglas de validación y sanitización implementadas en todas las Server Actions.
- [x] **Dependencias auditadas:** Sin vulnerabilidades críticas conocidas (`npm audit` verificado).
- [x] **Secretos auditados:** Historial de Git limpio, `.env.local` excluido de gitignore.
- [x] **Recálculo de precios server-side:** El total y subtotales se calculan exclusivamente en Postgres / servidor.
- [x] **Control de stock atómico:** Uso de `FOR UPDATE` en Postgres para prevenir sobreventas o stock negativo.
- [x] **Protección contra Privilege Escalation:** `makeMeAdminAction` bloqueada con `ADMIN_SETUP_SECRET`.
- [x] **Protección SSRF en IA:** Bloqueo de rangos de red privados y metadata cloud en `generarDescripcionProductoIAAction`.
- [x] **Validación de subidas de archivos:** Whitelist MIME y límite de 10MB en todos los endpoints de upload.

---

## 2. Automatización y Pruebas
- [x] **Tests unitarios y de lógica (Vitest):** 14/14 PASS (`npm run test`).
- [x] **Tests E2E en navegador real (Playwright):** 21/21 PASS (`npm run test:e2e`).
- [x] **Suite de regresión CI/CD:** GitHub Actions workflow configurado para ejecutar Lint, Typecheck, Tests y Build en cada PR.

---

## 3. Infraestructura, Red y Seguridad HTTP
- [x] **Cabeceras HTTP de seguridad:** HSTS, X-Frame-Options (DENY), X-Content-Type-Options (nosniff), Permissions-Policy activos.
- [x] **Content-Security-Policy (CSP):** Directivas configuradas en `next.config.ts`.
- [x] **Orígenes de Server Actions:** `allowedOrigins` dinamizado para admitir dominios de Staging y Producción.
- [x] **Cookies seguras:** Flags `HttpOnly`, `SameSite=Lax` y `Secure` bajo HTTPS.
- [x] **Bucket de comprobantes privado:** RLS en Storage revoca lectura anónima y restringe a administradores.

---

## 4. Tareas Pendientes para el Despliegue en Staging
- [ ] **Crear proyecto de Staging en Supabase:** Aplicar migraciones `supabase/migrations/*.sql` y datos de `supabase/seed.sql`.
- [ ] **Configurar Variables de Entorno en Vercel:** Cargar variables de Staging según `.env.example`.
- [ ] **Ejecutar escaneo DAST (OWASP ZAP):** Sobre la URL activa de Staging (`https://staging.milideas.com` o preview de Vercel).
- [ ] **Verificar flujo E2E sobre Staging:** Confirmar login con Google OAuth y flujo de checkout en la nube.
