import { Suspense } from "react";
import LoginForm from "./login-form";

export const metadata = { title: "Iniciar sesión" };

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="text-center text-muted">Cargando...</p>}>
      <LoginForm />
    </Suspense>
  );
}
