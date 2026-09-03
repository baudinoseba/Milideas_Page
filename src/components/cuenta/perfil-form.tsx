"use client";

import { useTransition, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/stores/toast-store";
import {
  updatePerfilAction,
  updateEmailAction,
  updatePasswordAction,
} from "@/lib/actions";
import { cn } from "@/lib/utils/cn";
import type { Perfil } from "@/types";

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
  const [updatingPassword, startPasswordUpdate] = useTransition();
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updatePerfilAction(formData);
      if (result.success) {
        toast.success("¡Perfil y dirección guardados correctamente!");
      } else {
        toast.error(result.error ?? "Error al actualizar perfil");
      }
    });
  };

  const handlePasswordUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const nuevaContrasena = String(formData.get("nuevaContrasena"));
    const confirmarContrasena = String(formData.get("confirmarContrasena"));

    if (nuevaContrasena !== confirmarContrasena) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    if (nuevaContrasena.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    startPasswordUpdate(async () => {
      const result = await updatePasswordAction(nuevaContrasena);
      if (result.success) {
        toast.success("¡Contraseña actualizada correctamente!");
        setShowPasswordModal(false);
      } else {
        toast.error(result.error ?? "Error al actualizar contraseña");
      }
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
    <div className="space-y-6 pb-20 w-full">
      {/* ─── Tarjeta Principal de Identidad de Usuario ─── */}
      <div className="rounded-3xl border border-[#E5E0D8] bg-white p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-5">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#FAF7F2] text-chocolate text-xl font-bold font-serif border border-[#E5E0D8] shadow-2xs">
            {getInitials()}
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <h1 className="text-xl font-serif font-bold text-chocolate">
                {perfil.nombre_completo || "Usuario"}
              </h1>
              {perfil.es_admin ? (
                <span className="rounded-full bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-0.5 text-[11px] border border-emerald-300 shadow-2xs">
                  🛡️ Administrador
                </span>
              ) : (
                <span className="rounded-full bg-stone-100 text-stone-700 font-semibold px-2.5 py-0.5 text-[11px] border border-stone-200">
                  👤 Cliente
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 font-sans">{email}</p>
          </div>
        </div>

        {/* Botón de Acceso Admin Integrado si es Administrador */}
        {perfil.es_admin && (
          <Link href="/admin">
            <Button className="rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2.5 min-h-10 shadow-xs flex items-center gap-2 cursor-pointer">
              <span>🛡️</span>
              <span>Ir al Panel Admin</span>
              <span>→</span>
            </Button>
          </Link>
        )}
      </div>

      {/* ─── Formulario Principal de Perfil y Dirección ─── */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Card: Datos Personales y de Contacto */}
        <section className="rounded-3xl border border-[#E5E0D8] bg-[#FAF7F2]/80 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="border-b border-[#E5E0D8] pb-3 flex items-center gap-2">
            <span className="text-lg">📋</span>
            <div>
              <h2 className="text-sm sm:text-base font-serif font-bold text-chocolate">
                Datos Personales & Contacto
              </h2>
              <p className="text-[11px] text-stone-600">
                Información para facturación de compras, envíos y coordinación de encargos.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="nombreCompleto" className="text-xs font-bold text-stone-800">
                Nombre Completo <span className="text-rose-600">*</span>
              </Label>
              <Input
                id="nombreCompleto"
                name="nombreCompleto"
                defaultValue={perfil.nombre_completo ?? ""}
                required
                placeholder="Ej. Sebastian Baudino"
                className="rounded-xl text-xs bg-white mt-1"
              />
            </div>

            <div>
              <Label htmlFor="dni" className="text-xs font-bold text-stone-800">
                DNI / CUIT <span className="text-rose-600">*</span>
              </Label>
              <Input
                id="dni"
                name="dni"
                defaultValue={perfil.dni ?? ""}
                required
                placeholder="Ej. 43248253"
                className="rounded-xl text-xs bg-white mt-1"
              />
            </div>

            <div>
              <Label htmlFor="whatsapp" className="text-xs font-bold text-stone-800">
                WhatsApp / Teléfono <span className="text-rose-600">*</span>
              </Label>
              <Input
                id="whatsapp"
                name="whatsapp"
                defaultValue={perfil.whatsapp ?? ""}
                required
                placeholder="Ej. 3493664420"
                className="rounded-xl text-xs bg-white mt-1"
              />
              <p className="text-[10px] text-stone-500 mt-1">
                Formato: <strong className="text-stone-700">3493 668308</strong> (sin 0 y sin 15)
              </p>
            </div>
          </div>
        </section>

        {/* Card: Dirección de Envío Predeterminada */}
        <section className="rounded-3xl border border-[#E5E0D8] bg-[#FAF7F2]/80 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="border-b border-[#E5E0D8] pb-3 flex items-center gap-2">
            <span className="text-lg">📍</span>
            <div>
              <h2 className="text-sm sm:text-base font-serif font-bold text-chocolate">
                Dirección de Envío Predeterminada
              </h2>
              <p className="text-[11px] text-stone-600">
                Se autocompletará en tus compras y pedidos para que no tengas que escribirla cada vez.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-6">
            <div className="sm:col-span-4">
              <Label htmlFor="direccionCalle" className="text-xs font-bold text-stone-800">
                Calle
              </Label>
              <Input
                id="direccionCalle"
                name="direccionCalle"
                defaultValue={perfil.direccion_calle ?? ""}
                placeholder="Ej. Tucumán"
                className="rounded-xl text-xs bg-white mt-1"
              />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="direccionNumero" className="text-xs font-bold text-stone-800">
                Número
              </Label>
              <Input
                id="direccionNumero"
                name="direccionNumero"
                defaultValue={perfil.direccion_numero ?? ""}
                placeholder="Ej. 232"
                className="rounded-xl text-xs bg-white mt-1"
              />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="direccionPiso" className="text-xs font-bold text-stone-800">
                Piso (opcional)
              </Label>
              <Input
                id="direccionPiso"
                name="direccionPiso"
                defaultValue={perfil.direccion_piso ?? ""}
                placeholder="Ej. 4"
                className="rounded-xl text-xs bg-white mt-1"
              />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="direccionDepto" className="text-xs font-bold text-stone-800">
                Depto (opcional)
              </Label>
              <Input
                id="direccionDepto"
                name="direccionDepto"
                defaultValue={perfil.direccion_depto ?? ""}
                placeholder="Ej. B"
                className="rounded-xl text-xs bg-white mt-1"
              />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="direccionCodigoPostal" className="text-xs font-bold text-stone-800">
                Código Postal
              </Label>
              <Input
                id="direccionCodigoPostal"
                name="direccionCodigoPostal"
                defaultValue={perfil.direccion_codigo_postal ?? ""}
                placeholder="Ej. S2322"
                className="rounded-xl text-xs bg-white mt-1"
              />
            </div>

            <div className="sm:col-span-3">
              <Label htmlFor="direccionCiudad" className="text-xs font-bold text-stone-800">
                Ciudad / Localidad
              </Label>
              <Input
                id="direccionCiudad"
                name="direccionCiudad"
                defaultValue={perfil.direccion_ciudad ?? ""}
                placeholder="Ej. Sunchales"
                className="rounded-xl text-xs bg-white mt-1"
              />
            </div>

            <div className="sm:col-span-3">
              <Label htmlFor="direccionProvincia" className="text-xs font-bold text-stone-800">
                Provincia
              </Label>
              <Select
                id="direccionProvincia"
                name="direccionProvincia"
                defaultValue={perfil.direccion_provincia ?? ""}
                className="rounded-xl text-xs bg-white mt-1"
              >
                <option value="">Seleccionar provincia...</option>
                {PROVINCIAS.map((prov) => (
                  <option key={prov} value={prov}>
                    {prov}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </section>

        {/* ─── Botón Flotante: "Guardar" ─── */}
        <div className="fixed bottom-6 right-4 sm:right-6 z-40">
          <Button
            type="submit"
            isLoading={pending}
            className="rounded-full bg-chocolate text-crema-cruda hover:bg-chocolate/90 px-5 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-bold shadow-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5 border border-white/20 backdrop-blur-md"
          >
            <span>💾</span>
            <span>Guardar</span>
          </Button>
        </div>
      </form>

      {/* ─── Card: Seguridad y Autenticación ─── */}
      <section className="rounded-3xl border border-[#E5E0D8] bg-[#FAF7F2]/80 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="border-b border-[#E5E0D8] pb-3 flex items-center gap-2">
          <span className="text-lg">🔒</span>
          <div>
            <h2 className="text-sm sm:text-base font-serif font-bold text-chocolate">
              Seguridad & Accesos
            </h2>
            <p className="text-[11px] text-stone-600">
              Administrá tus credenciales y opciones de protección de cuenta.
            </p>
          </div>
        </div>

        <div className="divide-y divide-[#E5E0D8] space-y-3">
          {/* Correo Electrónico (Informativo) */}
          <div className="pt-2 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-stone-800">Correo Electrónico</p>
              <p className="text-xs text-stone-600 font-mono mt-0.5">{email}</p>
            </div>
            <span className="text-[11px] font-medium text-stone-400 bg-stone-100 px-2.5 py-1 rounded-lg">
              Cuenta vinculada
            </span>
          </div>

          {/* Contraseña */}
          <div className="pt-3 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-stone-800">Contraseña</p>
              <p className="text-xs text-stone-500 tracking-widest mt-0.5">••••••••••••</p>
            </div>
            <Button
              variant="outline"
              type="button"
              className="rounded-xl text-xs bg-white hover:bg-stone-50 font-semibold px-3 py-1.5 h-auto min-h-0 border-stone-300 cursor-pointer"
              onClick={() => setShowPasswordModal(true)}
            >
              Modificar
            </Button>
          </div>
        </div>
      </section>

      {/* ─── MODAL: MODIFICAR CONTRASEÑA ─── */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl border border-[#E5E0D8] bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="font-serif font-bold text-chocolate text-base">Cambiar Contraseña</h3>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div>
                <Label htmlFor="nuevaContrasena" className="text-xs font-bold text-stone-800">
                  Nueva Contraseña (mínimo 6 caracteres)
                </Label>
                <PasswordInput
                  id="nuevaContrasena"
                  name="nuevaContrasena"
                  required
                  placeholder="••••••••"
                  className="rounded-xl text-xs bg-stone-50 mt-1"
                />
              </div>
              <div>
                <Label htmlFor="confirmarContrasena" className="text-xs font-bold text-stone-800">
                  Confirmar Nueva Contraseña
                </Label>
                <PasswordInput
                  id="confirmarContrasena"
                  name="confirmarContrasena"
                  required
                  placeholder="••••••••"
                  className="rounded-xl text-xs bg-stone-50 mt-1"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPasswordModal(false)}
                  className="rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  isLoading={updatingPassword}
                  className="rounded-xl bg-chocolate text-crema-cruda text-xs font-bold px-4"
                >
                  Guardar Contraseña
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
