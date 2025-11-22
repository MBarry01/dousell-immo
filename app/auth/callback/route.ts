import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // 1. On récupère l'URL actuelle (que ce soit localhost ou vercel)
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const next = searchParams.get("next") ?? "/";

  // Log pour débugger
  console.log("🔍 Auth Callback Debug:", {
    code: code ? "✓ présent" : "✗ manquant",
    error,
    errorDescription,
    next,
    origin,
  });

  // Si Google renvoie une erreur dans les query params
  if (error) {
    console.error("❌ OAuth Error from Google:", {
      error,
      errorDescription,
    });
    // Rediriger vers la page d'erreur avec un message spécifique
    const errorUrl = new URL(`${origin}/auth/auth-code-error`);
    if (errorDescription) {
      errorUrl.searchParams.set("reason", decodeURIComponent(errorDescription));
    }
    return NextResponse.redirect(errorUrl.toString());
  }

  // Si pas de code, erreur
  if (!code) {
    console.error("❌ No authorization code received");
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  // Échanger le code pour une session
  try {
    const supabase = await createClient();
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (exchangeError) {
      console.error("❌ Error exchanging code for session:", exchangeError);
      // Rediriger vers la page d'erreur avec le détail de l'erreur
      const errorUrl = new URL(`${origin}/auth/auth-code-error`);
      errorUrl.searchParams.set("reason", exchangeError.message);
      return NextResponse.redirect(errorUrl.toString());
    }

    if (data.session) {
      console.log("✅ Session créée avec succès");
      // Rediriger vers la page demandée
      return NextResponse.redirect(`${origin}${next}`);
    }

    // Si pas de session après échange réussi, erreur
    console.error("❌ No session after successful exchange");
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  } catch (err) {
    console.error("❌ Unexpected error in callback:", err);
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }
}

