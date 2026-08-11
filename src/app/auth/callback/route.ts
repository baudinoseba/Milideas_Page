import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/cuenta/perfil";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const forwardUrl = new URL(next, request.url);
      return NextResponse.redirect(forwardUrl);
    }
  }

  // URL fallback if code is missing or expired
  const errorUrl = new URL("/login", request.url);
  errorUrl.searchParams.set("error", "El enlace de recuperación ha expirado o no es válido.");
  return NextResponse.redirect(errorUrl);
}
