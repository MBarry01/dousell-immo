/**
 * Système de permissions pour les équipes
 * Dousell Immo - Gestion Locative SaaS
 * 
 * Ce fichier contient uniquement les constantes et fonctions pures 
 * qui peuvent être utilisées côté client ET serveur.
 * 
 * Pour les fonctions async nécessitant Supabase, importer depuis:
 * @/lib/team-permissions.server
 */

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
  "expenses.delete": ["owner", "accountant"],

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
    bgColor: "bg-slate-100 dark:bg-slate-800",
    textColor: "text-slate-900 dark:text-slate-300",
    icon: "Crown",
  },
  manager: {
    label: "Gestionnaire",
    description: "Gestion des baux, locataires et maintenance",
    color: "bg-blue-500",
    bgColor: "bg-slate-100 dark:bg-slate-800",
    textColor: "text-slate-900 dark:text-slate-300",
    icon: "UserCog",
  },
  accountant: {
    label: "Comptable",
    description: "Accès aux paiements, rapports financiers et dépenses",
    color: "bg-green-500",
    bgColor: "bg-slate-100 dark:bg-slate-800",
    textColor: "text-slate-900 dark:text-slate-300",
    icon: "Calculator",
  },
  agent: {
    label: "Agent",
    description: "Consultation et création de demandes maintenance",
    color: "bg-slate-500",
    bgColor: "bg-slate-100 dark:bg-slate-800",
    textColor: "text-slate-900 dark:text-slate-300",
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
// UTILITAIRES (fonctions pures, sans async)
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
