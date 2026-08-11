"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { BackButton } from "@/components/ui/back-button";
import { recuperarPasswordAction } from "@/lib/actions";

export default function RecuperarPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const email = new FormData(e.currentTarget).get("email") as string;
    const redirectTo = `${window.location.origin}/auth/callback?next=/restablecer-password`;

    startTransition(async () => {
      const result = await recuperarPasswordAction(email, redirectTo);
      if (result.error) {
        // If error message is empty or empty object, provide clear diagnostic error
        let msg = result.error;
        if (!msg || msg === "{}" || msg === "[object Object]") {
          msg = "Error en el servidor SMTP de Supabase al enviar el correo. Por favor verificá los datos de tu servidor SMTP (Gmail / Resend) en el panel de Supabase.";
        }
        setError(msg);
        return;
      }
      setSent(true);
    });
  };

  return (
    <div className="mx-auto max-w-sm">
      <div className="mb-4">
        <BackButton fallbackHref="/login">Volver al login</BackButton>
      </div>
      <Card>
        <h1 className="mb-6 text-xl font-medium">Recuperar contraseña</h1>
        {sent ? (
          <div className="space-y-4 text-center py-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-foreground">¡Correo enviado!</h2>
              <p className="text-xs text-muted leading-relaxed">
                Te enviamos un email con instrucciones y el enlace para restablecer tu contraseña.
              </p>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-md border border-amber-200 dark:border-amber-800 mt-2">
                💡 Revisá tu carpeta de <strong>Correo No Deseado / SPAM</strong> si no lo ves en tu bandeja de entrada principal.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email de tu cuenta</Label>
              <Input id="email" name="email" type="email" placeholder="ejemplo@gmail.com" required />
            </div>

            {error && (
              <div className="text-xs text-red-600 bg-red-50 dark:bg-red-950/40 p-3 rounded-md border border-red-200 dark:border-red-800 leading-relaxed">
                <strong>Error al enviar:</strong> {error}
              </div>
            )}

            <Button type="submit" className="w-full" isLoading={pending}>
              Enviar enlace
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
