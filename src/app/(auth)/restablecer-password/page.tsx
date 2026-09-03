"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { updatePasswordAction } from "@/lib/actions";
import { createClient } from "@/lib/supabase/client";

export default function RestablecerPasswordPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
      setCheckingSession(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setHasSession(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden. Por favor verificá los datos.");
      return;
    }

    startTransition(async () => {
      const result = await updatePasswordAction(password);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess(true);
    });
  };

  return (
    <div className="w-full">
      <Card className="rounded-3xl border border-[#E5E0D8] bg-white p-6 sm:p-8 shadow-xs space-y-5">
        <div>
          <h1 className="text-2xl font-serif font-bold text-chocolate tracking-tight">
            Restablecer contraseña
          </h1>
          <p className="mt-1 text-xs text-stone-600 font-sans">
            Ingresá tu nueva clave para volver a acceder a tu cuenta de Milideas.
          </p>
        </div>

        {success ? (
          <div className="space-y-4 py-2 text-center animate-in fade-in duration-300">
            {/* Icono de checkmark limpio y cálido (sin fondos grises oscuros) */}
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/70 shadow-2xs">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-bold text-stone-900 font-serif">
                ¡Contraseña actualizada con éxito!
              </h2>
              <p className="text-xs text-stone-700 leading-relaxed font-sans">
                Tu clave ha sido modificada. Ya podés iniciar sesión normalmente con tus nuevas credenciales.
              </p>
            </div>

            <div className="pt-3">
              <Button
                className="w-full rounded-xl bg-chocolate hover:bg-chocolate/90 text-crema-cruda font-semibold py-2.5 shadow-2xs cursor-pointer transition-all active:scale-[0.98]"
                onClick={() => router.push("/login")}
              >
                Iniciar sesión ahora
              </Button>
            </div>
          </div>
        ) : (
          <form method="POST" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password" className="text-xs font-semibold text-stone-700">
                Nueva contraseña
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

            <div>
              <Label htmlFor="confirmPassword" className="text-xs font-semibold text-stone-700">
                Confirmar nueva contraseña
              </Label>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                required
                minLength={6}
                placeholder="Repetí tu nueva contraseña"
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

            {!checkingSession && !hasSession && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-stone-800 space-y-1">
                <p className="font-bold text-amber-900 flex items-center gap-1.5">
                  <span>ℹ️</span> Aviso
                </p>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  Si no abriste este enlace desde tu correo electrónico, es posible que debas solicitar un nuevo enlace de recuperación.
                </p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full cursor-pointer mt-1 rounded-xl bg-chocolate hover:bg-chocolate/90 text-crema-cruda font-semibold py-2.5 shadow-2xs transition-all active:scale-[0.98]"
              isLoading={pending}
            >
              Guardar nueva contraseña
            </Button>

            <div className="pt-2 text-center border-t border-stone-100">
              <Link
                href="/login"
                className="text-xs font-semibold text-stone-600 hover:text-chocolate underline underline-offset-2 transition-colors"
              >
                ← Volver a iniciar sesión
              </Link>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
