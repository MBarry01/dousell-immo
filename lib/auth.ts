"use client";

import { createClient } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";

export type AuthUser = User | null;

/**
 * Get current user session
 */
export async function getCurrentUser(): Promise<AuthUser> {
  const {
    data: { user },
  } = await createClient().auth.getUser();
  return user;
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await createClient().auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) {
    console.error("Supabase signIn error:", error);
    // Provide more user-friendly error messages
    if (error.message.includes("Invalid login credentials") || error.status === 400) {
      throw new Error("Email ou mot de passe incorrect");
    }
    if (error.message.includes("Email not confirmed")) {
      throw new Error("Veuillez confirmer votre email avant de vous connecter");
    }
    if (error.message.includes("User not found")) {
      throw new Error("Aucun compte trouvé avec cet email");
    }
    throw new Error(error.message || "Erreur lors de la connexion");
  }
  return data;
}

/**
 * Sign up with email and password
 */
export async function signUp(
  email: string,
  password: string,
  metadata?: { full_name?: string; phone?: string }
) {
  const { data, error } = await createClient().auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: metadata || {},
    },
  });
  if (error) {
    console.error("Supabase signUp error:", error);
    // Provide more user-friendly error messages
    if (error.message.includes("User already registered") || error.message.includes("already registered")) {
      throw new Error("Cet email est déjà enregistré");
    }
    if (error.message.includes("Password") || error.message.includes("password")) {
      throw new Error("Le mot de passe doit contenir au moins 6 caractères");
    }
    if (error.status === 400) {
      throw new Error("Données invalides. Vérifiez votre email et mot de passe");
    }
    throw new Error(error.message || "Erreur lors de l'inscription");
  }
  return data;
}

/**
 * Sign out
 */
export async function signOut() {
  const { error } = await createClient().auth.signOut();
  if (error) throw error;
}

/**
 * Reset password
 */
export async function resetPassword(email: string) {
  const { error } = await createClient().auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/compte/reset-password`,
  });
  if (error) throw error;
}

