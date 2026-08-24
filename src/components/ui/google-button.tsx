"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface GoogleButtonProps {
  redirectTo?: string;
  nextUrl?: string;
  label?: string;
  disabled?: boolean;
}

export function GoogleButton({
  redirectTo,
  nextUrl,
  label = "Continuar con Google",
  disabled = false,
}: GoogleButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    if (disabled || loading) return;
    setLoading(true);
    try {
      const supabase = createClient();
      let origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
      if (origin.includes("0.0.0.0")) {
        origin = origin.replace("0.0.0.0", "localhost");
      }

      const targetNext = nextUrl ?? redirectTo ?? "/cuenta/perfil";

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(targetNext)}`,
        },
      });

      if (error) {
        console.error("Error signing in with Google:", error.message);
        setLoading(false);
      }
    } catch (err) {
      console.error("Connection error:", err);
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full">
      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleSignIn}
        disabled={disabled || loading}
        className={`w-full relative flex items-center justify-center gap-2.5 bg-surface hover:bg-arena/50 text-chocolate border border-border/80 font-medium transition-all py-2.5 shadow-xs ${
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-terracota/40"
        }`}
      >
        {loading ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-terracota border-t-transparent" />
        ) : (
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.29v3.15C3.26 21.3 7.37 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27a7.22 7.22 0 0 1 0-4.54V6.58H1.29a11.98 11.98 0 0 0 0 10.84l3.99-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.26 2.7 1.29 6.58l3.99 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
        )}
        <span className="text-xs sm:text-sm font-semibold">{label}</span>
      </Button>
    </div>
  );
}
