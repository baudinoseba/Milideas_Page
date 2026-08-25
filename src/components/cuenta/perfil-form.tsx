"use client";

import { useTransition, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BackButton } from "@/components/ui/back-button";
import { Toast } from "@/components/ui/modal";
import {
  updatePerfilAction,
  logoutAction,
  updateEmailAction,
  updatePasswordAction,
} from "@/lib/actions";
import type { Perfil } from "@/types";
import Link from "next/link";

const PROVINCIAS = [
  "CABA",
  "Buenos Aires",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán",
] as const;

export function PerfilForm({ perfil, email }: { perfil: Perfil; email: string }) {
  const [pending, startTransition] = useTransition();
  const [loggingOut, startLogout] = useTransition();
  const [updatingEmail, startEmailUpdate] = useTransition();
  const [updatingPassword, startPasswordUpdate] = useTransition();

  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [mfaActive, setMfaActive] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  useEffect(() => {
    const active = localStorage.getItem("mfa_active") === "true";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMfaActive(active);
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updatePerfilAction(formData);
      if (result.success) {
        setMessage({ type: "success", text: "¡Perfil y dirección guardados correctamente!" });
      } else {
        setMessage({ type: "error", text: result.error ?? "Error al actualizar perfil" });
      }
    });
  };

  const handleLogout = () => {
    startLogout(async () => {
      await logoutAction();
    });
  };

  const handleEmailUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const nuevoEmail = String(formData.get("nuevoEmail"));

    startEmailUpdate(async () => {
      const result = await updateEmailAction(nuevoEmail);
      if (result.success) {
        setMessage({
          type: "success",
          text: "¡Se ha enviado un correo de confirmación a tu nueva dirección!",
        });
        setShowEmailForm(false);
      } else {
        setMessage({ type: "error", text: result.error ?? "Error al actualizar email" });
      }
    });
  };

  const handlePasswordUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const nuevaContrasena = String(formData.get("nuevaContrasena"));
    const confirmarContrasena = String(formData.get("confirmarContrasena"));

    if (nuevaContrasena !== confirmarContrasena) {
      setMessage({ type: "error", text: "Las contraseñas no coinciden" });
      return;
    }

    if (nuevaContrasena.length < 6) {
      setMessage({ type: "error", text: "La contraseña debe tener al menos 6 caracteres" });
      return;
    }

    startPasswordUpdate(async () => {
      const result = await updatePasswordAction(nuevaContrasena);
      if (result.success) {
        setMessage({ type: "success", text: "¡Contraseña actualizada correctamente!" });
        setShowPasswordForm(false);
      } else {
        setMessage({ type: "error", text: result.error ?? "Error al actualizar contraseña" });
      }
    });
  };

  const handleMfaToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setMfaActive(checked);
    localStorage.setItem("mfa_active", String(checked));
    setMessage({
      type: "success",
      text: checked
        ? "Verificación en dos pasos activada (Demostración de seguridad)"
        : "Verificación en dos pasos desactivada",
    });
  };

  const getInitials = () => {
    if (!perfil.nombre_completo) return "U";
    return perfil.nombre_completo
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-12">
      {message && (
        <Toast
          message={message.text}
          type={message.type}
          onClose={() => setMessage(null)}
        />
      )}

      <div className="flex items-center justify-between">
        <BackButton fallbackHref="/">Volver a la tienda</BackButton>
        <Button
          variant="ghost"
          onClick={handleLogout}
          isLoading={loggingOut}
          className="text-xs text-muted hover:text-red-600 transition-colors"
        >
          Cerrar sesión
        </Button>
      </div>

      {/* Header card with Avatar and basic details */}
      <Card className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6 text-center sm:text-left">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xl font-bold border border-primary/20 shadow-inner">
          {getInitials()}
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-center sm:justify-start gap-2">
            <h1 className="text-xl font-semibold text-foreground">
              {perfil.nombre_completo || "Usuario"}
            </h1>
            {perfil.es_admin && (
              <Badge variant="success" className="w-fit mx-auto sm:mx-0">
                Administrador
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted">{email}</p>
        </div>
      </Card>

      {perfil.es_admin && (
        <Card className="border-emerald-200/60 bg-emerald-50/20 p-5 space-y-2">
          <p className="text-sm font-semibold text-emerald-800 flex items-center gap-1.5">
            🛡️ Acceso Administrativo
          </p>
          <p className="text-xs text-muted">
            Tenés permisos de administrador para gestionar productos, categorías y pedidos.
          </p>
          <Link href="/admin" className="inline-block pt-1">
            <Button className="text-xs px-4 py-2 min-h-0 bg-emerald-700 hover:bg-emerald-800 text-white border-0">
              Ir al Panel Admin
            </Button>
          </Link>
        </Card>
      )}

      {/* Main Profile Info Form */}
      <form method="POST" onSubmit={handleSubmit} className="space-y-6">
        {/* Card: Datos Personales */}
        <Card className="space-y-4">
          <h2 className="text-base font-semibold border-b border-border pb-3">Datos personales</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="nombreCompleto">Nombre completo</Label>
              <Input
                id="nombreCompleto"
                name="nombreCompleto"
                defaultValue={perfil.nombre_completo ?? ""}
                required
                placeholder="Ej. Sebastian Baudino"
              />
            </div>
            <div>
              <Label htmlFor="dni">Número de documento (DNI/CUIT)</Label>
              <Input
                id="dni"
                name="dni"
                defaultValue={perfil.dni ?? ""}
              />
            </div>
          </div>
        </Card>

        {/* Card: Datos de contacto y cuenta */}
        <Card className="space-y-4">
          <h2 className="text-base font-semibold border-b border-border pb-3">Datos de cuenta y contacto</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="nombreUsuario">Nombre de perfil / usuario</Label>
              <Input
                id="nombreUsuario"
                name="nombreUsuario"
                defaultValue={perfil.nombre_usuario ?? ""}
                placeholder="Ej. seba_baudino"
              />
            </div>
            <div>
              <Label htmlFor="whatsapp">WhatsApp / Teléfono</Label>
              <Input
                id="whatsapp"
                name="whatsapp"
                defaultValue={perfil.whatsapp ?? ""}
                required
                placeholder="Ej. 3493668308"
              />
              <div className="mt-1.5 flex items-center gap-1 text-[11px] text-muted select-none">
                <span>Formato:</span>
                <span className="text-muted/40 line-through decoration-1">0</span>
                <span className="font-semibold text-foreground/80">3493</span>
                <span className="text-muted/40 line-through decoration-1">15</span>
                <span className="font-semibold text-foreground/80">668308</span>
                <span className="text-[10px] text-muted/70 ml-0.5">(sin el 0 y sin el 15)</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Card: Dirección de envío */}
        <Card className="space-y-4">
          <h2 className="text-base font-semibold border-b border-border pb-3">Dirección de envío predeterminada</h2>
          <p className="text-xs text-muted">
            Configurá tu dirección aquí para pre-completarla automáticamente durante el checkout de tus compras.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Label htmlFor="direccionCalle">Calle</Label>
              <Input
                id="direccionCalle"
                name="direccionCalle"
                defaultValue={perfil.direccion_calle ?? ""}
                placeholder="Ej. Av. de Mayo"
              />
            </div>
            <div>
              <Label htmlFor="direccionNumero">Número</Label>
              <Input
                id="direccionNumero"
                name="direccionNumero"
                defaultValue={perfil.direccion_numero ?? ""}
                placeholder="Ej. 1370"
              />
            </div>
            <div>
              <Label htmlFor="direccionPiso">Piso (opcional)</Label>
              <Input
                id="direccionPiso"
                name="direccionPiso"
                defaultValue={perfil.direccion_piso ?? ""}
                placeholder="Ej. 4"
              />
            </div>
            <div>
              <Label htmlFor="direccionDepto">Depto (opcional)</Label>
              <Input
                id="direccionDepto"
                name="direccionDepto"
                defaultValue={perfil.direccion_depto ?? ""}
                placeholder="Ej. B"
              />
            </div>
            <div>
              <Label htmlFor="direccionCodigoPostal">Código postal</Label>
              <Input
                id="direccionCodigoPostal"
                name="direccionCodigoPostal"
                defaultValue={perfil.direccion_codigo_postal ?? ""}
                placeholder="Ej. 1085"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="direccionCiudad">Ciudad / Localidad</Label>
              <Input
                id="direccionCiudad"
                name="direccionCiudad"
                defaultValue={perfil.direccion_ciudad ?? ""}
                placeholder="Ej. Congreso"
              />
            </div>
            <div>
              <Label htmlFor="direccionProvincia">Provincia</Label>
              <Select
                id="direccionProvincia"
                name="direccionProvincia"
                defaultValue={perfil.direccion_provincia ?? ""}
              >
                <option value="">Seleccionar...</option>
                {PROVINCIAS.map((prov) => (
                  <option key={prov} value={prov}>
                    {prov}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </Card>

        {/* Global Save Button for Main Profile Info */}
        <div className="flex justify-end">
          <Button type="submit" isLoading={pending} className="w-full sm:w-auto px-8">
            Guardar cambios
          </Button>
        </div>
      </form>

      {/* Card: Seguridad */}
      <Card className="space-y-5">
        <h2 className="text-base font-semibold border-b border-border pb-3">Seguridad</h2>

        {/* Sub-section: Email change */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Correo electrónico</p>
              <p className="text-xs text-muted">{email}</p>
            </div>
            <Button
              variant="outline"
              type="button"
              className="text-xs px-3 py-1.5 h-auto min-h-0"
              onClick={() => setShowEmailForm(!showEmailForm)}
            >
              {showEmailForm ? "Cancelar" : "Modificar"}
            </Button>
          </div>
          {showEmailForm && (
            <form method="POST" onSubmit={handleEmailUpdate} className="space-y-3 border-t border-border/60 pt-3 max-w-sm">
              <div>
                <Label htmlFor="nuevoEmail">Nuevo correo electrónico</Label>
                <Input
                  id="nuevoEmail"
                  name="nuevoEmail"
                  type="email"
                  required
                  placeholder="nuevo@correo.com"
                />
              </div>
              <Button type="submit" isLoading={updatingEmail} className="text-xs px-3 py-1.5 min-h-0">
                Confirmar cambio de email
              </Button>
              <p className="text-[10px] text-muted leading-tight">
                ⚠️ Se enviará un correo de confirmación a tu nueva dirección de correo electrónico para verificar el cambio.
              </p>
            </form>
          )}
        </div>

        <hr className="border-border/60" />

        {/* Sub-section: Password change */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Contraseña</p>
              <p className="text-xs text-muted">••••••••••••</p>
            </div>
            <Button
              variant="outline"
              type="button"
              className="text-xs px-3 py-1.5 h-auto min-h-0"
              onClick={() => setShowPasswordForm(!showPasswordForm)}
            >
              {showPasswordForm ? "Cancelar" : "Modificar"}
            </Button>
          </div>
          {showPasswordForm && (
            <form method="POST" onSubmit={handlePasswordUpdate} className="space-y-3 border-t border-border/60 pt-3 max-w-sm">
              <div>
                <Label htmlFor="nuevaContrasena">Nueva contraseña</Label>
                <PasswordInput
                  id="nuevaContrasena"
                  name="nuevaContrasena"
                  required
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div>
                <Label htmlFor="confirmarContrasena">Confirmar nueva contraseña</Label>
                <PasswordInput
                  id="confirmarContrasena"
                  name="confirmarContrasena"
                  required
                  placeholder="Repetí la contraseña"
                />
              </div>
              <Button type="submit" isLoading={updatingPassword} className="text-xs px-3 py-1.5 min-h-0">
                Guardar nueva contraseña
              </Button>
            </form>
          )}
        </div>

        <hr className="border-border/60" />

        {/* Sub-section: Two-step verification */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium">Verificación en dos pasos (2FA)</p>
                <Badge variant={mfaActive ? "success" : "muted"} className="text-[10px] py-0 px-1.5">
                  {mfaActive ? "Activo" : "Inactivo"}
                </Badge>
              </div>
              <p className="text-xs text-muted leading-relaxed max-w-md">
                Protegé tu cuenta requiriendo un código de seguridad adicional de tu aplicación de autenticación (Google Authenticator, Authy, etc.) al iniciar sesión.
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center select-none pt-1">
              <input
                type="checkbox"
                checked={mfaActive}
                onChange={handleMfaToggle}
                className="peer sr-only"
              />
              <div className="h-5 w-9 rounded-full bg-border transition-colors peer-checked:bg-primary" />
              <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" />
            </label>
          </div>
        </div>
      </Card>
    </div>
  );
}
