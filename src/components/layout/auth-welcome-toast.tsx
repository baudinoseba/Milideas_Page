"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function AuthWelcomeToast() {
  const searchParams = useSearchParams();
  const authSuccess = searchParams.get("auth") === "success";
  const [visible, setVisible] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [perfilIncompleto, setPerfilIncompleto] = useState(false);

  useEffect(() => {
    if (!authSuccess) return;

    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        // Obtener nombre y datos del perfil
        const { data: profile } = await supabase
          .from("perfiles")
          .select("nombre_completo, telefono, direccion_calle")
          .eq("id", user.id)
          .single();

        const nombre =
          profile?.nombre_completo ||
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          "Cliente";

        setUserName(nombre);

        // Verificar si falta teléfono o dirección
        const faltaDatos = !profile?.telefono || !profile?.direccion_calle;
        setPerfilIncompleto(faltaDatos);
        setVisible(true);

        // Limpiar query param de la URL sin recargar
        const url = new URL(window.location.href);
        url.searchParams.delete("auth");
        window.history.replaceState(null, "", url.pathname + (url.search ? url.search : ""));

        // Auto ocultar a los 4 segundos si los datos están completos
        if (!faltaDatos) {
          const timer = setTimeout(() => {
            setVisible(false);
          }, 4000);
          return () => clearTimeout(timer);
        }
      }
    });
  }, [authSuccess]);

  if (!visible) return null;

  return (
    <div className="fixed top-20 right-4 z-50 max-w-sm w-full animate-in slide-in-from-top-4 fade-in duration-300">
      <div className="rounded-2xl border border-terracota/30 bg-surface/95 backdrop-blur-md p-4 shadow-xl space-y-2 text-foreground">
        
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <div>
              <p className="text-xs font-bold text-chocolate font-sans">
                ¡Hola {userName || "bienvenido/a"}!
              </p>
              <p className="text-[11px] text-muted">
                Has iniciado sesión con éxito.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setVisible(false)}
            className="text-muted hover:text-foreground text-xs p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {perfilIncompleto && (
          <div className="pt-2 border-t border-border/40 space-y-2">
            <p className="text-[11px] text-barro leading-tight">
              Podés completar tus datos de envío en tu perfil para agilizar tus futuras compras.
            </p>
            <div className="flex items-center gap-2">
              <Link
                href="/cuenta/perfil"
                onClick={() => setVisible(false)}
                className="rounded-full bg-terracota text-white px-3.5 py-1 text-[11px] font-semibold hover:bg-terracota/90 shadow-2xs transition-all"
              >
                Completar datos →
              </Link>
              <button
                type="button"
                onClick={() => setVisible(false)}
                className="text-[11px] text-muted hover:underline cursor-pointer"
              >
                Más tarde
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
