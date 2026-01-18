"use server";

import { createClient } from "@/utils/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Créer une notification quand un rôle est accordé
 */
async function createRoleNotification(
  userId: string,
  role: UserRole,
  supabase: SupabaseClient
) {
  try {
    const roleLabels: Record<UserRole, string> = {
      admin: "Administrateur",
      moderateur: "Modérateur",
      agent: "Agent",
      superadmin: "Super Administrateur",
    };

    // Utiliser notifyUser pour bénéficier du service role client
    const { notifyUser } = await import("@/lib/notifications");
    await notifyUser({
      userId,
      type: "success",
      title: "Nouveau rôle accordé",
      message: `Le rôle "${roleLabels[role]}" vous a été accordé. Vous pouvez maintenant accéder au panel admin.`,
      resourcePath: "/admin",
    });
  } catch (notificationError) {
    console.error("Error creating role notification:", notificationError);
    // Ne pas bloquer si la notification échoue
  }
}

/**
 * Créer une notification quand un rôle est retiré
 */
async function createRoleRevokedNotification(
  userId: string,
  role: UserRole
) {
  try {
    const roleLabels: Record<UserRole, string> = {
      admin: "Administrateur",
      moderateur: "Modérateur",
      agent: "Agent",
      superadmin: "Super Administrateur",
    };

    // Utiliser notifyUser pour bénéficier du service role client
    const { notifyUser } = await import("@/lib/notifications");
    await notifyUser({
      userId,
      type: "warning",
      title: "Rôle retiré",
      message: `Votre rôle "${roleLabels[role]}" a été retiré.`,
      resourcePath: "/compte",
    });
  } catch (notificationError) {
    console.error("Error creating role revoked notification:", notificationError);
    // Ne pas bloquer si la notification échoue
  }
}

export type UserRole = "admin" | "moderateur" | "agent" | "superadmin";

export interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  roles: UserRole[];
  created_at: string;
}

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: UserRole;
  granted_by: string | null;
  created_at: string;
}

/**
 * Récupère tous les utilisateurs avec leurs rôles
 */
export async function getUsersWithRoles(): Promise<UserWithRole[]> {
  await requireAdmin();
  const supabase = await createClient();

  try {
    // Essayer d'abord d'utiliser la fonction SQL (si elle existe)
    const { data: rpcData, error: rpcError } = await supabase.rpc("get_users_with_roles");

    // Si la fonction SQL fonctionne et retourne des données, les utiliser
    if (!rpcError && rpcData && Array.isArray(rpcData)) {
      // Mapper les résultats de la fonction SQL (même si le tableau est vide)
      const mappedData = rpcData.map((row: { id: string; email?: string; full_name?: string; phone?: string; roles?: UserRole[]; created_at?: string }) => ({
        id: row.id,
        email: row.email || "",
        full_name: row.full_name || null,
        phone: row.phone || null,
        roles: (row.roles || []) as UserRole[],
        created_at: row.created_at || new Date().toISOString(),
      }));
      
      // Si on a des données, les retourner
      if (mappedData.length > 0) {
        return mappedData;
      }
      // Si le tableau est vide mais pas d'erreur, la fonction SQL fonctionne mais il n'y a pas d'utilisateurs
      // On continue avec le fallback pour être sûr
      console.log("Function get_users_with_roles returned empty array, trying fallback...");
    }
    
    // Si erreur sur la fonction SQL, logger mais continuer avec le fallback
    if (rpcError) {
      console.warn("Error calling get_users_with_roles function:", rpcError);
      console.log("Falling back to direct table queries...");
    }

    // Fallback: Récupérer tous les user_roles
    const { data: userRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id, role, created_at")
      .order("created_at", { ascending: false });

    // Gérer les erreurs (y compris les objets vides)
    if (rolesError) {
      const errorCode = rolesError.code || "";
      const errorMessage = rolesError.message || "";
      const errorDetails = rolesError.details || "";
      const errorKeys = Object.keys(rolesError);
      
      // Si l'objet d'erreur est vide ou contient des codes d'erreur spécifiques
      if (
        errorKeys.length === 0 || // Objet vide = probablement RLS ou table inexistante
        errorCode === "42P01" || // Table n'existe pas
        errorCode === "PGRST301" || // RLS bloque l'accès
        errorMessage.includes("does not exist") ||
        errorMessage.includes("relation") ||
        errorMessage.includes("permission denied") ||
        errorMessage.includes("row-level security") ||
        errorDetails.includes("does not exist")
      ) {
        console.warn("Table user_roles may not exist or RLS is blocking access. Returning empty array.");
        return [];
      }
      
      // Autre erreur
      console.error("Error fetching user roles:", rolesError);
      return [];
    }

    // Si pas de user_roles, retourner tableau vide
    if (!userRoles || userRoles.length === 0) {
      return [];
    }

    // Grouper les rôles par user_id
    const rolesByUserId = new Map<string, UserRole[]>();
    const userCreatedAt = new Map<string, string>();
    
    userRoles.forEach((ur: { user_id?: string; role: string; created_at?: string }) => {
      if (!ur.user_id) return; // Ignorer les entrées invalides

      if (!rolesByUserId.has(ur.user_id)) {
        rolesByUserId.set(ur.user_id, []);
      }
      rolesByUserId.get(ur.user_id)!.push(ur.role as UserRole);
      if (ur.created_at && !userCreatedAt.has(ur.user_id)) {
        userCreatedAt.set(ur.user_id, ur.created_at);
      }
    });

    // Récupérer les userIds uniques
    const userIds = Array.from(rolesByUserId.keys());
    
    if (userIds.length === 0) {
      return [];
    }

    // Essayer de récupérer depuis une table users publique si elle existe
    let usersData: { id: string; email?: string; full_name?: string; phone?: string; created_at?: string }[] = [];
    const { data: usersTableData, error: usersError } = await supabase
      .from("users")
      .select("id, email, full_name, phone, created_at")
      .in("id", userIds);

    if (!usersError && usersTableData) {
      usersData = usersTableData;
    }

    // Mapper les résultats
    const result: UserWithRole[] = [];
    
    // Pour chaque userId, créer un objet UserWithRole
    userIds.forEach((userId) => {
      const userFromTable = usersData.find((u) => u.id === userId);
      
      result.push({
        id: userId,
        email: userFromTable?.email || "",
        full_name: userFromTable?.full_name || null,
        phone: userFromTable?.phone || null,
        roles: rolesByUserId.get(userId) || [],
        created_at: userFromTable?.created_at || userCreatedAt.get(userId) || new Date().toISOString(),
      });
    });

    // Si on a des utilisateurs dans la table users qui n'ont pas de rôles, les ajouter aussi
    if (usersData.length > 0) {
      usersData.forEach((user) => {
        if (!userIds.includes(user.id)) {
          result.push({
            id: user.id,
            email: user.email || "",
            full_name: user.full_name || null,
            phone: user.phone || null,
            roles: [],
            created_at: user.created_at || new Date().toISOString(),
          });
        }
      });
    }

    // Si on n'a toujours pas d'utilisateurs, essayer de récupérer TOUS les utilisateurs depuis la table users
    if (result.length === 0) {
      console.log("No users found with roles, trying to fetch all users from users table...");
      const { data: allUsers, error: allUsersError } = await supabase
        .from("users")
        .select("id, email, full_name, phone, created_at")
        .order("created_at", { ascending: false });

      if (allUsersError) {
        console.warn("Error fetching all users:", allUsersError);
      } else if (allUsers && allUsers.length > 0) {
        console.log(`Found ${allUsers.length} users in users table`);
        // Récupérer les rôles pour ces utilisateurs
        const allUserIds = allUsers.map((u: { id: string }) => u.id);
        const { data: allUserRoles } = await supabase
          .from("user_roles")
          .select("user_id, role")
          .in("user_id", allUserIds);

        const rolesMap = new Map<string, UserRole[]>();
        (allUserRoles || []).forEach((ur: { user_id: string; role: string }) => {
          if (!rolesMap.has(ur.user_id)) {
            rolesMap.set(ur.user_id, []);
          }
          rolesMap.get(ur.user_id)!.push(ur.role as UserRole);
        });

        return allUsers.map((user: { id: string; email?: string; full_name?: string; phone?: string; created_at?: string }) => ({
          id: user.id,
          email: user.email || "",
          full_name: user.full_name || null,
          phone: user.phone || null,
          roles: rolesMap.get(user.id) || [],
          created_at: user.created_at || new Date().toISOString(),
        }));
      } else {
        console.warn("⚠️ IMPORTANT: No users found. The get_users_with_roles() SQL function must be created in Supabase to access auth.users.");
        console.warn("📝 Please run the SQL script in docs/create-users-function.sql in Supabase SQL Editor.");
        console.warn("🔗 Or execute the full script in docs/user-roles-table-schema.sql which includes this function.");
      }
    }

    // Trier par date de création (plus récent en premier)
    return result.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } catch (error) {
    console.error("Error in getUsersWithRoles:", error);
    return [];
  }
}

/**
 * Accorde un rôle à un utilisateur
 */
export async function grantRole(
  userId: string,
  role: UserRole
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  const supabase = await createClient();

  // Récupérer l'utilisateur actuel
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  if (!currentUser) {
    return {
      success: false,
      error: "Utilisateur non authentifié",
    };
  }

  // Vérifier que l'utilisateur cible existe
  const { data: targetUser, error: targetUserError } = await supabase.auth.admin.getUserById(userId);
  if (targetUserError || !targetUser) {
    console.error("Error fetching target user:", targetUserError);
    // Si on ne peut pas récupérer via admin, on continue quand même (peut-être que l'utilisateur existe)
  }

  // Essayer d'abord via la fonction SQL grant_role (bypass RLS)
  // La fonction utilise p_role comme paramètre
  const { error: functionError } = await supabase.rpc("grant_role", {
    target_user: userId,
    p_role: role,
  });

  if (!functionError) {
    // Créer une notification pour l'utilisateur
    await createRoleNotification(userId, role, supabase);
    revalidatePath("/admin/roles");
    revalidatePath("/admin/users");
    return { success: true };
  }

  // Logger l'erreur pour debug
  console.error("Error calling grant_role:", functionError);

  // Si la fonction n'existe pas, essayer l'ancienne fonction
  const { data: functionResult, error: oldFunctionError } = await supabase.rpc("grant_user_role", {
    target_user_id: userId,
    role_to_grant: role,
  });

  if (!oldFunctionError && functionResult) {
    // Créer une notification pour l'utilisateur
    await createRoleNotification(userId, role, supabase);
    revalidatePath("/admin/roles");
    revalidatePath("/admin/users");
    return { success: true };
  }

  // Fallback: Insertion directe si la fonction n'existe pas
  const { error } = await supabase.from("user_roles").insert({
    user_id: userId,
    role,
    granted_by: currentUser.id,
  });

  if (!error) {
    // Créer une notification pour l'utilisateur
    await createRoleNotification(userId, role, supabase);
    revalidatePath("/admin/roles");
    revalidatePath("/admin/users");
    return { success: true };
  }

  if (error) {
    console.error("Error granting role:", error);
    console.error("Error details:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });

    // Si le rôle existe déjà, ce n'est pas une erreur critique
    if (error.code === "23505" || error.message?.includes("duplicate") || error.message?.includes("unique")) {
      revalidatePath("/admin/roles");
      revalidatePath("/admin/users");
      return { success: true };
    }

    // Erreur RLS (permission denied)
    if (
      error.code === "42501" ||
      error.code === "PGRST301" ||
      error.message?.includes("permission denied") ||
      error.message?.includes("row-level security") ||
      error.message?.includes("policy")
    ) {
      return {
        success: false,
        error: "Permission refusée. Exécutez le script docs/create-grant-role-function.sql pour créer la fonction SQL qui bypass RLS.",
      };
    }

    // Erreur de contrainte de clé étrangère
    if (error.code === "23503" || error.message?.includes("foreign key")) {
      return {
        success: false,
        error: "L'utilisateur n'existe pas dans auth.users.",
      };
    }

    // Autre erreur
    return {
      success: false,
      error: `Impossible d'accorder le rôle: ${error.message || "Erreur inconnue"}`,
    };
  }

  revalidatePath("/admin/roles");
  revalidatePath("/admin/users");
  return { success: true };
}

/**
 * Retire un rôle à un utilisateur
 */
export async function revokeRole(
  userId: string,
  role: UserRole
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  const supabase = await createClient();

  // Essayer d'abord via la fonction SQL revoke_role (bypass RLS)
  // La fonction utilise p_role comme paramètre
  const { error: functionError } = await supabase.rpc("revoke_role", {
    target_user: userId,
    p_role: role,
  });

  if (!functionError) {
    // Créer une notification pour l'utilisateur
    await createRoleRevokedNotification(userId, role);
    revalidatePath("/admin/roles");
    revalidatePath("/admin/users");
    return { success: true };
  }

  // Logger l'erreur pour debug
  console.error("Error calling revoke_role:", functionError);

  // Si la fonction n'existe pas, essayer l'ancienne fonction
  const { data: functionResult, error: oldFunctionError } = await supabase.rpc("revoke_user_role", {
    target_user_id: userId,
    role_to_revoke: role,
  });

  if (!oldFunctionError && functionResult) {
    // Créer une notification pour l'utilisateur
    await createRoleRevokedNotification(userId, role);
    revalidatePath("/admin/roles");
    revalidatePath("/admin/users");
    return { success: true };
  }

  // Fallback: Suppression directe si la fonction n'existe pas
  const { error } = await supabase
    .from("user_roles")
    .delete()
    .eq("user_id", userId)
    .eq("role", role);

  if (!error) {
    // Créer une notification pour l'utilisateur
    await createRoleRevokedNotification(userId, role);
    revalidatePath("/admin/roles");
    revalidatePath("/admin/users");
    return { success: true };
  }

  if (error) {
    console.error("Error revoking role:", error);
    console.error("Error details:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });

    // Erreur RLS (permission denied)
    if (
      error.code === "42501" ||
      error.code === "PGRST301" ||
      error.message?.includes("permission denied") ||
      error.message?.includes("row-level security") ||
      error.message?.includes("policy")
    ) {
      return {
        success: false,
        error: "Permission refusée. Exécutez le script docs/create-grant-role-function.sql pour créer la fonction SQL qui bypass RLS.",
      };
    }

    return {
      success: false,
      error: `Impossible de retirer le rôle: ${error.message || "Erreur inconnue"}`,
    };
  }

  revalidatePath("/admin/roles");
  revalidatePath("/admin/users");
  return { success: true };
}

/**
 * Vérifie si un utilisateur a un rôle spécifique
 */
export async function hasRole(
  userId: string,
  role: UserRole
): Promise<boolean> {
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
}

/**
 * Récupère les rôles d'un utilisateur
 */
export async function getUserRoles(userId: string): Promise<UserRole[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (error || !data) {
    return [];
  }

  return data.map((r) => r.role as UserRole);
}

