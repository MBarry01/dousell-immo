/**
 * Types pour le système de gestion des équipes
 * Dousell Immo - Gestion Locative SaaS
 */

// =====================================================
// TYPES DE BASE
// =====================================================

export type TeamRole = "owner" | "manager" | "accountant" | "agent";

export type TeamStatus = "active" | "suspended" | "archived";

export type MemberStatus = "active" | "suspended" | "invited" | "removed" | "left";

export type InvitationStatus = "pending" | "accepted" | "expired" | "cancelled";

export type SubscriptionTier = "starter" | "pro" | "enterprise";

// =====================================================
// INTERFACES PRINCIPALES
// =====================================================

export interface Team {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  company_address: string | null;
  company_phone: string | null;
  company_email: string | null;
  company_ninea: string | null;
  signature_url: string | null;
  billing_email: string | null;
  default_billing_day: number;
  currency: string;
  status: TeamStatus;
  subscription_tier: SubscriptionTier;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamRole;
  custom_permissions: Record<string, boolean>;
  status: MemberStatus;
  invited_by: string | null;
  joined_at: string | null;
  removed_at: string | null;
  left_at: string | null;
  created_at: string;
  updated_at: string;
  // Données jointes
  user?: TeamMemberUser;
}

export interface TeamMemberUser {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url?: string | null;
  phone: string | null;
}

export interface TeamInvitation {
  id: string;
  team_id: string;
  email: string;
  role: TeamRole;
  token: string;
  expires_at: string;
  status: InvitationStatus;
  invited_by: string;
  message: string | null;
  created_at: string;
  accepted_at: string | null;
  // Données jointes
  inviter?: {
    full_name: string | null;
    email: string;
  };
  team?: {
    name: string;
    slug: string;
  };
}

export interface TeamAuditLog {
  id: string;
  team_id: string;
  user_id: string | null;
  action: TeamAuditAction;
  resource_type: string | null;
  resource_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  // Données jointes
  user?: {
    full_name: string | null;
    email: string;
  };
}

// =====================================================
// TYPES D'ACTIONS AUDIT
// =====================================================

export type TeamAuditAction =
  | "team.created"
  | "team.updated"
  | "team.archived"
  | "member.invited"
  | "member.joined"
  | "member.role_changed"
  | "member.removed"
  | "member.left"
  | "member.suspended"
  | "member.invitation_resent"
  | "member.invitation_cancelled"
  | "invitation.cancelled"
  | "invitation.expired"
  | "settings.updated"
  | "lease.created"
  | "lease.updated"
  | "payment.confirmed";

// =====================================================
// TYPES AVEC RELATIONS
// =====================================================

export interface TeamWithMembers extends Team {
  members: TeamMember[];
  member_count: number;
}

export interface TeamMemberWithTeam extends TeamMember {
  team: Team;
}

export interface UserTeamContext {
  team_id: string;
  team_name: string;
  team_slug: string;
  user_role: TeamRole;
  // 🆕 Subscription fields (optimisation: évite un appel DB séparé)
  subscription_status?: 'none' | 'trial' | 'active' | 'expired' | 'canceled';
  subscription_trial_ends_at?: string | null;
  subscription_tier?: SubscriptionTier;
}

// =====================================================
// TYPES POUR LES FORMULAIRES
// =====================================================

export interface CreateTeamInput {
  name: string;
  description?: string;
  company_address?: string;
  company_phone?: string;
  company_email?: string;
  company_ninea?: string;
}

export interface UpdateTeamInput {
  name?: string;
  description?: string;
  logo_url?: string;
  company_address?: string;
  company_phone?: string;
  company_email?: string;
  company_ninea?: string;
  signature_url?: string;
  billing_email?: string;
  default_billing_day?: number;
}

export interface InviteMemberInput {
  teamId: string;
  email: string;
  role: Exclude<TeamRole, "owner">; // On ne peut pas inviter comme owner
  message?: string;
}

export interface ChangeMemberRoleInput {
  teamId: string;
  memberId: string;
  newRole: Exclude<TeamRole, "owner">; // owner = transfert de propriété
}

// =====================================================
// TYPES DE RÉPONSE API
// =====================================================

export interface TeamActionResult {
  success: boolean;
  error?: string;
  message?: string;
}

export interface CreateTeamResult extends TeamActionResult {
  teamId?: string;
  slug?: string;
}

export interface InviteMemberResult extends TeamActionResult {
  invitationId?: string;
}

export interface AcceptInvitationResult extends TeamActionResult {
  teamId?: string;
  teamName?: string;
  role?: TeamRole;
}

// =====================================================
// TYPES POUR LES STATS
// =====================================================

export interface TeamStats {
  total_members: number;
  members_by_role: Record<TeamRole, number>;
  pending_invitations: number;
  total_leases: number;
  active_leases: number;
}

// =====================================================
// TYPES POUR LA SIDEBAR / NAVIGATION
// =====================================================

export interface TeamNavContext {
  hasTeam: boolean;
  team?: {
    id: string;
    name: string;
    slug: string;
  };
  userRole?: TeamRole;
  canInvite: boolean;
  canManageSettings: boolean;
}
