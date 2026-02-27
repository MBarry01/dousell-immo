import { updateSession } from "@/utils/supabase/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { contextStorage } from "./lib/context";

export async function proxy(request: NextRequest) {
  const requestId = globalThis.crypto?.randomUUID() || Math.random().toString(36).substring(7);

  // Détection robuste du host (Vercel utilise x-forwarded-host)
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  const hostname = request.nextUrl.hostname;
  const pathname = request.nextUrl.pathname;

  // RÈGLE SOUS-DOMAINE : app.dousel.com -> /gestion
  const isAppSubdomain = host.startsWith("app.") || hostname.startsWith("app.");

  if (isAppSubdomain && !pathname.startsWith('/gestion') && !pathname.startsWith('/api')) {
    const url = request.nextUrl.clone();
    url.pathname = `/gestion${pathname}`;

    // On doit quand même exécuter la logique de session/auth
    const sessionResponse = await updateSession(request);

    // Si l'auth demande une redirection (ex: vers /login), on l'honore
    if (sessionResponse.headers.get("location")) {
      return sessionResponse;
    }

    // Sinon, on effectue le REWRITE vers /gestion
    const response = NextResponse.rewrite(url);

    // On recopie les headers de session (cookies) dans la réponse du rewrite
    sessionResponse.headers.forEach((value, key) => {
      response.headers.set(key, value);
    });

    // Headers de debug
    response.headers.set("x-debug-host", host);
    response.headers.set("x-debug-rewrite", "true");
    response.headers.set("x-debug-target", url.pathname);
    response.headers.set("x-middleware-active", "true");
    return response;
  }

  // Traitement classique pour dousel.com
  const response = await contextStorage.run({ requestId, route: pathname }, async () => {
    return await updateSession(request);
  });

  if (response instanceof NextResponse) {
    response.headers.set("x-pathname", pathname);
    response.headers.set("x-debug-host", host);
    response.headers.set("x-debug-rewrite", "false");
    response.headers.set("x-middleware-active", "true");
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
