"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { loginAction } from "@/lib/actions";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/cuenta/perfil";
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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
      <Card>
        <h1 className="mb-6 text-xl font-medium">Iniciar sesión</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div>
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" name="password" type="password" required />
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
      </Card>
    </div>
  );
}
