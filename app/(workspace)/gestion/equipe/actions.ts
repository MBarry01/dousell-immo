"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  TEAM_ROLE_CONFIG,
} from "@/lib/team-permissions";
import { getUserTeamContext } from "@/lib/team-context";
import { requireTeamPermission, requireTeamRole } from "@/lib/permissions";
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
 * Récupère l'équipe de l'utilisateur connecté (SSOT)
 */
export async function getCurrentUserTeam(): Promise<{
  success: boolean;
  team?: Team;
  role?: TeamRole;
  error?: string;
}> {
  try {
    const { team, role } = await getUserTeamContext();
    return {
      success: true,
      team: team as unknown as Team,
      role: role as TeamRole,
    };
  } catch (error) {
    console.error("Erreur récupération équipe:", error);
    return { success: false, error: "Erreur lors de la récupération de l'équipe" };
  }
}

/**
 * Récupère les membres d'une équipe
 */
export async function getTeamMembers(
  teamId: string
): Promise<{ success: boolean; members?: TeamMember[]; error?: string }> {
  try {
    const { teamId: activeTeamId } = await requireTeamPermission("team.members.view");

    // Sécurité additionnelle
    if (activeTeamId !== teamId) {
      return { success: false, error: "Accès non autorisé à cette équipe" };
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
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Récupère les invitations en attente
 */
export async function getTeamInvitations(
  teamId: string
): Promise<{ success: boolean; invitations?: TeamInvitation[]; error?: string }> {
  try {
    const { teamId: activeTeamId } = await requireTeamPermission("team.members.view");

    if (activeTeamId !== teamId) {
      return { success: false, error: "Accès non autorisé" };
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
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Récupère les logs d'audit
 */
export async function getTeamAuditLogs(
  teamId: string,
  limit = 50
): Promise<{ success: boolean; logs?: TeamAuditLog[]; error?: string }> {
  try {
    const { teamId: activeTeamId } = await requireTeamPermission("team.audit.view");

    if (activeTeamId !== teamId) {
      return { success: false, error: "Accès non autorisé" };
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
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Récupère les statistiques de l'équipe
 */
export async function getTeamStats(
  teamId: string
): Promise<{ success: boolean; stats?: TeamStats; error?: string }> {
  try {
    const { teamId: activeTeamId } = await requireTeamPermission("team.members.view");

    if (activeTeamId !== teamId) {
      return { success: false, error: "Accès non autorisé" };
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
  } catch (err: any) {
    return { success: false, error: err.message };
  }
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
  try {
    const { user, teamId: activeTeamId } = await requireTeamPermission("team.settings.edit");

    if (activeTeamId !== teamId) {
      return { success: false, error: "Accès non autorisé" };
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
      user.id,
      "team.updated",
      "team",
      teamId,
      oldTeam,
      updates
    );

    revalidatePath("/gestion/equipe");
    revalidatePath("/gestion/equipe/parametres");

    return { success: true, message: "Équipe mise à jour" };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// =====================================================
// INVITATION DE MEMBRE
// =====================================================

export async function inviteTeamMember(
  formData: z.infer<typeof inviteMemberSchema>
): Promise<InviteMemberResult> {
  try {
    const validation = inviteMemberSchema.safeParse(formData);
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0].message };
    }

    const data = validation.data;

    // Vérifier permission
    const { user, teamId: activeTeamId } = await requireTeamPermission("team.members.invite");

    if (activeTeamId !== data.teamId) {
      return { success: false, error: "Accès non autorisé" };
    }

    const supabase = await createClient();

    // ✅ QUOTA: Vérifier la limite de membres pour les équipes Trial
    const supabaseAdmin = createAdminClient();

    const { data: team, error: teamError } = await supabaseAdmin
      .from("teams")
      .select("subscription_status")
      .eq("id", data.teamId)
      .single();

    if (teamError) {
      console.error("[Team Quota] Error fetching team:", teamError);
      return { success: false, error: "Erreur lors de la récupération des informations de l'équipe" };
    }

    // Si équipe en trial, vérifier la limite de 3 membres
    if (team.subscription_status === 'trial') {
      // 1. Emails des membres actifs (pour ne pas compter les invitations redondantes)
      const { data: members } = await supabaseAdmin
        .from("team_members")
        .select("user:profiles(email)")
        .eq("team_id", data.teamId)
        .eq("status", "active");

      const memberEmails = new Set(
        members?.map(m => (m.user as any)?.email?.toLowerCase()).filter(Boolean) || []
      );

      // 2. Invitations en attente valides (non expirées et pas déjà membres)
      const { data: pendingInvites } = await supabaseAdmin
        .from("team_invitations")
        .select("email, expires_at")
        .eq("team_id", data.teamId)
        .eq("status", "pending");

      const now = new Date();
      const validPendingInvites = (pendingInvites || []).filter(
        inv => {
          const isExpired = new Date(inv.expires_at) <= now;
          const isAlreadyMember = memberEmails.has(inv.email.toLowerCase());
          return !isExpired && !isAlreadyMember;
        }
      );

      // 3. Calcul du total
      const activeMembersCount = memberEmails.size;
      const totalCount = activeMembersCount + validPendingInvites.length;

      // Limite de 3 membres pour les équipes Trial
      if (totalCount >= 3) {
        return {
          success: false,
          error: "Limite atteinte : Les équipes en période d'essai sont limitées à 3 membres. Passez à un abonnement Pro pour inviter plus de membres.",
        };
      }
    }

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
        .eq("status", "active")
        .maybeSingle();

      if (existingMember) {
        return { success: false, error: "Cet utilisateur est déjà membre de l'équipe" };
      }
    }

    // Vérifier si invitation déjà en cours (avec admin client pour bypass RLS)
    const { data: existingInvite } = await supabaseAdmin
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
    const { data: teamInfo } = await supabase
      .from("teams")
      .select("name")
      .eq("id", data.teamId)
      .single();

    // Récupérer le nom de l'inviteur
    const { data: inviterProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    // ✅ CORRECT
    // Générer le token et l'expiration explicitement 
    const inviteToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 jours
    // Créer l'invitation avec le client admin (bypass RLS)
    const { data: invitation, error } = await supabaseAdmin
      .from("team_invitations")
      .insert({
        team_id: data.teamId,
        email: data.email.toLowerCase(),
        role: data.role,
        token: inviteToken,           // 🆕 Token explicite
        expires_at: expiresAt.toISOString(), // 🆕 Expiration explicite
        invited_by: user.id,
        message: data.message || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Erreur création invitation:", error);
      return { success: false, error: "Erreur lors de l'envoi de l'invitation" };
    }

    // Envoyer l'email d'invitation
    try {
      const roleConfig = TEAM_ROLE_CONFIG[data.role];
      const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/gestion/equipe/invitations/accept?token=${inviteToken}`;
      console.log("🔗 LIEN D'INVITATION GÉNÉRÉ:", inviteUrl); // DEBUG LOG

      const emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; padding: 12px 30px; background: #F4C430; color: #000; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
              .info-box { background: white; padding: 15px; border-left: 4px solid #F4C430; margin: 20px 0; border-radius: 4px; }
              .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">🏢 Invitation à rejoindre ${teamInfo?.name || "l'équipe"}</h1>
              </div>
              <div class="content">
                <p>Bonjour,</p>
                <p><strong>${inviterProfile?.full_name || "Un membre"}</strong> vous invite à rejoindre l'équipe <strong>${teamInfo?.name || "l'équipe"}</strong> sur <strong>Dousell Immo</strong>.</p>

                <div class="info-box">
                  <p style="margin: 5px 0;"><strong>Rôle proposé:</strong> ${roleConfig.label}</p>
                  <p style="margin: 5px 0; color: #64748b;">${roleConfig.description}</p>
                </div>

                ${data.message ? `<p style="font-style: italic; color: #64748b;">"${data.message}"</p>` : ""}

                <div style="text-align: center;">
                  <a href="${inviteUrl}" class="button">Accepter l'invitation</a>
                </div>

                <p style="font-size: 14px; color: #64748b; margin-top: 20px;">
                  Cette invitation expire dans 7 jours. Si vous n'avez pas demandé cette invitation, vous pouvez ignorer cet email.
                </p>

                <p style="font-size: 14px; color: #64748b;">
                  Ou copiez ce lien dans votre navigateur:<br>
                  <a href="${inviteUrl}" style="color: #3b82f6; word-break: break-all;">${inviteUrl}</a>
                </p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Dousell Immo - Gestion Locative Intelligente</p>
              </div>
            </div>
          </body>
        </html>
      `;

      await sendEmail({
        to: data.email,
        subject: `Invitation à rejoindre ${teamInfo?.name || "l'équipe"} sur Dousell Immo`,
        html: emailHtml,
        fromName: "Dousell Immo",
      });
    } catch (emailError) {
      console.error("Erreur envoi email invitation:", emailError);
      // On ne bloque pas si l'email échoue, l'invitation est créée
    }

    // Audit log
    await logTeamAudit(data.teamId, user.id, "member.invited", "invitation", invitation.id, null, {
      email: data.email,
      role: data.role,
    });

    revalidatePath("/gestion/equipe");
    revalidatePath("/gestion/equipe/invitations");

    return { success: true, invitationId: invitation.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Renvoie une invitation (réinitialise l'expiration)
 */
export async function resendInvitation(
  teamId: string,
  invitationId: string
): Promise<TeamActionResult> {
  try {
    const { user, teamId: activeTeamId } = await requireTeamPermission("team.members.invite");

    if (activeTeamId !== teamId) {
      return { success: false, error: "Accès non autorisé" };
    }

    const supabaseAdmin = createAdminClient();

    // Récupérer l'invitation
    const { data: invitation, error: fetchError } = await supabaseAdmin
      .from("team_invitations")
      .select("*")
      .eq("id", invitationId)
      .eq("team_id", teamId)
      .single();

    if (fetchError || !invitation) {
      return { success: false, error: "Invitation introuvable" };
    }

    // Mettre à jour l'expiration (7 jours à partir de maintenant)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { error: updateError } = await supabaseAdmin
      .from("team_invitations")
      .update({
        expires_at: expiresAt.toISOString(),
        status: "pending", // Au cas où elle était expirée
        created_at: new Date().toISOString(), // On reset le timer visuel
      })
      .eq("id", invitationId);

    if (updateError) {
      return { success: false, error: "Erreur lors du renvoi de l'invitation" };
    }

    // Envoyer l'email d'invitation
    try {
      const supabase = await createClient();

      // Récupérer les infos de l'équipe et de l'inviteur
      const { data: team } = await supabase
        .from("teams")
        .select("name")
        .eq("id", teamId)
        .single();

      const { data: inviterProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      const roleConfig = TEAM_ROLE_CONFIG[invitation.role as TeamRole];
      const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/gestion/equipe/invitations/accept?token=${invitation.token}`;

      const emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; padding: 12px 30px; background: #F4C430; color: #000; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
              .info-box { background: white; padding: 15px; border-left: 4px solid #F4C430; margin: 20px 0; border-radius: 4px; }
              .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">🔄 Rappel - Invitation à rejoindre ${team?.name || "l'équipe"}</h1>
              </div>
              <div class="content">
                <p>Bonjour,</p>
                <p><strong>${inviterProfile?.full_name || "Un membre"}</strong> vous renvoie l'invitation à rejoindre l'équipe <strong>${team?.name || "l'équipe"}</strong> sur <strong>Dousell Immo</strong>.</p>

                <div class="info-box">
                  <p style="margin: 5px 0;"><strong>Rôle proposé:</strong> ${roleConfig.label}</p>
                  <p style="margin: 5px 0; color: #64748b;">${roleConfig.description}</p>
                </div>

                ${invitation.message ? `<p style="font-style: italic; color: #64748b;">"${invitation.message}"</p>` : ""}

                <div style="text-align: center;">
                  <a href="${inviteUrl}" class="button">Accepter l'invitation</a>
                </div>

                <p style="font-size: 14px; color: #64748b; margin-top: 20px;">
                  Cette invitation a été renvoyée et expire dans 7 jours. Si vous n'avez pas demandé cette invitation, vous pouvez ignorer cet email.
                </p>

                <p style="font-size: 14px; color: #64748b;">
                  Ou copiez ce lien dans votre navigateur:<br>
                  <a href="${inviteUrl}" style="color: #3b82f6; word-break: break-all;">${inviteUrl}</a>
                </p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Dousell Immo - Gestion Locative Intelligente</p>
              </div>
            </div>
          </body>
        </html>
      `;

      await sendEmail({
        to: invitation.email,
        subject: `Rappel - Invitation à rejoindre ${team?.name || "l'équipe"} sur Dousell Immo`,
        html: emailHtml,
        fromName: "Dousell Immo",
      });
    } catch (emailError) {
      console.error("Erreur envoi email rappel invitation:", emailError);
      // On ne bloque pas si l'email échoue
    }

    // Audit log
    await logTeamAudit(teamId, user.id, "member.invitation_resent", "invitation", invitationId, null, {
      email: invitation.email,
    });

    revalidatePath("/gestion/equipe");
    return { success: true, message: "Invitation renvoyée" };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Annule une invitation
 */
export async function cancelInvitation(
  teamId: string,
  invitationId: string
): Promise<TeamActionResult> {
  try {
    const { user, teamId: activeTeamId } = await requireTeamPermission("team.members.invite");

    if (activeTeamId !== teamId) {
      return { success: false, error: "Accès non autorisé" };
    }

    const supabaseAdmin = createAdminClient();

    const { error } = await supabaseAdmin
      .from("team_invitations")
      .update({ status: "cancelled" })
      .eq("id", invitationId)
      .eq("team_id", teamId);

    if (error) {
      return { success: false, error: "Erreur lors de l'annulation" };
    }

    // Audit log
    await logTeamAudit(teamId, user.id, "member.invitation_cancelled", "invitation", invitationId, null, null);

    revalidatePath("/gestion/equipe");
    return { success: true, message: "Invitation annulée" };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
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

  // Fallback: logique manuelle avec client Admin (bypass RLS)
  const supabaseAdmin = createAdminClient();

  const { data: invitation, error: invError } = await supabaseAdmin
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
    await supabaseAdmin.from("team_invitations").update({ status: "expired" }).eq("id", invitation.id);
    return { success: false, error: "Cette invitation a expiré" };
  }

  // Vérifier si déjà membre (et son statut)
  // Ensure profile exists (fix for missing trigger or race condition)
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    // Attempt to create profile if missing
    const { error: createProfileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0],
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
        updated_at: new Date().toISOString(),
      });

    if (createProfileError) {
      console.error("Error creating missing profile:", createProfileError);
    }
  }

  // Vérifier si déjà membre (et son statut)
  const { data: existingMember } = await supabaseAdmin
    .from("team_members")
    .select("status")
    .eq("team_id", invitation.team_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingMember) {
    if (existingMember.status === 'active') {
      // Déjà actif -> Succès (Idempotence)
      await supabaseAdmin.from("team_invitations").update({ status: "accepted", accepted_at: new Date().toISOString() }).eq("id", invitation.id);

      // Activer l'équipe automatiquement
      const { setActiveTeam } = await import("@/lib/team-switching");
      await setActiveTeam(invitation.team_id);

      revalidatePath("/gestion/equipe");

      const team = invitation.team as unknown as { id: string; name: string };
      return {
        success: true,
        teamId: team.id,
        teamName: team.name,
        role: invitation.role as TeamRole,
      };
    } else {
      // Existe mais pas actif -> Réactiver
      const { error: updateError } = await supabaseAdmin
        .from("team_members")
        .update({
          status: 'active',
          role: invitation.role,
          joined_at: new Date().toISOString(),
          invited_by: invitation.invited_by
        })
        .eq("team_id", invitation.team_id)
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Erreur réactivation membre:", updateError);
        return { success: false, error: "Erreur lors de l'activation du membre" };
      }
    }
  } else {
    // Nouveau membre -> Insérer
    const { error: memberError } = await supabaseAdmin.from("team_members").insert({
      team_id: invitation.team_id,
      user_id: user.id,
      role: invitation.role,
      status: "active",
      invited_by: invitation.invited_by,
      joined_at: new Date().toISOString(),
    });

    if (memberError) {
      console.error("Erreur ajout membre:", memberError);
      return { success: false, error: "Erreur lors de l'adhésion à l'équipe" };
    }
  }

  // Marquer invitation comme acceptée avec admin client
  await supabaseAdmin
    .from("team_invitations")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", invitation.id);

  // Audit log
  await logTeamAudit(invitation.team_id, user.id, "member.joined", "member", user.id, null, {
    role: invitation.role,
    via: "invitation",
  });

  // Activer l'équipe automatiquement
  const { setActiveTeam } = await import("@/lib/team-switching");
  await setActiveTeam(invitation.team_id);

  revalidatePath("/gestion/equipe");
  revalidatePath("/gestion");

  const team = invitation.team as unknown as { id: string; name: string };
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
  try {
    const validation = changeRoleSchema.safeParse(formData);
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0].message };
    }

    const data = validation.data;

    // Seul owner ou manager avec permission spécifique peut changer les rôles
    const { user, teamId: activeTeamId } = await requireTeamPermission("team.members.edit_role");

    if (activeTeamId !== data.teamId) {
      return { success: false, error: "Accès non autorisé" };
    }

    const supabaseAdmin = createAdminClient();

    // Récupérer l'ancien rôle
    const { data: member, error: fetchError } = await supabaseAdmin
      .from("team_members")
      .select("role, user_id")
      .eq("id", data.memberId)
      .eq("team_id", data.teamId)
      .single();

    if (fetchError || !member) {
      return { success: false, error: "Membre introuvable" };
    }

    // Empêcher la modification d'un owner (sauf par lui-même si on veut autoriser le transfert, mais ici restons simple)
    if (member.role === "owner") {
      return { success: false, error: "Impossible de modifier le rôle du propriétaire" };
    }

    // Mettre à jour
    const { error } = await supabaseAdmin
      .from("team_members")
      .update({ role: data.newRole, updated_at: new Date().toISOString() })
      .eq("id", data.memberId);

    if (error) {
      return { success: false, error: "Erreur lors du changement de rôle" };
    }

    // Audit log
    await logTeamAudit(
      data.teamId,
      user.id,
      "member.role_changed",
      "member",
      data.memberId,
      { role: member.role },
      { role: data.newRole }
    );

    revalidatePath("/gestion/equipe");
    return { success: true, message: "Rôle mis à jour" };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Supprime un membre de l'équipe
 */
export async function removeTeamMember(
  teamId: string,
  memberId: string
): Promise<TeamActionResult> {
  try {
    const { user, teamId: activeTeamId } = await requireTeamPermission("team.members.remove");

    if (activeTeamId !== teamId) {
      return { success: false, error: "Accès non autorisé" };
    }

    const supabaseAdmin = createAdminClient();

    // Récupérer le membre pour vérifier son rôle
    const { data: member, error: fetchError } = await supabaseAdmin
      .from("team_members")
      .select("role, user_id")
      .eq("id", memberId)
      .eq("team_id", teamId)
      .single();

    if (fetchError || !member) {
      return { success: false, error: "Membre introuvable" };
    }

    if (member.role === "owner") {
      return { success: false, error: "Impossible de supprimer le propriétaire" };
    }

    // Suppression (logique)
    const { error } = await supabaseAdmin
      .from("team_members")
      .update({ status: "removed", removed_at: new Date().toISOString() })
      .eq("id", memberId);

    if (error) {
      return { success: false, error: "Erreur lors de la suppression" };
    }

    // Audit log
    await logTeamAudit(teamId, user.id, "member.removed", "member", memberId, { role: member.role }, null);

    revalidatePath("/gestion/equipe");
    return { success: true, message: "Membre supprimé" };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Récupère toutes les équipes dont l'utilisateur est membre
 */
export async function getUserTeams(): Promise<{
  success: boolean;
  teams?: Array<{
    id: string;
    name: string;
    slug: string;
    role: string;
    is_active: boolean;
  }>;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Non connecté" };
    }

    // Utiliser le client admin pour éviter les problèmes de RLS
    const supabaseAdmin = createAdminClient();

    // Récupérer tous les memberships actifs
    const { data: memberships, error } = await supabaseAdmin
      .from("team_members")
      .select(`
        team_id,
        role,
        team:teams(id, name, slug)
      `)
      .eq("user_id", user.id)
      .eq("status", "active");

    if (error) {
      console.error("Erreur récupération équipes:", error);
      return { success: false, error: "Erreur lors de la récupération des équipes" };
    }

    if (!memberships || memberships.length === 0) {
      return { success: true, teams: [] };
    }

    // Récupérer l'équipe active depuis le contexte
    const { teamId: activeTeamId } = await getUserTeamContext();

    const teams = memberships.map((m) => {
      const team = m.team as unknown as { id: string; name: string; slug: string };
      return {
        id: team.id,
        name: team.name,
        slug: team.slug,
        role: m.role,
        is_active: team.id === activeTeamId,
      };
    });

    return { success: true, teams };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Change l'équipe active pour l'utilisateur (stocké en cookie/session)
 */
export async function switchActiveTeam(teamId: string): Promise<TeamActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Non connecté" };
    }

    // Vérifier que l'utilisateur est bien membre de cette équipe
    const supabaseAdmin = createAdminClient();
    const { data: membership, error } = await supabaseAdmin
      .from("team_members")
      .select("id, role")
      .eq("user_id", user.id)
      .eq("team_id", teamId)
      .eq("status", "active")
      .single();

    if (error || !membership) {
      return { success: false, error: "Vous n'êtes pas membre de cette équipe" };
    }

    // ✅ CORRECTION SÉCURITÉ: Persister l'équipe active dans un cookie sécurisé
    // Cela permet au système de savoir quelle équipe afficher lors des prochaines requêtes
    const { setActiveTeam } = await import("@/lib/team-switching");
    await setActiveTeam(teamId);

    // Audit log
    await logTeamAudit(teamId, user.id, "team.switched", "team", teamId, null, {
      from: "previous_team",
      to: teamId,
    });

    // Revalider les chemins pour forcer le refresh des données
    revalidatePath("/gestion");
    revalidatePath("/gestion/equipe");
    revalidatePath("/gestion/biens");

    return { success: true, message: "Équipe changée avec succès" };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Permet à un utilisateur de quitter l'équipe
 */
export async function leaveTeam(teamId: string): Promise<TeamActionResult> {
  try {
    const { user, role } = await getUserTeamContext();

    if (role === "owner") {
      return { success: false, error: "Le propriétaire ne peut pas quitter l'équipe directement. Vous devez d'abord transférer la propriété ou supprimer l'équipe." };
    }

    const supabaseAdmin = createAdminClient();

    const { error } = await supabaseAdmin
      .from("team_members")
      .update({ status: "left", left_at: new Date().toISOString() })
      .eq("team_id", teamId)
      .eq("user_id", user.id);

    if (error) {
      return { success: false, error: "Erreur lors du départ de l'équipe" };
    }

    // Audit log
    await logTeamAudit(teamId, user.id, "member.left", "member", user.id, null, null);

    revalidatePath("/gestion/equipe");
    revalidatePath("/gestion");

    return { success: true, message: "Vous avez quitté l'équipe" };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
