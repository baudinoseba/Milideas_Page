"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
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
        let msg = result.error;
        if (!msg || msg === "{}" || msg === "[object Object]") {
          msg = "Error al enviar el correo de recuperación. Por favor verificá el email ingresado.";
        }
        setError(msg);
        return;
      }
      setSent(true);
    });
  };

  return (
    <div className="w-full">
      <Card className="rounded-3xl border border-[#E5E0D8] bg-white p-6 sm:p-8 shadow-xs space-y-5">
        <div>
          <h1 className="text-2xl font-serif font-bold text-chocolate tracking-tight">
            Recuperar contraseña
          </h1>
          <p className="mt-1 text-xs text-stone-600 font-sans">
            Ingresá tu email y te enviaremos un enlace seguro para crear una nueva contraseña.
          </p>
        </div>

        {sent ? (
          <div className="space-y-4 py-2 text-center animate-in fade-in duration-300">
            {/* Icono de sobre naranja / terracota cálido (sin fondos grises oscuros ni verdes) */}
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
                ¡Correo enviado con éxito!
              </h2>
              <p className="text-xs text-stone-700 leading-relaxed font-sans">
                Te enviamos un email con las instrucciones y el enlace para restablecer tu contraseña.
              </p>

              {/* Mensaje en fondo blanco con borde suave y texto oscuro nítido */}
              <div className="mt-3 rounded-2xl border border-stone-200 bg-white p-3.5 text-left text-xs text-stone-800 shadow-2xs space-y-1">
                <p className="font-bold text-stone-900 flex items-center gap-1.5">
                  <span>💡</span> Consejo útil:
                </p>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  Si no lo encontrás en tu bandeja de entrada en unos minutos, revisá tu carpeta de <strong>Correo No Deseado / SPAM</strong>.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <Link href="/login">
                <Button className="w-full rounded-xl bg-chocolate hover:bg-chocolate/90 text-crema-cruda font-semibold py-2.5 shadow-2xs">
                  Volver al inicio de sesión
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-xs font-semibold text-stone-700">
                Email de tu cuenta
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="ejemplo@gmail.com"
                required
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
              className="w-full cursor-pointer rounded-xl bg-chocolate hover:bg-chocolate/90 text-crema-cruda font-semibold py-2.5 shadow-2xs transition-all active:scale-[0.98]"
              isLoading={pending}
            >
              Enviar enlace de recuperación
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
