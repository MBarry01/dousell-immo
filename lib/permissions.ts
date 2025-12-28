import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export type UserRole = "admin" | "moderateur" | "agent" | "superadmin";

/**
 * Récupère tous les rôles d'un utilisateur
 */
export async function getUserRoles(userId: string): Promise<UserRole[]> {
  try {
    const supabase = await createClient();
    
    // Essayer d'abord la fonction RPC (bypass RLS)
    const { data: rpcData, error: rpcError } = await supabase.rpc("get_user_roles", {
      target_user_id: userId,
    });

    if (!rpcError && rpcData && Array.isArray(rpcData)) {
      // Même si le tableau est vide, retourner le résultat (l'utilisateur n'a simplement pas de rôles)
      if (rpcData.length > 0) {
        console.log("✅ getUserRoles - Rôles récupérés via RPC:", userId, rpcData);
      }
      return rpcData as UserRole[];
    }

    // Si la fonction RPC n'existe pas ou retourne une erreur, essayer la requête directe
    if (rpcError) {
      // Si l'erreur indique que la fonction n'existe pas, continuer avec le fallback
      if (rpcError.code === "42883" || rpcError.message?.includes("does not exist") || rpcError.message?.includes("function")) {
        console.warn("⚠️ getUserRoles - Fonction RPC get_user_roles n'existe pas encore. Utilisation du fallback pour:", userId);
      } else {
        console.warn("⚠️ getUserRoles - Erreur RPC get_user_roles:", {
          code: rpcError.code,
          message: rpcError.message,
          userId,
        });
      }
    }

    // Fallback: Requête directe (peut être bloquée par RLS)
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (error) {
      // Si erreur RLS, logger pour debug
      if (error.code === "PGRST301" || error.code === "42501" || error.message?.includes("permission denied") || error.message?.includes("row-level security")) {
        console.warn("⚠️ getUserRoles - RLS bloque l'accès aux rôles pour:", userId, "Code:", error.code);
      } else {
        console.warn("⚠️ getUserRoles - Erreur lors de la récupération des rôles:", {
          code: error.code,
          message: error.message,
          userId,
        });
      }
      return [];
    }

    if (!data) {
      console.warn("⚠️ getUserRoles - Aucune donnée retournée pour:", userId);
      return [];
    }

    const roles = data.map((r) => r.role as UserRole);
    if (roles.length > 0) {
      console.log("✅ getUserRoles - Rôles récupérés via requête directe:", userId, roles);
    }
    return roles;
  } catch (err) {
    console.warn("Error in getUserRoles:", err);
    return [];
  }
}

/**
 * Récupère les rôles de l'utilisateur actuel
 */
export async function getCurrentUserRoles(): Promise<UserRole[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  return await getUserRoles(user.id);
}

/**
 * Vérifie si l'utilisateur a au moins un des rôles spécifiés
 */
export async function hasAnyRole(roles: UserRole[]): Promise<boolean> {
  const userRoles = await getCurrentUserRoles();
  return roles.some((role) => userRoles.includes(role));
}

/**
 * Vérifie si l'utilisateur a un rôle spécifique
 */
export async function hasRole(role: UserRole): Promise<boolean> {
  const userRoles = await getCurrentUserRoles();
  return userRoles.includes(role);
}

/**
 * Vérifie si l'utilisateur est admin ou superadmin (fallback email)
 */
export async function isAdminOrSuperadmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const userRoles = await getUserRoles(user.id);
  const isAdmin = userRoles.includes("admin") || userRoles.includes("superadmin");
  const isAdminViaEmail = user.email?.toLowerCase() === "barrymohamadou98@gmail.com";

  return isAdmin || isAdminViaEmail;
}

/**
 * Système de permissions par page/action
 */
export const PERMISSIONS = {
  // Dashboard
  "admin.dashboard.view": ["admin", "moderateur", "agent", "superadmin"],

  // Biens
  "admin.properties.view": ["admin", "moderateur", "agent", "superadmin"],
  "admin.properties.create": ["admin", "agent", "superadmin"],
  "admin.properties.edit": ["admin", "moderateur", "agent", "superadmin"],
  "admin.properties.delete": ["admin", "superadmin"],

  // Modération
  "admin.moderation.view": ["admin", "moderateur", "superadmin"],
  "admin.moderation.approve": ["admin", "moderateur", "superadmin"],
  "admin.moderation.reject": ["admin", "moderateur", "superadmin"],

  // Leads/Messages
  "admin.leads.view": ["admin", "moderateur", "agent", "superadmin"],
  "admin.leads.manage": ["admin", "moderateur", "agent", "superadmin"],

  // Utilisateurs
  "admin.users.view": ["admin", "superadmin"],
  "admin.users.manage": ["admin", "superadmin"],

  // Rôles
  "admin.roles.view": ["admin", "superadmin"],
  "admin.roles.manage": ["admin", "superadmin"],
  "admin.roles.manage_superadmin": ["superadmin"], // Seul superadmin peut gérer les superadmins
} as const;

export type Permission = keyof typeof PERMISSIONS;

/**
 * Vérifie si l'utilisateur a la permission spécifiée
 */
export async function hasPermission(permission: Permission): Promise<boolean> {
  const userRoles = await getCurrentUserRoles();
  const allowedRoles = PERMISSIONS[permission];

  // Vérifier si l'utilisateur a un des rôles autorisés
  const hasAllowedRole = allowedRoles.some((role) => userRoles.includes(role));

  // Fallback: Si l'utilisateur est barrymohamadou98@gmail.com, il a tous les droits
  if (!hasAllowedRole) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.email?.toLowerCase() === "barrymohamadou98@gmail.com") {
      return true;
    }
  }

  return hasAllowedRole;
}

/**
 * Requiert que l'utilisateur ait au moins un rôle (redirige si non)
 */
export async function requireAnyRole(roles: UserRole[] = ["admin", "moderateur", "agent", "superadmin"]) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login?redirect=/admin");
    }

    const userRoles = await getUserRoles(user.id);
    const hasRole = roles.some((role) => userRoles.includes(role));
    const isAdminViaEmail = user.email?.toLowerCase() === "barrymohamadou98@gmail.com";

    // Debug: Log pour comprendre pourquoi l'accès est refusé
    if (!hasRole && !isAdminViaEmail) {
      console.warn("🔒 requireAnyRole - Accès refusé", {
        email: user.email,
        userId: user.id,
        rolesRecuperes: userRoles,
        rolesRequis: roles,
        hasRole,
        isAdminViaEmail,
      });
      redirect("/compte");
    }

    console.log("✅ requireAnyRole - Accès autorisé", {
      email: user.email,
      roles: userRoles,
      rolesRequis: roles,
    });

    return user;
  } catch (error) {
    // Si c'est une redirection Next.js, la laisser passer
    if (error && typeof error === "object" && "digest" in error && typeof error.digest === "string" && error.digest.includes("NEXT_REDIRECT")) {
      throw error;
    }
    console.warn("requireAnyRole: Error during auth check:", error);
    redirect("/compte");
  }
}

/**
 * Requiert une permission spécifique (redirige si non)
 */
export async function requirePermission(permission: Permission) {
  const hasAccess = await hasPermission(permission);
  if (!hasAccess) {
    redirect("/compte");
  }
}

