import { NextResponse } from "next/server";

/**
 * Route de secours pour les anciens liens de confirmation Supabase
 * Redirige vers /auth/callback avec les bons paramètres
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  // Récupérer tous les paramètres possibles
  const token_hash = searchParams.get("token_hash");
  const token = searchParams.get("token");
  const type = searchParams.get("type") || "email";
  const next = searchParams.get("next") || "/";

  console.log("🔄 Redirect from /auth to /auth/callback:", {
    token_hash: token_hash ? "✓ présent" : "✗ manquant",
    token: token ? "✓ présent" : "✗ manquant",
    type,
  });

  // Construire l'URL de callback avec le bon token
  const finalTokenHash = token_hash || token;

  if (finalTokenHash) {
    const callbackUrl = new URL(`${origin}/auth/callback`);
    callbackUrl.searchParams.set("token_hash", finalTokenHash);
    callbackUrl.searchParams.set("type", type);
    callbackUrl.searchParams.set("next", next);

    return NextResponse.redirect(callbackUrl.toString());
  }

  // Si aucun token, rediriger vers la page d'erreur
  return NextResponse.redirect(`${origin}/auth/auth-code-error?reason=No token found`);
}
