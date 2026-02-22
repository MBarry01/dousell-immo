import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

/**
 * Route pour confirmer un email via token
 * Alternative au PKCE pour éviter les erreurs "code verifier not found"
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  // Supabase peut envoyer soit token_hash (nouveau) soit code (ancien)
  const token_hash = searchParams.get("token_hash");
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/";

  console.log("🔍 Auth Confirm Debug:", {
    token_hash: token_hash ? "✓ présent" : "✗ manquant",
    code: code ? "✓ présent" : "✗ manquant",
    type,
    next,
    origin,
  });

  try {
    const supabase = await createClient();

    // Si on a un code (ancien format), utiliser exchangeCodeForSession
    if (code) {
      console.log("📝 Utilisation de exchangeCodeForSession avec code");
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("❌ Error exchanging code:", error);
        return NextResponse.redirect(
          `${origin}/auth/auth-code-error?reason=${encodeURIComponent(error.message)}`
        );
      }

      if (data.session) {
        console.log("✅ Session créée avec succès via code");
        const isSignup = type === "signup" || type === "email";
        const basePath = next ?? "/";
        const redirectUrl = isSignup
          ? `${origin}${basePath}${basePath.includes("?") ? "&" : "?"}welcome=true`
          : `${origin}/?verified=true`;
        return NextResponse.redirect(redirectUrl);
      }
    }

    // Si on a un token_hash (nouveau format), utiliser verifyOtp
    if (token_hash && type) {
      console.log("📝 Utilisation de verifyOtp avec token_hash");
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token_hash as string,
        type: type as any,
      });

      if (error) {
        console.error("❌ Error verifying token:", error);
        return NextResponse.redirect(
          `${origin}/auth/auth-code-error?reason=${encodeURIComponent(error.message)}`
        );
      }

      // Important: Rafraîchir la session pour s'assurer que les cookies sont bien définis
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.error("❌ Session non établie après vérification:", sessionError);
        return NextResponse.redirect(
          `${origin}/auth/auth-code-error?reason=Echec de creation de session`
        );
      }

      console.log("✅ Email vérifié avec succès via token_hash - Session active:", session.user.email);
      // Redirection — ajoute ?welcome=true pour les nouveaux comptes (type signup/email)
      const isSignup = type === "signup" || type === "email";
      const basePath = next ?? "/";
      const redirectUrl = isSignup
        ? `${origin}${basePath}${basePath.includes("?") ? "&" : "?"}welcome=true`
        : `${origin}${basePath}`;
      return NextResponse.redirect(redirectUrl);
    }

    // Si aucun token valide
    console.error("❌ No valid token provided");
    return NextResponse.redirect(
      `${origin}/auth/auth-code-error?reason=Token manquant ou invalide`
    );
  } catch (err) {
    console.error("❌ Unexpected error in confirm:", err);
    return NextResponse.redirect(
      `${origin}/auth/auth-code-error?reason=Erreur inattendue`
    );
  }
}
