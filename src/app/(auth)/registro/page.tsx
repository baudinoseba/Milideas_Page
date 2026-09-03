"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GoogleButton } from "@/components/ui/google-button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { registroAction } from "@/lib/actions";

export default function RegistroPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [confirmationNeeded, setConfirmationNeeded] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await registroAction(formData);
      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.requiresConfirmation) {
        setConfirmationNeeded(result.email || "tu correo");
      } else {
        router.push("/?auth=success");
        router.refresh();
      }
    });
  };

  return (
    <div className="w-full">
      <Card className="rounded-3xl border border-[#E5E0D8] bg-white p-6 sm:p-8 shadow-xs space-y-5">
        <div>
          <h1 className="text-2xl font-serif font-bold text-chocolate tracking-tight">
            Crear cuenta
          </h1>
          <p className="mt-1 text-xs text-stone-600 font-sans">
            Completá tus datos para agilizar tus compras y seguir tus encargos.
          </p>
        </div>

        {confirmationNeeded ? (
          <div className="space-y-4 py-2 text-center animate-in fade-in duration-300">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/70 shadow-2xs">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-bold text-stone-900 font-serif">
                ¡Cuenta registrada con éxito!
              </h2>
              <p className="text-xs text-stone-700 leading-relaxed font-sans">
                Te enviamos un email de confirmación a <strong>{confirmationNeeded}</strong>.
              </p>
              <p className="text-[11px] text-stone-500 leading-relaxed">
                Por favor abrí tu correo y hacé clic en el enlace para activar tu cuenta y poder ingresar.
              </p>
            </div>

            <div className="pt-2">
              <Link href="/login">
                <Button className="w-full rounded-xl bg-chocolate hover:bg-chocolate/90 text-crema-cruda font-semibold py-2.5 shadow-2xs">
                  Ir a Iniciar Sesión
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            <form action="/registro" method="POST" onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <Label htmlFor="nombreCompleto" className="text-xs font-semibold text-stone-700">
                  Nombre completo <span className="text-rose-600">*</span>
                </Label>
                <Input
                  id="nombreCompleto"
                  name="nombreCompleto"
                  required
                  placeholder="Ej. Sofía Martínez"
                  className="mt-1 rounded-xl text-xs bg-[#FAF7F2]/50 border-stone-200 focus:bg-white"
                />
              </div>

              <div>
                <Label htmlFor="whatsapp" className="text-xs font-semibold text-stone-700">
                  WhatsApp / Celular <span className="text-rose-600">*</span>
                </Label>
                <Input
                  id="whatsapp"
                  name="whatsapp"
                  required
                  placeholder="Ej. 3493668308"
                  className="mt-1 rounded-xl text-xs bg-[#FAF7F2]/50 border-stone-200 focus:bg-white"
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-xs font-semibold text-stone-700">
                  Email <span className="text-rose-600">*</span>
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="tu@email.com"
                  className="mt-1 rounded-xl text-xs bg-[#FAF7F2]/50 border-stone-200 focus:bg-white"
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-xs font-semibold text-stone-700">
                  Contraseña <span className="text-rose-600">*</span>
                </Label>
                <PasswordInput
                  id="password"
                  name="password"
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  className="mt-1 rounded-xl text-xs bg-[#FAF7F2]/50 border-stone-200 focus:bg-white"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-800">
                  <p className="font-semibold flex items-center gap-1.5">
                    <span>⚠️</span> {error}
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full cursor-pointer mt-2 rounded-xl bg-chocolate hover:bg-chocolate/90 text-crema-cruda font-semibold py-2.5 shadow-2xs transition-all active:scale-[0.98]"
                isLoading={pending}
              >
                Registrarse
              </Button>
            </form>

            <div className="relative my-3 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-200" />
              </div>
              <span className="relative bg-white px-3 text-[11px] font-medium text-stone-500 uppercase tracking-wider">
                o con Google
              </span>
            </div>

            <div>
              <GoogleButton
                label="Registrarse con Google"
                disabled={false}
                nextUrl="/cuenta/perfil"
              />
            </div>

            <div className="pt-2 text-center border-t border-stone-100">
              <p className="text-xs text-stone-600 font-sans">
                ¿Ya tenés cuenta?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-chocolate hover:text-terracota underline underline-offset-2 transition-colors"
                >
                  Iniciar sesión
                </Link>
              </p>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
