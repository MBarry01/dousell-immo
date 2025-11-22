import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { requireAnyRole, type UserRole } from "@/lib/permissions";

/**
 * Authorized admin email (fallback pour compatibilité)
 */
const AUTHORIZED_ADMIN_EMAIL = "barrymohamadou98@gmail.com";

/**
 * Vérifie si un utilisateur a un rôle spécifique
 */
async function hasRole(userId: string, role: UserRole): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", role)
      .single();

    if (error || !data) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if the current user is authorized to access admin routes
 * Redirects to /compte if not authorized
 * 
 * @deprecated Utilisez requireAnyRole() à la place pour un système de permissions plus flexible
 */
export async function requireAdmin() {
  // Utiliser requireAnyRole pour la compatibilité
  return await requireAnyRole(["admin", "superadmin"]);
}

/**
 * Check if the current user is an admin (without redirecting)
 * Useful for conditional rendering
 */
export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  // Vérifier d'abord via les rôles
  const isAdminViaRole = await hasRole(user.id, "admin");
  
  // Fallback sur l'email pour compatibilité
  const isAdminViaEmail = user.email?.toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase();

  return isAdminViaRole || isAdminViaEmail;
}

/**
 * Check if the current user is a moderator
 */
export async function isModerator(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  return await hasRole(user.id, "moderateur");
}

/**
 * Check if the current user has a specific role
 */
export async function userHasRole(role: UserRole): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  return await hasRole(user.id, role);
}

