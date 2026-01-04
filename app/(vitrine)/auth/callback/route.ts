import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // 1. On récupère l'URL actuelle (que ce soit localhost ou vercel)
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type"); // email, signup, recovery, etc.
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const next = searchParams.get("next") ?? "/";

  // Log pour débugger
  console.log("🔍 Auth Callback Debug:", {
    code: code ? "✓ présent" : "✗ manquant",
    token_hash: token_hash ? "✓ présent" : "✗ manquant",
    type,
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

  const supabase = await createClient();

  // FLUX 1 : Vérification Email via Token Hash (Email Confirmation)
  // 💡 C'est ce flux qui permet le cross-browser (clic sur mobile, ouverture sur PC)
  if (token_hash && type) {
    console.log("🔐 Email confirmation flow (token_hash) - Cross-browser compatible");
    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        type: type === 'email' || type === 'signup' ? 'email' : type as any,
        token_hash,
      });

      if (verifyError) {
        console.error("❌ Error verifying OTP:", verifyError);
        const errorUrl = new URL(`${origin}/auth/auth-code-error`);
        errorUrl.searchParams.set("reason", verifyError.message);
        return NextResponse.redirect(errorUrl.toString());
      }

      if (data.session) {
        console.log("✅ Email verified, session created");
        return NextResponse.redirect(`${origin}/?verified=true`);
      }

      console.error("❌ No session after OTP verification");
      return NextResponse.redirect(`${origin}/auth/auth-code-error`);
    } catch (err) {
      console.error("❌ Unexpected error in OTP verification:", err);
      return NextResponse.redirect(`${origin}/auth/auth-code-error`);
    }
  }

  // FLUX 2 : OAuth/PKCE Flow (Google, Magic Link avec Code)
  if (!code) {
    console.error("❌ No authorization code or token_hash received");
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  // Échanger le code pour une session
  try {
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
      console.log("👤 Utilisateur connecté:", data.user?.email);

      // Si c'est une vérification d'email (type=signup), rediriger vers la home avec un message de succès
      const isEmailVerification = searchParams.get("type") === "signup" ||
        searchParams.get("type") === "email";

      if (isEmailVerification) {
        console.log("✅ Email vérifié - redirection vers la home");
        return NextResponse.redirect(`${origin}/?verified=true`);
      }

      // Sinon, rediriger vers la page demandée
      // MAIS : Vérifier si c'est un locataire pour le rediriger vers le portail
      // Rediriger vers la page demandée (ou / par défaut)
      const redirectUrl = `${origin}${next}`;


      return NextResponse.redirect(redirectUrl);
    }

    // Si pas de session après échange réussi, erreur
    console.error("❌ No session after successful exchange");
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  } catch (err) {
    console.error("❌ Unexpected error in callback:", err);
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }
}

