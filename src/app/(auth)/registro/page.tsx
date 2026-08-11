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

import { BackButton } from "@/components/ui/back-button";

export default function RegistroPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await registroAction(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push("/");
      router.refresh();
    });
  };

  return (
    <div className="mx-auto max-w-sm">
      <div className="mb-4">
        <BackButton fallbackHref="/login">Volver</BackButton>
      </div>
      <Card>
        <h1 className="mb-6 text-xl font-medium">Crear cuenta</h1>
        <div className="space-y-4">
          <GoogleButton label="Registrarse con Google" disabled={true} />

          <div className="relative my-5 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <span className="relative bg-surface px-2 text-xs uppercase text-muted">o con email</span>
          </div>

          <form action="/registro" method="POST" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nombreCompleto">Nombre completo</Label>
            <Input id="nombreCompleto" name="nombreCompleto" required />
          </div>
          <div>
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input id="whatsapp" name="whatsapp" required />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div>
            <Label htmlFor="password">Contraseña</Label>
            <PasswordInput id="password" name="password" required minLength={6} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" isLoading={pending}>
            Registrarse
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="underline">
            Iniciar sesión
          </Link>
        </p>
        </div>
      </Card>
    </div>
  );
}
