"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/cuenta/perfil";
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Limpiar parámetros sensibles (email/password) de la URL si quedaron de una petición GET previa
  useEffect(() => {
    if (typeof window !== "undefined" && (searchParams.has("email") || searchParams.has("password"))) {
      const url = new URL(window.location.href);
      url.searchParams.delete("email");
      url.searchParams.delete("password");
      const cleanSearch = url.searchParams.toString();
      window.history.replaceState({}, "", url.pathname + (cleanSearch ? `?${cleanSearch}` : ""));
    }
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await loginAction(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push(redirect);
      router.refresh();
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
          <GoogleButton label="Iniciar sesión con Google" disabled={true} />

          <div className="relative my-5 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <span className="relative bg-surface px-2 text-xs uppercase text-muted">o con email</span>
          </div>

          <form action="/login" method="POST" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div>
            <Label htmlFor="password">Contraseña</Label>
            <PasswordInput id="password" name="password" required />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" isLoading={pending}>
            Entrar
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted">
          ¿No tenés cuenta?{" "}
          <Link href="/registro" className="underline">
            Registrate
          </Link>
        </p>
        <p className="mt-2 text-center text-sm">
          <Link href="/recuperar" className="text-muted underline">
            Olvidé mi contraseña
          </Link>
        </p>
        </div>
      </Card>
    </div>
  );
}
