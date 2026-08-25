"use client";

import { useState, useTransition, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GoogleButton } from "@/components/ui/google-button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { loginAction } from "@/lib/actions";
import { BackButton } from "@/components/ui/back-button";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect") ?? "";
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Limpiar parámetros sensibles (email/password) de la barra de direcciones del navegador
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.match(/email|password/i)) {
      const url = new URL(window.location.href);
      url.searchParams.delete("email");
      url.searchParams.delete("password");
      window.history.replaceState(null, "", url.pathname + (url.search ? url.search : ""));
    }
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    if (!email || !password) {
      setError("Por favor ingresá tu email y contraseña.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await loginAction(formData);
        if (result?.error) {
          setError(result.error);
        }
      } catch (err: unknown) {
        const errorObj = err as { digest?: string; message?: string } | null;
        if (errorObj?.digest?.startsWith("NEXT_REDIRECT") || errorObj?.message === "NEXT_REDIRECT") {
          return;
        }
        console.error("Error en login onSubmit:", err);
        setError(errorObj?.message || "Error de conexión al intentar iniciar sesión.");
      }
    });
  };

  return (
    <div className="mx-auto max-w-sm">
      <div className="mb-4">
        <BackButton fallbackHref="/">Volver a la tienda</BackButton>
      </div>
      <Card>
        <h1 className="mb-6 text-xl font-medium">Iniciar sesión</h1>
        <div className="space-y-4">
          <GoogleButton label="Iniciar sesión con Google" disabled={false} nextUrl={redirectParam} />

          <div className="relative my-5 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <span className="relative bg-surface px-2 text-xs uppercase text-muted">o con email</span>
          </div>

          <form method="POST" onSubmit={handleSubmit} className="space-y-4">
            <input type="hidden" name="redirect" value={redirectParam} />

            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required placeholder="tu@email.com" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="password">Contraseña</Label>
              </div>
              <PasswordInput id="password" name="password" required placeholder="••••••••" />

              {/* Popup de error justo debajo del campo de contraseña */}
              {error && (
                <div className="mt-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="relative rounded-xl border border-red-300/80 bg-red-50 p-3 text-xs font-medium text-red-800 shadow-sm dark:border-red-900/60 dark:bg-red-950/60 dark:text-red-200 space-y-1">
                    <p className="flex items-center gap-1.5 font-semibold text-red-900 dark:text-red-100">
                      <span>⚠️</span>
                      <span>Error en los datos</span>
                    </p>
                    <p className="leading-snug">{error}</p>
                  </div>
                </div>
              )}
            </div>

            <Button type="submit" className="w-full cursor-pointer mt-2" isLoading={pending}>
              Entrar
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted">
            ¿No tenés cuenta?{" "}
            <Link href="/registro" className="underline font-medium hover:text-foreground">
              Registrate
            </Link>
          </p>
          <p className="mt-2 text-center text-sm">
            <Link href="/recuperar" className="text-muted underline hover:text-foreground">
              Olvidé mi contraseña
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
