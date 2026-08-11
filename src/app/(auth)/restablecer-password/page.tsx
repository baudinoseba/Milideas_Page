"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { BackButton } from "@/components/ui/back-button";
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
    <div className="mx-auto max-w-sm">
      <div className="mb-4">
        <BackButton fallbackHref="/login">Volver al login</BackButton>
      </div>

      <Card>
        <h1 className="mb-2 text-xl font-medium">Restablecer contraseña</h1>
        <p className="mb-6 text-xs text-muted">
          Ingresá tu nueva contraseña a continuación para recuperar el acceso a tu cuenta.
        </p>

        {success ? (
          <div className="space-y-4 text-center py-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-foreground">¡Contraseña actualizada!</h2>
              <p className="text-xs text-muted">
                Tu contraseña ha sido modificada con éxito. Ya podés iniciar sesión con tus nuevas credenciales.
              </p>
            </div>
            <Button className="w-full mt-4" onClick={() => router.push("/login")}>
              Iniciar sesión
            </Button>
          </div>
        ) : (
          <form action="/restablecer-password" method="POST" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password">Nueva contraseña</Label>
              <PasswordInput
                id="password"
                name="password"
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                required
                minLength={6}
                placeholder="Repetí tu nueva contraseña"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            {!checkingSession && !hasSession && (
              <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-md border border-amber-200 dark:border-amber-800">
                Aviso: Si no abriste este enlace desde tu correo electrónico, es posible que debas solicitar un nuevo enlace de recuperación.
              </p>
            )}

            <Button type="submit" className="w-full" isLoading={pending}>
              Guardar nueva contraseña
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
