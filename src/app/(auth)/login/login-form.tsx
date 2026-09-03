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
    <div className="w-full">
      <Card className="rounded-3xl border border-[#E5E0D8] bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-chocolate tracking-tight">
            Iniciar sesión
          </h1>
          <p className="mt-1 text-xs text-stone-600 font-sans">
            Ingresá a tu cuenta para ver el estado de tus compras y pedidos.
          </p>
        </div>

        <form method="POST" onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="redirect" value={redirectParam} />

          <div>
            <Label htmlFor="email" className="text-xs font-semibold text-stone-700">
              Email
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
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="password" className="text-xs font-semibold text-stone-700">
                Contraseña
              </Label>
              <Link
                href="/recuperar"
                className="text-[11px] font-medium text-terracota hover:underline"
              >
                Olvidé mi contraseña
              </Link>
            </div>
            <PasswordInput
              id="password"
              name="password"
              required
              placeholder="••••••••"
              className="rounded-xl text-xs bg-[#FAF7F2]/50 border-stone-200 focus:bg-white"
            />

            {error && (
              <div className="mt-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="relative rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-800 shadow-2xs space-y-1">
                  <p className="flex items-center gap-1.5 font-semibold text-red-900">
                    <span>⚠️</span>
                    <span>Error al ingresar</span>
                  </p>
                  <p className="leading-snug">{error}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                name="rememberMe"
                defaultChecked
                className="h-4 w-4 rounded border-stone-300 text-chocolate focus:ring-chocolate/30 accent-chocolate cursor-pointer"
              />
              <span className="text-xs font-medium text-stone-700">Mantener sesión activa</span>
            </label>
          </div>

          <Button
            type="submit"
            className="w-full cursor-pointer mt-2 rounded-xl bg-chocolate hover:bg-chocolate/90 text-crema-cruda font-semibold py-2.5 shadow-2xs transition-all active:scale-[0.98]"
            isLoading={pending}
          >
            Entrar
          </Button>
        </form>

        {/* Separador normalizado: "o continuá con" */}
        <div className="relative my-4 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-stone-200" />
          </div>
          <span className="relative bg-white px-3 text-[11px] font-medium text-stone-500 uppercase tracking-wider">
            o con Google
          </span>
        </div>

        {/* Botón de Google en la parte inferior */}
        <div className="pt-0.5">
          <GoogleButton
            label="Iniciar sesión con Google"
            disabled={false}
            nextUrl={redirectParam}
          />
        </div>

        {/* Registro en español */}
        <div className="pt-2 text-center border-t border-stone-100">
          <p className="text-xs text-stone-600 font-sans">
            ¿No tenés cuenta?{" "}
            <Link
              href="/registro"
              className="font-semibold text-chocolate hover:text-terracota underline underline-offset-2 transition-colors"
            >
              Registrate
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
