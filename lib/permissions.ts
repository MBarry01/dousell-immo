import { getUserTeamContext } from "./team-context";
import {
  TEAM_PERMISSIONS,
  type TeamPermissionKey,
  type TeamRole
} from "./team-permissions";
import { createClient } from "@/utils/supabase/server";

/**
 * Gardien des Permissions (Pattern Enterprise)
 * Sépare la logique d'Identity (Context) de l'Authorization (Permissions).
 */

/**
 * Vérifie si l'utilisateur a une permission temporaire active
 */
async function hasTemporaryPermission(
  userId: string,
  teamId: string,
  permission: TeamPermissionKey
): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('has_temporary_permission', {
      p_team_id: teamId,
      p_user_id: userId,
      p_permission: permission,
    });

    if (error) {
      console.error("[Permissions] Temporary permission check error:", error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error("[Permissions] Temporary permission check error:", error);
    return false;
  }
}

export async function hasTeamPermission(permission: TeamPermissionKey): Promise<boolean> {
  try {
    const context = await getUserTeamContext();
    const { role, user, teamId } = context;

    // Vérifier d'abord les permissions du rôle
    const allowedRoles = TEAM_PERMISSIONS[permission] as readonly string[];
    if (allowedRoles.includes(role)) {
      return true;
    }

    // Si pas de permission via le rôle, vérifier les permissions temporaires
    const hasTemp = await hasTemporaryPermission(user.id, teamId, permission);
    return hasTemp;
  } catch (error) {
    console.error("[Permissions] Error checking permission:", error);
    return false;
  }
}

/**
 * Guard pour Server Actions.
 * Bloque l'exécution si l'utilisateur n'a pas les droits nécessaires.
 * Jette une erreur explicite qui peut être capturée par le client.
 *
 * Vérifie d'abord les permissions du rôle, puis les permissions temporaires.
 */
export async function requireTeamPermission(permission: TeamPermissionKey) {
  const context = await getUserTeamContext();
  const { role, user, teamId } = context;

  const allowedRoles = TEAM_PERMISSIONS[permission] as readonly string[];
  let hasPermission = allowedRoles.includes(role);

  // Si pas de permission via le rôle, vérifier les permissions temporaires
  if (!hasPermission) {
    hasPermission = await hasTemporaryPermission(user.id, teamId, permission);
  }

  if (!hasPermission) {
    console.error(`[Permissions] Access Denied: User with role ${role} tried to perform ${permission}`);
    throw new Error(`⛔ Accès refusé : Vous n'avez pas les droits nécessaires (${permission}) pour cette action.`);
  }

  return context;
}

/**
 * Guard pour vérifier un rôle spécifique.
 */
export async function requireTeamRole(allowedRoles: TeamRole[]) {
  const context = await getUserTeamContext();
  const { role } = context;

  if (!allowedRoles.includes(role)) {
    throw new Error(`⛔ Accès refusé : Cette action nécessite l'un des rôles suivants : ${allowedRoles.join(", ")}`);
  }

  return context;
}

/**
 * Alias pratique pour vérifier plusieurs permissions (ET)
 */
export async function requireAllPermissions(permissions: TeamPermissionKey[]) {
  const context = await getUserTeamContext();
  for (const perm of permissions) {
    await requireTeamPermission(perm);
  }
  return context;
}

/**
 * Alias pratique pour vérifier au moins une permission (OU)
 */
export async function requireAnyPermission(permissions: TeamPermissionKey[]) {
  const context = await getUserTeamContext();
  const { role } = context;

  const hasAny = permissions.some(perm => {
    const allowedRoles = TEAM_PERMISSIONS[perm] as readonly string[];
    return allowedRoles.includes(role);
  });

  if (!hasAny) {
    throw new Error(`⛔ Accès refusé : Droits insuffisants.`);
  }

  return context;
}

/**
 * Type pour les rôles utilisateur (système admin legacy)
 */
export type UserRole = "admin" | "superadmin" | "moderateur" | "user";

/**
 * Guard pour vérifier un rôle admin (compatibilité legacy)
 * Si aucun rôle n'est fourni, vérifie par défaut les rôles admin
 */
export async function requireAnyRole(allowedRoles: (TeamRole | UserRole)[] = ["owner", "manager"]) {
  const context = await getUserTeamContext();
  const { role } = context;

  // Vérification via le système team
  if (allowedRoles.includes(role as TeamRole)) {
    return context;
  }

  // Si les rôles demandés incluent admin/superadmin, on vérifie aussi via team owner
  const adminRoles = ["admin", "superadmin"];
  const isAdminCheck = allowedRoles.some(r => adminRoles.includes(r));

  if (isAdminCheck && role === "owner") {
    return context;
  }

  throw new Error(`⛔ Accès refusé : Cette action nécessite l'un des rôles suivants : ${allowedRoles.join(", ")}`);
}

/**
 * Récupère le rôle de l'utilisateur courant dans son équipe
 */
export async function getCurrentUserRoles(): Promise<{ role: TeamRole; teamId: string } | null> {
  try {
    const context = await getUserTeamContext();
    return {
      role: context.role,
      teamId: context.teamId
    };
  } catch (error) {
    console.error("[Permissions] Error getting current user roles:", error);
    return null;
  }
}
