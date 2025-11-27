"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { checkPasswordHIBPServer } from "@/app/actions/check-hibp";
import { getBaseUrl } from "@/lib/utils";

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;
  const phone = formData.get("phone") as string;
  const turnstileToken = formData.get("turnstileToken") as string;

  // Validation des champs
  if (!email || !password || !fullName || !phone) {
    return {
      error: "Tous les champs sont requis",
    };
  }

  // Validation de l'email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return {
      error: "Adresse email invalide",
    };
  }

  // Validation du mot de passe
  if (password.length < 6) {
    return {
      error: "Le mot de passe doit contenir au moins 6 caractères",
    };
  }

  // Vérification HIBP (côté serveur, pas de CORS)
  const hibpResult = await checkPasswordHIBPServer(password);
  if (!hibpResult.success) {
    // Soft-fail : log l'erreur mais continue l'inscription
    console.warn("HIBP check failed:", hibpResult.error);
    // On continue quand même l'inscription pour ne pas bloquer l'utilisateur
  } else if (hibpResult.breached) {
    // Hard-fail : mot de passe compromis, bloquer l'inscription
    return {
      error: hibpResult.error || "Ce mot de passe a été compromis. Choisissez-en un autre plus sécurisé.",
    };
  }

  // Validation du téléphone (format international accepté)
  const phoneDigits = phone.replace(/\D/g, "");
  // Accepter les numéros internationaux (au moins 8 chiffres, max 15 selon E.164)
  if (phoneDigits.length < 8 || phoneDigits.length > 15) {
    return {
      error: "Numéro de téléphone invalide",
    };
  }

  // Validation du nom complet
  if (fullName.trim().length < 2) {
    return {
      error: "Le nom complet doit contenir au moins 2 caractères",
    };
  }

  // Vérification Turnstile
  if (!turnstileToken) {
    return {
      error: "Vérification anti-robot requise. Veuillez réessayer.",
    };
  }

  const verification = await verifyTurnstileToken(turnstileToken);
  if (!verification.success) {
    return {
      error: verification.error || "Vérification anti-robot échouée. Veuillez réessayer.",
    };
  }

  const appUrl = getBaseUrl();
  const emailRedirectTo = `${appUrl}/auth/callback?next=/`;

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          phone: phoneDigits.startsWith("+221") ? phoneDigits : `+221${phoneDigits}`,
        },
        emailRedirectTo,
      },
    });

    if (error) {
      // 🚨 LOG COMPLET DE L'ERREUR SUPABASE POUR DEBUGGING
      console.error("🚨 ERREUR SUPABASE SIGNUP :", error);
      console.error("🚨 ERREUR SUPABASE SIGNUP (détails):", {
        message: error.message,
        code: error.code,
        status: error.status,
        name: error.name,
        cause: error.cause,
        stack: error.stack,
      });
      // Log JSON complet
      try {
        console.error("🚨 ERREUR SUPABASE SIGNUP (JSON):", JSON.stringify(error, null, 2));
      } catch (e) {
        console.error("🚨 Impossible de sérialiser l'erreur en JSON");
      }
      
      let errorMessage = error.message;
      
      // Messages d'erreur plus explicites et en français
      if (error.message.includes("already registered") || 
          error.message.includes("User already registered") ||
          error.message.includes("already exists")) {
        errorMessage = "Cet email est déjà enregistré. Essayez de vous connecter ou réinitialisez votre mot de passe.";
      } else if (error.message.includes("Password") || error.message.includes("password")) {
        errorMessage = "Le mot de passe doit contenir au moins 6 caractères";
      } else if (error.message.includes("Invalid email") || error.message.includes("invalid")) {
        errorMessage = "Adresse email invalide";
      } else if (
        error.message.includes("rate limit") || 
        error.message.includes("too many") ||
        error.message.includes("rate_limit_exceeded") ||
        error.code === "429"
      ) {
        errorMessage = "Trop de tentatives de connexion. Pour votre sécurité, veuillez attendre 5 minutes avant de réessayer.";
      } else if (error.message.includes("signup_disabled") || error.message.includes("signup disabled")) {
        errorMessage = "Les inscriptions sont temporairement désactivées. Veuillez réessayer plus tard.";
      } else if (error.message.includes("Email rate limit exceeded")) {
        errorMessage = "Trop d'emails envoyés. Veuillez attendre quelques minutes avant de réessayer.";
      } else if (error.message.includes("Failed to send")) {
        errorMessage = "Erreur d'envoi d'email. Veuillez vérifier votre adresse email ou réessayer plus tard.";
      } else if (error.message.includes("Error sending confirmation email")) {
        // C'est souvent une erreur SMTP
        errorMessage = "Erreur technique lors de l'envoi de l'email. Contactez le support ou réessayez.";
        // Log spécifique pour aider le développeur
        console.error("⚠️ ERREUR SMTP PROBABLE : Vérifiez la configuration SMTP dans le Dashboard Supabase (Authentication > SMTP Settings). Assurez-vous que le mot de passe d'application est correct.");
      } else {
        // En développement, afficher le message d'erreur complet pour le debugging
        if (process.env.NODE_ENV === "development") {
          errorMessage = `Erreur: ${error.message} (Code: ${error.code || "N/A"})`;
        } else {
          errorMessage = "Erreur lors de la création du compte. Veuillez réessayer ou contactez le support.";
        }
      }
      
      return {
        error: errorMessage,
      };
    }

    // Gestion des différents cas de création de compte
    if (!data.user) {
      console.error("No user returned from signup");
      return {
        error: "Erreur lors de la création du compte. Veuillez réessayer.",
      };
    }

    // Détecter si l'email de confirmation est requis
    // Si data.session existe, l'utilisateur est automatiquement connecté (auto-confirm activé)
    // Si data.session est null mais data.user existe, l'email de confirmation est requis
    const isAutoConfirmed = !!data.session;
    const emailConfirmationRequired = !isAutoConfirmed && !data.user.email_confirmed_at;

    // Supabase envoie automatiquement l'email via SMTP configuré dans le dashboard
    // Pas besoin de logique personnalisée

    revalidatePath("/", "layout");
    
    // Si l'utilisateur est automatiquement confirmé, on peut le rediriger directement
    if (isAutoConfirmed && data.session) {
      return {
        success: true,
        message: "Compte créé avec succès ! Vous êtes maintenant connecté.",
        emailSent: false,
        autoConfirmed: true,
        session: data.session,
      };
    }

    // Si l'email de confirmation est requis
    return {
      success: true,
      message: emailConfirmationRequired
        ? "Compte créé ! Un email de vérification a été envoyé à votre adresse. Vérifiez votre boîte de réception (et les spams) pour confirmer votre compte."
        : "Compte créé avec succès !",
      emailSent: emailConfirmationRequired,
      autoConfirmed: false,
    };
  } catch (err) {
    // 🚨 LOG COMPLET DE L'ERREUR INATTENDUE
    console.error("🚨 ERREUR INATTENDUE SIGNUP :", err);
    if (err instanceof Error) {
      console.error("🚨 ERREUR INATTENDUE (détails):", {
        message: err.message,
        name: err.name,
        stack: err.stack,
        cause: err.cause,
      });
    }
    return {
      error: "Une erreur inattendue s'est produite. Veuillez réessayer.",
    };
  }
}

/**
 * Renvoyer l'email de confirmation
 * Utilise la méthode native de Supabase Auth avec SMTP configuré
 */
export async function resendConfirmationEmail(email: string) {
  try {
    const supabase = await createClient();
    const appUrl = getBaseUrl();
    const emailRedirectTo = `${appUrl}/auth/callback?next=/`;

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo,
      },
    });

    if (error) {
      console.error("Erreur lors du renvoi de l'email de confirmation:", error);
      return {
        success: false,
        error: error.message || "Erreur lors de l'envoi de l'email de confirmation",
      };
    }

    return {
      success: true,
      message: "Email de confirmation renvoyé ! Vérifiez votre boîte de réception.",
    };
  } catch (error) {
    console.error("Erreur inattendue lors du renvoi de l'email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inattendue",
    };
  }
}

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const turnstileToken = formData.get("turnstileToken") as string;

  if (!email || !password) {
    return {
      error: "Email et mot de passe requis",
    };
  }

  // Vérification Turnstile
  if (!turnstileToken) {
    return {
      error: "Vérification anti-robot requise. Veuillez réessayer.",
    };
  }

  const verification = await verifyTurnstileToken(turnstileToken);
  if (!verification.success) {
    return {
      error: verification.error || "Vérification anti-robot échouée. Veuillez réessayer.",
    };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) {
    console.error("Login error:", error);
    let errorMessage = "Email ou mot de passe incorrect";
    
    if (error.message.includes("Email not confirmed")) {
      errorMessage = "Veuillez confirmer votre email avant de vous connecter";
    } else if (error.message.includes("Invalid login credentials")) {
      errorMessage = "Email ou mot de passe incorrect";
    } else if (
      error.message.includes("rate limit") || 
      error.message.includes("too many") ||
      error.message.includes("rate_limit_exceeded") ||
      error.code === "429"
    ) {
      errorMessage = "Trop de tentatives. Pour votre sécurité, veuillez attendre 5 minutes avant de réessayer.";
    }

    return {
      error: errorMessage,
    };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signInWithGoogle() {
  const supabase = await createClient();

  // Détection automatique de l'URL (pour Vercel et localhost)
  const appUrl = getBaseUrl();
  const redirectTo = `${appUrl}/auth/callback?next=/`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
    },
  });

  if (error) {
    console.error("❌ Google OAuth error:", error);
    return {
      error: error.message,
    };
  }

  if (data.url) {
    redirect(data.url);
  } else {
    console.error("❌ No OAuth URL returned");
    return {
      error: "Impossible de générer l'URL OAuth. Vérifiez la configuration Supabase.",
    };
  }
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function resetPassword(email: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getBaseUrl()}/auth/callback?next=/compte/reset-password`,
  });

  if (error) {
    console.error("Reset password error:", error);
    return {
      error: error.message,
    };
  }

  return {
    success: true,
    message: "Email de réinitialisation envoyé",
  };
}

