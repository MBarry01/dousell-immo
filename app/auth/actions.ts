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

  if (!email || !password || !fullName || !phone) {
    return {
      error: "Tous les champs sont requis",
    };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const emailRedirectTo = `${appUrl}/auth/callback?next=/compte`;

  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: {
        full_name: fullName,
        phone: phone.startsWith("+221") ? phone : `+221${phone}`,
      },
      emailRedirectTo,
      // Force l'envoi de l'email même si l'utilisateur existe déjà (pour tester)
      // En production, retirez cette ligne
      // skipEmailRedirect: false,
    },
  });

  if (error) {
    console.error("Signup error:", error);
    let errorMessage = error.message;
    
    // Messages d'erreur plus explicites
    if (error.message.includes("already registered") || error.message.includes("User already registered")) {
      errorMessage = "Cet email est déjà enregistré. Essayez de vous connecter ou réinitialisez votre mot de passe.";
    } else if (error.message.includes("Password")) {
      errorMessage = "Le mot de passe doit contenir au moins 6 caractères";
    } else if (error.message.includes("Invalid email")) {
      errorMessage = "Adresse email invalide";
    }
    
    return {
      error: errorMessage,
    };
  }

  // Vérifier si l'email a été envoyé
  // Si data.user est null, cela signifie généralement que la confirmation est requise
  // Si data.user existe, l'utilisateur a peut-être été confirmé automatiquement
  if (!data.user) {
    console.error("No user returned from signup - email might not be sent");
    return {
      error: "Erreur lors de la création du compte. Vérifiez votre configuration Supabase.",
    };
  }

  // Vérifier si l'email a été envoyé (data.session est null si la confirmation email est requise)
  const emailSent = !data.session && data.user && !data.user.email_confirmed_at;

  revalidatePath("/", "layout");
  
  return {
    success: true,
    message: emailSent 
      ? "Compte créé ! Un email de vérification a été envoyé à votre adresse. Vérifiez votre boîte de réception (et les spams) pour confirmer votre compte."
      : "Compte créé avec succès !",
    emailSent,
  };
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
  redirect("/compte");
}

export async function signInWithGoogle() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/callback?next=/compte`,
    },
  });

  if (error) {
    console.error("Google OAuth error:", error);
    return {
      error: error.message,
    };
  }

  if (data.url) {
    redirect(data.url);
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

