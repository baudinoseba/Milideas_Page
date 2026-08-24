import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function getSanitizedOrigin(request: Request): string {
  const hostHeader = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "http";

  if (hostHeader && !hostHeader.includes("0.0.0.0")) {
    return `${proto}://${hostHeader}`;
  }

  const requestUrl = new URL(request.url);
  if (requestUrl.hostname === "0.0.0.0" || requestUrl.hostname.includes("0.0.0.0")) {
    requestUrl.hostname = "localhost";
  }

  return requestUrl.origin;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/cuenta/perfil";

  const origin = getSanitizedOrigin(request);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const sanitizedNext = next.startsWith("/") ? next : `/${next}`;
      const forwardUrl = new URL(sanitizedNext, origin);
      return NextResponse.redirect(forwardUrl);
    }
  }

  // URL fallback if code is missing or error
  const errorUrl = new URL("/login", origin);
  errorUrl.searchParams.set("error", "El enlace de autenticación no es válido o ha expirado.");
  return NextResponse.redirect(errorUrl);
}
