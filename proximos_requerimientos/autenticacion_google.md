# Próximo Requerimiento: Autenticación con Google (Google OAuth)

**Estado:** Paso 1 Completado (Credenciales generadas y guardadas en `.env.local`)  
**Fecha de registro:** 10 de Agosto de 2026 / Actualizado: 24 de Agosto de 2026  
**Proyecto:** Milideas Arte

---

## 📌 Resumen del Requerimiento

Habilitar el inicio de sesión y registro de usuarios mediante su cuenta de **Google (Google OAuth / One Tap)** para simplificar el acceso a la tienda, la sección mi cuenta y el proceso de checkout.

Actualmente, el botón de Google se muestra en las pantallas de Login, Registro y Checkout con la etiqueta **"PRÓXIMAMENTE"** y en estado deshabilitado (`disabled`), informando visualmente al usuario que la funcionalidad está en desarrollo.

---

## 🛠️ Archivos de Código Preparados en el Proyecto

1. **Componente de Botón de Google:**
   - Ubicación: [google-button.tsx](file:///c:/Users/Seba/Desktop/Milideas_Page/src/components/ui/google-button.tsx)
   - Contiene el badge `PRÓXIMAMENTE` y estado deshabilitado por defecto.

2. **Ruta Callback OAuth PKCE:**
   - Ubicación: [route.ts](file:///c:/Users/Seba/Desktop/Milideas_Page/src/app/auth/callback/route.ts)
   - Procesa la respuesta de Google/Supabase e inicia la sesión.

3. **Vistas donde se muestra:**
   - [login-form.tsx](file:///c:/Users/Seba/Desktop/Milideas_Page/src/app/(auth)/login/login-form.tsx)
   - [page.tsx](file:///c:/Users/Seba/Desktop/Milideas_Page/src/app/(auth)/registro/page.tsx)
   - [checkout-form.tsx](file:///c:/Users/Seba/Desktop/Milideas_Page/src/components/checkout/checkout-form.tsx)

---

## 📋 Pasos Necesarios para Activar la Funcionalidad

### Paso 1: Configurar Google Cloud Console

1. Iniciar sesión en **[Google Cloud Console](https://console.cloud.google.com/)**.
2. Crear o seleccionar un proyecto llamado **Milideas Arte**.
3. Ir a **APIs y servicios** -> **Pantalla de consentimiento de OAuth** *(OAuth consent screen)*:
   - Seleccionar tipo **Externo** *(External)*.
   - Nombre de la aplicación: `Milideas Arte`
   - Correo de soporte del usuario: `baudinoseba@gmail.com`
   - Datos de contacto del desarrollador: `baudinoseba@gmail.com`
   - Guardar y continuar.
4. Ir a **Credenciales** *(Credentials)* -> **+ Crear credenciales** -> **ID de cliente de OAuth** *(OAuth client ID)*:
   - Tipo de aplicación: **Aplicación web**.
   - Nombre: `Milideas Supabase Client`.
   - **Orígenes autorizados de JavaScript**:
     - `http://localhost:3000`
     - `http://192.168.1.19:3000`
     - `https://ollrhpcpwurcpjktljbd.supabase.co`
   - **URIs de redireccionamiento autorizados**:
     - `https://ollrhpcpwurcpjktljbd.supabase.co/auth/v1/callback`
5. Guardar y copiar el **ID de cliente** *(Client ID)* y el **Secreto de cliente** *(Client Secret)*.

---

### Paso 2: Configurar Supabase Dashboard

1. Ingresar a **[Supabase Dashboard](https://supabase.com/dashboard)** en tu proyecto.
2. Ir a **Authentication** -> **Providers** -> **Google**.
3. Marcar la casilla **Enable Sign in with Google**.
4. Pegar el **Client ID** obtenido en Google Cloud Console.
5. Pegar el **Client Secret (for OAuth)** obtenido en Google Cloud Console.
6. Guardar cambios (**Save**).

---

### Paso 3: Activar el Botón en la Interfaz

Para habilitar los clics en el botón, simplemente cambiar la propiedad `disabled={false}` en el componente `GoogleButton` dentro de `login-form.tsx`, `registro/page.tsx` y `checkout-form.tsx`:

```tsx
<GoogleButton label="Iniciar sesión con Google" disabled={false} />
```
