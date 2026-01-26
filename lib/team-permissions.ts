/**
 * Système de permissions pour les équipes
 * Dousell Immo - Gestion Locative SaaS
 */

import { createClient } from "@/utils/supabase/server";
import type { TeamRole, TeamMember, UserTeamContext } from "@/types/team";

// =====================================================
// DÉFINITION DES PERMISSIONS
// =====================================================

export const TEAM_PERMISSIONS = {
  // Gestion de l'équipe
  "team.settings.view": ["owner", "manager"],
  "team.settings.edit": ["owner"],
  "team.members.view": ["owner", "manager", "accountant", "agent"],
  "team.members.invite": ["owner", "manager"],
  "team.members.edit_role": ["owner"],
  "team.members.remove": ["owner"],
  "team.audit.view": ["owner", "manager"],

  // Gestion des baux
  "leases.view": ["owner", "manager", "accountant", "agent"],
  "leases.create": ["owner", "manager"],
  "leases.edit": ["owner", "manager"],
  "leases.terminate": ["owner", "manager"],
  "leases.delete": ["owner"],

  // Gestion des locataires
  "tenants.view": ["owner", "manager", "accountant", "agent"],
  "tenants.contact": ["owner", "manager", "agent"],
  "tenants.edit": ["owner", "manager"],

  // Paiements et finances
  "payments.view": ["owner", "manager", "accountant"],
  "payments.confirm": ["owner", "manager", "accountant"],
  "payments.void": ["owner", "accountant"],
  "receipts.generate": ["owner", "manager", "accountant"],
  "reports.financial.view": ["owner", "accountant"],
  "reports.financial.export": ["owner", "accountant"],
  "expenses.view": ["owner", "accountant"],
  "expenses.create": ["owner", "accountant"],
  "expenses.edit": ["owner", "accountant"],

  // Maintenance
  "maintenance.view": ["owner", "manager", "agent"],
  "maintenance.create": ["owner", "manager", "agent"],
  "maintenance.approve_quote": ["owner", "manager"],
  "maintenance.complete": ["owner", "manager"],

  // Documents
  "documents.view": ["owner", "manager", "accountant", "agent"],
  "documents.generate": ["owner", "manager", "accountant"],
  "documents.delete": ["owner"],

  // États des lieux
  "inventory.view": ["owner", "manager", "agent"],
  "inventory.create": ["owner", "manager", "agent"],
  "inventory.sign": ["owner", "manager"],

  // Gestion des biens immobiliers
  "properties.view": ["owner", "manager", "agent"],
  "properties.create": ["owner", "manager"],
  "properties.edit": ["owner", "manager"],
  "properties.publish": ["owner", "manager"],
  "properties.delete": ["owner"],
} as const;

export type TeamPermissionKey = keyof typeof TEAM_PERMISSIONS;

// =====================================================
// LABELS ET DESCRIPTIONS DES RÔLES
// =====================================================

export const TEAM_ROLE_CONFIG: Record<
  TeamRole,
  {
    label: string;
    description: string;
    color: string;
    bgColor: string;
    textColor: string;
    icon: string;
  }
> = {
  owner: {
    label: "Propriétaire",
    description: "Accès complet à l'équipe et tous les paramètres",
    color: "bg-amber-500",
    bgColor: "bg-amber-500/10",
    textColor: "text-amber-500",
    icon: "Crown",
  },
  manager: {
    label: "Gestionnaire",
    description: "Gestion des baux, locataires et maintenance",
    color: "bg-blue-500",
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-500",
    icon: "UserCog",
  },
  accountant: {
    label: "Comptable",
    description: "Accès aux paiements, rapports financiers et dépenses",
    color: "bg-green-500",
    bgColor: "bg-green-500/10",
    textColor: "text-green-500",
    icon: "Calculator",
  },
  agent: {
    label: "Agent",
    description: "Consultation et création de demandes maintenance",
    color: "bg-slate-500",
    bgColor: "bg-slate-500/10",
    textColor: "text-slate-400",
    icon: "User",
  },
};

// Rôles disponibles pour invitation (owner exclu)
export const INVITABLE_ROLES: Exclude<TeamRole, "owner">[] = [
  "manager",
  "accountant",
  "agent",
];

// =====================================================
// FONCTIONS DE RÉCUPÉRATION
// =====================================================

/**
 * Récupère le contexte d'équipe de l'utilisateur connecté
 * Si l'utilisateur n'a pas d'équipe, en crée une personnelle automatiquement
 */
export async function getUserTeamContext(): Promise<UserTeamContext | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Utiliser la fonction RPC pour bypass RLS si nécessaire
  const { data, error } = await supabase.rpc("get_user_team", {
    p_user_id: user.id,
  });

  if (error || !data || data.length === 0) {
    // Fallback: requête directe
    const { data: membership } = await supabase
      .from("team_members")
      .select(
        `
        team_id,
        role,
        team:teams(name, slug)
      `
      )
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (!membership?.team) {
      // AUTO-FIX: Créer une équipe personnelle pour l'utilisateur
      console.log(`[Auto-Team] Creating personal team for user ${user.id}`);
      const newTeamContext = await createPersonalTeam(user.id, user.email || "Utilisateur");
      return newTeamContext;
    }

    const teamData = membership.team;
    // Handle potential array return from Supabase
    const team = (Array.isArray(teamData) ? teamData[0] : teamData) as { name: string; slug: string };

    if (!team) return null;
    return {
      team_id: membership.team_id,
      team_name: team.name,
      team_slug: team.slug,
      user_role: membership.role as TeamRole,
    };
  }

  return {
    team_id: data[0].team_id,
    team_name: data[0].team_name,
    team_slug: data[0].team_slug,
    user_role: data[0].user_role as TeamRole,
  };
}

/**
 * Crée une équipe personnelle pour un utilisateur qui n'en a pas
 */
async function createPersonalTeam(userId: string, userEmail: string): Promise<UserTeamContext | null> {
  const supabase = await createClient();

  // Générer un slug unique
  const slug = `perso-${userId.substring(0, 8)}`;
  const userName = userEmail.split("@")[0] || "Utilisateur";
  const teamName = `Espace de ${userName}`;

  try {
    // Créer l'équipe
    const { data: newTeam, error: teamError } = await supabase
      .from("teams")
      .insert({ name: teamName, slug })
      .select("id, name, slug")
      .single();

    if (teamError || !newTeam) {
      console.error("[Auto-Team] Failed to create team:", teamError?.message);
      return null;
    }

    // Ajouter l'utilisateur comme owner
    const { error: memberError } = await supabase
      .from("team_members")
      .insert({
        user_id: userId,
        team_id: newTeam.id,
        role: "owner",
        status: "active",
      });

    if (memberError) {
      console.error("[Auto-Team] Failed to add member:", memberError.message);
      // Rollback: supprimer l'équipe créée
      await supabase.from("teams").delete().eq("id", newTeam.id);
      return null;
    }

    console.log(`[Auto-Team] Successfully created team "${teamName}" for user ${userId}`);

    return {
      team_id: newTeam.id,
      team_name: newTeam.name,
      team_slug: newTeam.slug,
      user_role: "owner" as TeamRole,
    };
  } catch (err) {
    console.error("[Auto-Team] Unexpected error:", err);
    return null;
  }
}

/**
 * Récupère le membership d'un utilisateur dans une équipe
 * Utilise une fonction RPC SECURITY DEFINER pour bypass RLS
 */
export async function getTeamMembership(
  teamId: string,
  userId?: string
): Promise<{
  role: TeamRole;
  permissions: TeamPermissionKey[];
  customPermissions: Record<string, boolean>;
} | null> {
  const supabase = await createClient();

  if (!userId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    userId = user.id;
  }

  // Essayer d'abord avec la fonction RPC (bypass RLS)
  const { data: roleData, error: rpcError } = await supabase.rpc("get_user_role_in_team", {
    p_team_id: teamId,
    p_user_id: userId,
  });

  if (!rpcError && roleData) {
    const role = roleData as TeamRole;

    // Calculer les permissions effectives
    const permissions = Object.entries(TEAM_PERMISSIONS)
      .filter(([, roles]) => (roles as readonly string[]).includes(role))
      .map(([key]) => key as TeamPermissionKey);

    return {
      role,
      permissions,
      customPermissions: {},
    };
  }

  // Fallback: requête directe (peut échouer avec RLS strict)
  const { data, error } = await supabase
    .from("team_members")
    .select("role, custom_permissions, status")
    .eq("team_id", teamId)
    .eq("user_id", userId)
    .single();

  if (error || !data || data.status !== "active") {
    console.log("getTeamMembership fallback failed:", error?.message || "No data");
    return null;
  }

  const role = data.role as TeamRole;

  // Calculer les permissions effectives
  const permissions = Object.entries(TEAM_PERMISSIONS)
    .filter(([, roles]) => (roles as readonly string[]).includes(role))
    .map(([key]) => key as TeamPermissionKey);

  return {
    role,
    permissions,
    customPermissions: (data.custom_permissions as Record<string, boolean>) || {},
  };
}

// =====================================================
// FONCTIONS DE VÉRIFICATION
// =====================================================

/**
 * Vérifie si l'utilisateur a une permission spécifique dans une équipe
 */
export async function hasTeamPermission(
  teamId: string,
  permission: TeamPermissionKey
): Promise<boolean> {
  const membership = await getTeamMembership(teamId);
  if (!membership) return false;

  // Vérifier permissions custom d'abord
  if (permission in membership.customPermissions) {
    return membership.customPermissions[permission];
  }

  return membership.permissions.includes(permission);
}

/**
 * Vérifie si l'utilisateur a un rôle spécifique
 */
export async function hasTeamRole(
  teamId: string,
  roles: TeamRole | TeamRole[]
): Promise<boolean> {
  const membership = await getTeamMembership(teamId);
  if (!membership) return false;

  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  return allowedRoles.includes(membership.role);
}

/**
 * Guard pour Server Actions - vérifie permission et retourne erreur formatée
 */
export async function requireTeamPermission(
  teamId: string,
  permission: TeamPermissionKey
): Promise<
  | { success: false; error: string }
  | {
    success: true;
    membership: NonNullable<Awaited<ReturnType<typeof getTeamMembership>>>;
    userId: string;
  }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Non connecté" };
  }

  const membership = await getTeamMembership(teamId, user.id);

  if (!membership) {
    return { success: false, error: "Vous n'êtes pas membre de cette équipe" };
  }

  const hasPermission = await hasTeamPermission(teamId, permission);

  if (!hasPermission) {
    return {
      success: false,
      error: `Permission refusée. Votre rôle (${TEAM_ROLE_CONFIG[membership.role].label}) ne permet pas cette action.`,
    };
  }

  return { success: true, membership, userId: user.id };
}

/**
 * Guard pour vérifier un rôle minimum
 */
export async function requireTeamRole(
  teamId: string,
  allowedRoles: TeamRole[]
): Promise<
  | { success: false; error: string }
  | { success: true; role: TeamRole; userId: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Non connecté" };
  }

  const membership = await getTeamMembership(teamId, user.id);

  if (!membership) {
    return { success: false, error: "Vous n'êtes pas membre de cette équipe" };
  }

  if (!allowedRoles.includes(membership.role)) {
    const allowedLabels = allowedRoles
      .map((r) => TEAM_ROLE_CONFIG[r].label)
      .join(", ");
    return {
      success: false,
      error: `Cette action nécessite l'un des rôles suivants : ${allowedLabels}`,
    };
  }

  return { success: true, role: membership.role, userId: user.id };
}

// =====================================================
// UTILITAIRES
// =====================================================

/**
 * Récupère toutes les permissions pour un rôle donné
 */
export function getPermissionsForRole(role: TeamRole): TeamPermissionKey[] {
  return Object.entries(TEAM_PERMISSIONS)
    .filter(([, roles]) => (roles as readonly string[]).includes(role))
    .map(([key]) => key as TeamPermissionKey);
}

/**
 * Vérifie si un rôle peut effectuer une action
 */
export function canRolePerform(
  role: TeamRole,
  permission: TeamPermissionKey
): boolean {
  const allowedRoles = TEAM_PERMISSIONS[permission];
  return (allowedRoles as readonly string[]).includes(role);
}

/**
 * Compare deux rôles (pour savoir qui peut modifier qui)
 * Retourne true si role1 est supérieur ou égal à role2
 */
export function isRoleHigherOrEqual(role1: TeamRole, role2: TeamRole): boolean {
  const hierarchy: Record<TeamRole, number> = {
    owner: 4,
    manager: 3,
    accountant: 2,
    agent: 1,
  };

  return hierarchy[role1] >= hierarchy[role2];
}

/**
 * Obtient le label traduit d'un rôle
 */
export function getRoleLabel(role: TeamRole): string {
  return TEAM_ROLE_CONFIG[role].label;
}

/**
 * Obtient la configuration complète d'un rôle
 */
export function getRoleConfig(role: TeamRole) {
  return TEAM_ROLE_CONFIG[role];
}

// =====================================================
// EXPORT DES TYPES
// =====================================================

export type { TeamRole, TeamMember, UserTeamContext };
