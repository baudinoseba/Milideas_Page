import { Suspense } from "react";
import { redirect } from "next/navigation";
import LoginForm from "./login-form";

export const metadata = { title: "Iniciar sesión | Milideas" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  // Si la URL contiene parámetros sensibles (email/password) de una petición GET previa, limpiarla de inmediato con redirect del servidor
  if (params.email || params.password) {
    const redirectTarget = typeof params.redirect === "string" ? params.redirect : undefined;
    const cleanUrl = redirectTarget ? `/login?redirect=${encodeURIComponent(redirectTarget)}` : "/login";
    redirect(cleanUrl);
  }

  return (
    <Suspense fallback={<p className="text-center text-muted py-8">Cargando...</p>}>
      <LoginForm />
    </Suspense>
  );
}
