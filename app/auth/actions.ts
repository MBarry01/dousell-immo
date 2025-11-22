"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;
  const phone = formData.get("phone") as string;

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

  // Validation du téléphone (9 chiffres)
  const phoneDigits = phone.replace(/\D/g, "");
  if (phoneDigits.length !== 9) {
    return {
      error: "Le numéro de téléphone doit contenir 9 chiffres",
    };
  }

  // Validation du nom complet
  if (fullName.trim().length < 2) {
    return {
      error: "Le nom complet doit contenir au moins 2 caractères",
    };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
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
      console.error("Signup error:", error);
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
      } else if (error.message.includes("rate limit") || error.message.includes("too many")) {
        errorMessage = "Trop de tentatives. Veuillez réessayer dans quelques minutes.";
      } else {
        // Message générique pour les autres erreurs
        errorMessage = "Erreur lors de la création du compte. Veuillez réessayer.";
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
    console.error("Unexpected signup error:", err);
    return {
      error: "Une erreur inattendue s'est produite. Veuillez réessayer.",
    };
  }
}

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return {
      error: "Email et mot de passe requis",
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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectTo = `${appUrl}/auth/callback?next=/`;

  console.log("🔍 OAuth Google - Configuration:", {
    appUrl,
    redirectTo,
    hasAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
  });

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
    console.log("✅ OAuth URL générée avec succès:", data.url);
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
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/callback?next=/compte/reset-password`,
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

