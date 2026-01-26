"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  requireTeamPermission,
  requireTeamRole,
  TEAM_ROLE_CONFIG,
  getUserTeamContext,
} from "@/lib/team-permissions";
import { sendEmail } from "@/lib/mail";
import type {
  Team,
  TeamMember,
  TeamInvitation,
  TeamAuditLog,
  TeamRole,
  CreateTeamResult,
  InviteMemberResult,
  AcceptInvitationResult,
  TeamActionResult,
  TeamStats,
} from "@/types/team";

// =====================================================
// SCHEMAS ZOD
// =====================================================

const createTeamSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(100),
  description: z.string().max(500).optional(),
  company_address: z.string().max(200).optional(),
  company_phone: z.string().max(20).optional(),
  company_email: z.string().email("Email invalide").optional().or(z.literal("")),
  company_ninea: z.string().max(50).optional(),
});

const updateTeamSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  company_address: z.string().max(200).optional(),
  company_phone: z.string().max(20).optional(),
  company_email: z.string().email().optional().or(z.literal("")),
  company_ninea: z.string().max(50).optional(),
  billing_email: z.string().email().optional().or(z.literal("")),
  default_billing_day: z.number().min(1).max(31).optional(),
});

const inviteMemberSchema = z.object({
  teamId: z.string().uuid("ID d'équipe invalide"),
  email: z.string().email("Email invalide"),
  role: z.enum(["manager", "accountant", "agent"]),
  message: z.string().max(500).optional(),
});

const changeRoleSchema = z.object({
  teamId: z.string().uuid(),
  memberId: z.string().uuid(),
  newRole: z.enum(["manager", "accountant", "agent"]),
});

// =====================================================
// HELPERS
// =====================================================

/**
 * Génère un slug URL-friendly unique
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Log une action dans l'audit trail
 */
async function logTeamAudit(
  teamId: string,
  userId: string,
  action: string,
  resourceType: string,
  resourceId: string | null,
  oldData: unknown,
  newData: unknown
) {
  const supabase = await createClient();

  await supabase.from("team_audit_logs").insert({
    team_id: teamId,
    user_id: userId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    old_data: oldData ? JSON.parse(JSON.stringify(oldData)) : null,
    new_data: newData ? JSON.parse(JSON.stringify(newData)) : null,
  });
}

// =====================================================
// LECTURE
// =====================================================

/**
 * Récupère l'équipe de l'utilisateur connecté
 */
export async function getCurrentUserTeam(): Promise<{
  success: boolean;
  team?: Team;
  role?: TeamRole;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Non connecté" };
  }

  const { data: membership, error } = await supabase
    .from("team_members")
    .select(
      `
      role,
      team:teams(*)
    `
    )
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    console.error("Erreur récupération équipe:", error);
    return { success: false, error: "Erreur lors de la récupération de l'équipe" };
  }

  if (!membership?.team) {
    return { success: true, team: undefined, role: undefined };
  }

  return {
    success: true,
    team: membership.team as unknown as Team,
    role: membership.role as TeamRole,
  };
}

/**
 * Récupère les membres d'une équipe
 */
export async function getTeamMembers(
  teamId: string
): Promise<{ success: boolean; members?: TeamMember[]; error?: string }> {
  const permCheck = await requireTeamPermission(teamId, "team.members.view");
  if (!permCheck.success) {
    return permCheck;
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("team_members")
    .select(
      `
      *,
      user:profiles(id, email, full_name, phone)
    `
    )
    .eq("team_id", teamId)
    .eq("status", "active")
    .order("role", { ascending: true })
    .order("joined_at", { ascending: true });

  if (error) {
    console.error("Erreur récupération membres:", error);
    return { success: false, error: "Erreur lors de la récupération des membres" };
  }

  return { success: true, members: data as TeamMember[] };
}

/**
 * Récupère les invitations en attente
 */
export async function getTeamInvitations(
  teamId: string
): Promise<{ success: boolean; invitations?: TeamInvitation[]; error?: string }> {
  const permCheck = await requireTeamPermission(teamId, "team.members.view");
  if (!permCheck.success) {
    return permCheck;
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("team_invitations")
    .select(
      `
      *,
      inviter:profiles!invited_by(full_name, email)
    `
    )
    .eq("team_id", teamId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erreur récupération invitations:", error);
    return { success: false, error: "Erreur lors de la récupération des invitations" };
  }

  return { success: true, invitations: data as TeamInvitation[] };
}

/**
 * Récupère les logs d'audit
 */
export async function getTeamAuditLogs(
  teamId: string,
  limit = 50
): Promise<{ success: boolean; logs?: TeamAuditLog[]; error?: string }> {
  const permCheck = await requireTeamPermission(teamId, "team.audit.view");
  if (!permCheck.success) {
    return permCheck;
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("team_audit_logs")
    .select(
      `
      *,
      user:profiles(full_name, email)
    `
    )
    .eq("team_id", teamId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Erreur récupération audit:", error);
    return { success: false, error: "Erreur lors de la récupération de l'historique" };
  }

  return { success: true, logs: data as TeamAuditLog[] };
}

/**
 * Récupère les statistiques de l'équipe
 */
export async function getTeamStats(
  teamId: string
): Promise<{ success: boolean; stats?: TeamStats; error?: string }> {
  const permCheck = await requireTeamPermission(teamId, "team.members.view");
  if (!permCheck.success) {
    return permCheck;
  }

  const supabase = await createClient();

  // Récupérer les membres
  const { data: members } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("status", "active");

  // Récupérer les invitations pending
  const { count: pendingInvitations } = await supabase
    .from("team_invitations")
    .select("id", { count: "exact", head: true })
    .eq("team_id", teamId)
    .eq("status", "pending");

  // Récupérer les baux
  const { data: leases } = await supabase
    .from("leases")
    .select("status")
    .eq("team_id", teamId);

  const membersByRole: Record<TeamRole, number> = {
    owner: 0,
    manager: 0,
    accountant: 0,
    agent: 0,
  };

  members?.forEach((m) => {
    const role = m.role as TeamRole;
    membersByRole[role] = (membersByRole[role] || 0) + 1;
  });

  return {
    success: true,
    stats: {
      total_members: members?.length || 0,
      members_by_role: membersByRole,
      pending_invitations: pendingInvitations || 0,
      total_leases: leases?.length || 0,
      active_leases: leases?.filter((l) => l.status === "active").length || 0,
    },
  };
}

// =====================================================
// CRÉATION D'ÉQUIPE
// =====================================================

export async function createTeam(
  formData: z.infer<typeof createTeamSchema>
): Promise<CreateTeamResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Non connecté" };
  }

  // Vérifier si l'utilisateur a déjà une équipe
  const { data: existingMembership } = await supabase
    .from("team_members")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (existingMembership) {
    return { success: false, error: "Vous êtes déjà membre d'une équipe" };
  }

  // Validation Zod
  const validation = createTeamSchema.safeParse(formData);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  const data = validation.data;

  // Générer un slug unique
  const baseSlug = generateSlug(data.name);
  const { data: existingTeam } = await supabase
    .from("teams")
    .select("id")
    .eq("slug", baseSlug)
    .maybeSingle();

  const slug = existingTeam ? `${baseSlug}-${Date.now().toString(36)}` : baseSlug;

  // Créer l'équipe
  const { data: team, error: teamError } = await supabase
    .from("teams")
    .insert({
      name: data.name,
      slug,
      description: data.description || null,
      company_address: data.company_address || null,
      company_phone: data.company_phone || null,
      company_email: data.company_email || null,
      company_ninea: data.company_ninea || null,
      created_by: user.id,
    })
    .select()
    .single();

  if (teamError) {
    console.error("Erreur création équipe:", teamError);
    // Vérifier si c'est une erreur de table manquante
    if (teamError.code === "42P01") {
      return {
        success: false,
        error: "La migration SQL n'a pas été exécutée. Veuillez exécuter le fichier docs/create-teams-system.sql dans Supabase."
      };
    }
    return { success: false, error: `Erreur: ${teamError.message}` };
  }

  // Ajouter le créateur comme owner
  const { error: memberError } = await supabase.from("team_members").insert({
    team_id: team.id,
    user_id: user.id,
    role: "owner",
    status: "active",
    joined_at: new Date().toISOString(),
  });

  if (memberError) {
    // Rollback: supprimer l'équipe
    await supabase.from("teams").delete().eq("id", team.id);
    console.error("Erreur ajout membre owner:", memberError);
    return { success: false, error: "Erreur lors de la configuration de l'équipe" };
  }

  // Audit log
  await logTeamAudit(team.id, user.id, "team.created", "team", team.id, null, team);

  revalidatePath("/gestion/equipe");
  revalidatePath("/gestion");

  return { success: true, teamId: team.id, slug: team.slug };
}

// =====================================================
// MISE À JOUR ÉQUIPE
// =====================================================

export async function updateTeam(
  teamId: string,
  formData: z.infer<typeof updateTeamSchema>
): Promise<TeamActionResult> {
  const permCheck = await requireTeamPermission(teamId, "team.settings.edit");
  if (!permCheck.success) {
    return permCheck;
  }

  const validation = updateTeamSchema.safeParse(formData);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  const supabase = await createClient();

  // Récupérer l'ancienne valeur pour l'audit
  const { data: oldTeam } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .single();

  // Construire l'objet de mise à jour (uniquement champs non-undefined)
  const updates: Record<string, unknown> = {};
  const data = validation.data;

  if (data.name !== undefined) updates.name = data.name;
  if (data.description !== undefined) updates.description = data.description || null;
  if (data.company_address !== undefined) updates.company_address = data.company_address || null;
  if (data.company_phone !== undefined) updates.company_phone = data.company_phone || null;
  if (data.company_email !== undefined) updates.company_email = data.company_email || null;
  if (data.company_ninea !== undefined) updates.company_ninea = data.company_ninea || null;
  if (data.billing_email !== undefined) updates.billing_email = data.billing_email || null;
  if (data.default_billing_day !== undefined) updates.default_billing_day = data.default_billing_day;

  if (Object.keys(updates).length === 0) {
    return { success: true, message: "Aucune modification" };
  }

  const { error } = await supabase.from("teams").update(updates).eq("id", teamId);

  if (error) {
    console.error("Erreur mise à jour équipe:", error);
    return { success: false, error: "Erreur lors de la mise à jour" };
  }

  // Audit log
  await logTeamAudit(
    teamId,
    permCheck.userId,
    "team.updated",
    "team",
    teamId,
    oldTeam,
    updates
  );

  revalidatePath("/gestion/equipe");
  revalidatePath("/gestion/equipe/parametres");

  return { success: true, message: "Équipe mise à jour" };
}

// =====================================================
// INVITATION DE MEMBRE
// =====================================================

export async function inviteTeamMember(
  formData: z.infer<typeof inviteMemberSchema>
): Promise<InviteMemberResult> {
  const validation = inviteMemberSchema.safeParse(formData);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  const data = validation.data;

  // Vérifier permission
  const permCheck = await requireTeamPermission(data.teamId, "team.members.invite");
  if (!permCheck.success) {
    return permCheck;
  }

  const supabase = await createClient();

  // Vérifier si l'email est déjà membre
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", data.email.toLowerCase())
    .maybeSingle();

  if (profiles) {
    const { data: existingMember } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", data.teamId)
      .eq("user_id", profiles.id)
      .maybeSingle();

    if (existingMember) {
      return { success: false, error: "Cet utilisateur est déjà membre de l'équipe" };
    }
  }

  // Vérifier si invitation déjà en cours
  const { data: existingInvite } = await supabase
    .from("team_invitations")
    .select("id")
    .eq("team_id", data.teamId)
    .eq("email", data.email.toLowerCase())
    .eq("status", "pending")
    .maybeSingle();

  if (existingInvite) {
    return { success: false, error: "Une invitation est déjà en cours pour cet email" };
  }

  // Récupérer les infos de l'équipe
  const { data: team } = await supabase
    .from("teams")
    .select("name")
    .eq("id", data.teamId)
    .single();

  // Récupérer le nom de l'inviteur
  const { data: inviterProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", permCheck.userId)
    .single();

  // Créer l'invitation
  const { data: invitation, error } = await supabase
    .from("team_invitations")
    .insert({
      team_id: data.teamId,
      email: data.email.toLowerCase(),
      role: data.role,
      invited_by: permCheck.userId,
      message: data.message || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Erreur création invitation:", error);
    return { success: false, error: "Erreur lors de l'envoi de l'invitation" };
  }

  // Envoyer l'email
  const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/accept-invitation?token=${invitation.token}`;
  const roleLabel = TEAM_ROLE_CONFIG[data.role as TeamRole].label;
  const inviterName = inviterProfile?.full_name || "Un membre";

  try {
    await sendEmail({
      to: data.email,
      subject: `Invitation à rejoindre l'équipe ${team?.name} sur Dousell Immo`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Outfit', Arial, sans-serif; margin: 0; padding: 0; background-color: #000000;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #F4C430 0%, #B8860B 100%); padding: 40px 30px; text-align: center; border-radius: 16px 16px 0 0;">
              <h1 style="color: #000000; margin: 0; font-size: 28px; font-weight: 700;">Invitation Équipe</h1>
              <p style="color: #000000; margin: 10px 0 0; opacity: 0.8;">Dousell Immo - Gestion Locative</p>
            </div>
            <div style="padding: 40px 30px; background: #121212; border-radius: 0 0 16px 16px;">
              <p style="color: #ffffff; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                ${inviterName} vous invite à rejoindre l'équipe <strong style="color: #F4C430;">${team?.name}</strong> en tant que <strong style="color: #F4C430;">${roleLabel}</strong>.
              </p>
              ${data.message
          ? `
              <div style="background: #1a1a1a; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #F4C430;">
                <p style="color: #a0a0a0; margin: 0; font-style: italic;">"${data.message}"</p>
              </div>
              `
          : ""
        }
              <div style="text-align: center; margin: 35px 0;">
                <a href="${inviteLink}" style="background: #F4C430; color: #000000; padding: 16px 40px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; display: inline-block;">
                  Accepter l'invitation
                </a>
              </div>
              <p style="color: #666666; font-size: 13px; text-align: center; margin: 30px 0 0;">
                Ce lien expire dans 7 jours.
              </p>
            </div>
            <div style="text-align: center; padding: 20px;">
              <p style="color: #444444; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Dousell Immo. Tous droits réservés.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
  } catch (emailError) {
    console.error("Erreur envoi email invitation:", emailError);
    // Ne pas bloquer si l'email échoue
  }

  // Audit log
  await logTeamAudit(data.teamId, permCheck.userId, "member.invited", "invitation", invitation.id, null, {
    email: data.email,
    role: data.role,
  });

  revalidatePath("/gestion/equipe");
  revalidatePath("/gestion/equipe/invitations");

  return { success: true, invitationId: invitation.id };
}

// =====================================================
// ACCEPTATION D'INVITATION
// =====================================================

export async function acceptInvitation(token: string): Promise<AcceptInvitationResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Vous devez être connecté pour accepter l'invitation" };
  }

  // Essayer via la fonction RPC (bypass RLS)
  const { data: rpcResult, error: rpcError } = await supabase.rpc("accept_team_invitation", {
    p_token: token,
  });

  if (!rpcError && rpcResult?.success) {
    revalidatePath("/gestion/equipe");
    revalidatePath("/gestion");
    return {
      success: true,
      teamId: rpcResult.team_id,
      teamName: rpcResult.team_name,
      role: rpcResult.role as TeamRole,
    };
  }

  // Fallback: logique manuelle
  const { data: invitation, error: invError } = await supabase
    .from("team_invitations")
    .select("*, team:teams(id, name)")
    .eq("token", token)
    .eq("status", "pending")
    .single();

  if (invError || !invitation) {
    return { success: false, error: "Invitation invalide ou expirée" };
  }

  // Vérifier email
  if (invitation.email.toLowerCase() !== user.email?.toLowerCase()) {
    return { success: false, error: "Cette invitation n'est pas destinée à votre compte" };
  }

  // Vérifier expiration
  if (new Date(invitation.expires_at) < new Date()) {
    await supabase.from("team_invitations").update({ status: "expired" }).eq("id", invitation.id);
    return { success: false, error: "Cette invitation a expiré" };
  }

  // Ajouter comme membre
  const { error: memberError } = await supabase.from("team_members").insert({
    team_id: invitation.team_id,
    user_id: user.id,
    role: invitation.role,
    status: "active",
    invited_by: invitation.invited_by,
    joined_at: new Date().toISOString(),
  });

  if (memberError) {
    if (memberError.code === "23505") {
      return { success: false, error: "Vous êtes déjà membre de cette équipe" };
    }
    console.error("Erreur ajout membre:", memberError);
    return { success: false, error: "Erreur lors de l'adhésion à l'équipe" };
  }

  // Marquer invitation comme acceptée
  await supabase
    .from("team_invitations")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", invitation.id);

  // Audit log
  await logTeamAudit(invitation.team_id, user.id, "member.joined", "member", user.id, null, {
    role: invitation.role,
    via: "invitation",
  });

  revalidatePath("/gestion/equipe");
  revalidatePath("/gestion");

  const team = invitation.team as { id: string; name: string };
  return {
    success: true,
    teamId: team.id,
    teamName: team.name,
    role: invitation.role as TeamRole,
  };
}

// =====================================================
// CHANGEMENT DE RÔLE
// =====================================================

export async function changeMemberRole(
  formData: z.infer<typeof changeRoleSchema>
): Promise<TeamActionResult> {
  const validation = changeRoleSchema.safeParse(formData);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  const data = validation.data;

  // Seul owner peut changer les rôles
  const permCheck = await requireTeamPermission(data.teamId, "team.members.edit_role");
  if (!permCheck.success) {
    return permCheck;
  }

  const supabase = await createClient();

  // Récupérer l'ancien rôle
  const { data: member, error: fetchError } = await supabase
    .from("team_members")
    .select("role, user_id, user:profiles(full_name)")
    .eq("id", data.memberId)
    .eq("team_id", data.teamId)
    .single();

  if (fetchError || !member) {
    return { success: false, error: "Membre introuvable" };
  }

  // Empêcher la modification d'un owner
  if (member.role === "owner") {
    return { success: false, error: "Impossible de modifier le rôle du propriétaire" };
  }

  // Mettre à jour
  const { error } = await supabase
    .from("team_members")
    .update({ role: data.newRole, updated_at: new Date().toISOString() })
    .eq("id", data.memberId);

  if (error) {
    console.error("Erreur changement rôle:", error);
    return { success: false, error: "Erreur lors du changement de rôle" };
  }

  // Audit log
  await logTeamAudit(
    data.teamId,
    permCheck.userId,
    "member.role_changed",
    "member",
    data.memberId,
    { role: member.role },
    { role: data.newRole }
  );

  revalidatePath("/gestion/equipe");

  const memberUser = member.user as unknown as { full_name: string | null } | null;
  return {
    success: true,
    message: `Rôle de ${memberUser?.full_name || "membre"} modifié`,
  };
}

// =====================================================
// SUPPRESSION DE MEMBRE
// =====================================================

export async function removeTeamMember(
  teamId: string,
  memberId: string
): Promise<TeamActionResult> {
  const permCheck = await requireTeamPermission(teamId, "team.members.remove");
  if (!permCheck.success) {
    return permCheck;
  }

  const supabase = await createClient();

  // Récupérer le membre
  const { data: member } = await supabase
    .from("team_members")
    .select("role, user_id, user:profiles(email, full_name)")
    .eq("id", memberId)
    .eq("team_id", teamId)
    .single();

  if (!member) {
    return { success: false, error: "Membre introuvable" };
  }

  // Empêcher la suppression d'un owner
  if (member.role === "owner") {
    return { success: false, error: "Impossible de supprimer le propriétaire de l'équipe" };
  }

  // Supprimer
  const { error } = await supabase.from("team_members").delete().eq("id", memberId);

  if (error) {
    console.error("Erreur suppression membre:", error);
    return { success: false, error: "Erreur lors de la suppression" };
  }

  // Audit log
  await logTeamAudit(teamId, permCheck.userId, "member.removed", "member", memberId, member, null);

  revalidatePath("/gestion/equipe");

  return { success: true, message: "Membre retiré de l'équipe" };
}

// =====================================================
// ANNULATION D'INVITATION
// =====================================================

export async function cancelInvitation(
  teamId: string,
  invitationId: string
): Promise<TeamActionResult> {
  const permCheck = await requireTeamPermission(teamId, "team.members.invite");
  if (!permCheck.success) {
    return permCheck;
  }

  const supabase = await createClient();

  const { data: invitation } = await supabase
    .from("team_invitations")
    .select("email, status")
    .eq("id", invitationId)
    .eq("team_id", teamId)
    .single();

  if (!invitation) {
    return { success: false, error: "Invitation introuvable" };
  }

  if (invitation.status !== "pending") {
    return { success: false, error: "Cette invitation n'est plus active" };
  }

  const { error } = await supabase
    .from("team_invitations")
    .update({ status: "cancelled" })
    .eq("id", invitationId);

  if (error) {
    console.error("Erreur annulation invitation:", error);
    return { success: false, error: "Erreur lors de l'annulation" };
  }

  // Audit log
  await logTeamAudit(teamId, permCheck.userId, "invitation.cancelled", "invitation", invitationId, invitation, null);

  revalidatePath("/gestion/equipe/invitations");

  return { success: true, message: "Invitation annulée" };
}

// =====================================================
// QUITTER L'ÉQUIPE
// =====================================================

export async function leaveTeam(teamId: string): Promise<TeamActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Non connecté" };
  }

  // Récupérer le membership
  const { data: membership } = await supabase
    .from("team_members")
    .select("id, role")
    .eq("team_id", teamId)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return { success: false, error: "Vous n'êtes pas membre de cette équipe" };
  }

  // Un owner ne peut pas quitter (doit transférer d'abord)
  if (membership.role === "owner") {
    return {
      success: false,
      error: "En tant que propriétaire, vous devez transférer la propriété avant de quitter",
    };
  }

  // Supprimer le membership
  const { error } = await supabase.from("team_members").delete().eq("id", membership.id);

  if (error) {
    console.error("Erreur quitter équipe:", error);
    return { success: false, error: "Erreur lors du départ de l'équipe" };
  }

  // Audit log
  await logTeamAudit(teamId, user.id, "member.removed", "member", user.id, { self: true }, null);

  revalidatePath("/gestion/equipe");
  revalidatePath("/gestion");

  return { success: true, message: "Vous avez quitté l'équipe" };
}
