/**
 * Fonctions serveur pour le système de permissions d'équipe
 * Dousell Immo - Gestion Locative SaaS
 * 
 * CE FICHIER NE DOIT ÊTRE IMPORTÉ QUE DANS DES SERVER COMPONENTS OU SERVER ACTIONS
 */

import { createClient } from "@/utils/supabase/server";
import type { TeamRole, UserTeamContext } from "@/types/team";
import { TEAM_PERMISSIONS, TEAM_ROLE_CONFIG, type TeamPermissionKey } from "./team-permissions";

// =====================================================
// FONCTIONS DE RÉCUPÉRATION
// =====================================================

/**
 * Récupère le contexte d'équipe de l'utilisateur connecté
 * Si l'utilisateur n'a pas d'équipe, en crée une personnelle automatiquement
 */
export async function getUserTeamContext(preferredTeamId?: string): Promise<UserTeamContext | null> {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    // 🆕 Vérifier la préférence d'équipe active (cookie)
    if (!preferredTeamId) {
        const { getActiveTeamId } = await import("@/lib/team-switching");
        preferredTeamId = await getActiveTeamId() || undefined;
    }

    // Si une équipe préférée est définie, la récupérer en priorité
    if (preferredTeamId) {
        const { data: preferredMembership } = await supabase
            .from("team_members")
            .select(
                `
        team_id,
        role,
        team:teams(
          name, 
          slug,
          subscription_status,
          subscription_trial_ends_at,
          subscription_tier
        )
      `
            )
            .eq("user_id", user.id)
            .eq("team_id", preferredTeamId)
            .eq("status", "active")
            .maybeSingle();

        if (preferredMembership?.team) {
            const teamData = preferredMembership.team;
            const team = (Array.isArray(teamData) ? teamData[0] : teamData) as {
                name: string;
                slug: string;
                subscription_status?: string;
                subscription_trial_ends_at?: string;
                subscription_tier?: string;
            };

            if (team) {
                return {
                    team_id: preferredMembership.team_id,
                    team_name: team.name,
                    team_slug: team.slug,
                    user_role: preferredMembership.role as TeamRole,
                    subscription_status: team.subscription_status as any,
                    subscription_trial_ends_at: team.subscription_trial_ends_at,
                    subscription_tier: team.subscription_tier as any,
                };
            }
        }
    }

    // Utiliser la fonction RPC pour bypass RLS si nécessaire
    const { data, error } = await supabase.rpc("get_user_team", {
        p_user_id: user.id,
    });

    if (error || !data || data.length === 0) {
        // Fallback: requête directe avec subscription_status
        const { data: membership } = await supabase
            .from("team_members")
            .select(
                `
        team_id,
        role,
        team:teams(
          name, 
          slug,
          subscription_status,
          subscription_trial_ends_at,
          subscription_tier
        )
      `
            )
            .eq("user_id", user.id)
            .eq("status", "active")
            .maybeSingle();

        if (!membership?.team) {
            // Pas d'équipe trouvée - retourner null
            // La création d'équipe se fait explicitement via createPersonalTeam()
            // appelé depuis auth-redirect.ts quand l'utilisateur a un selected_plan
            console.log(`[getUserTeamContext] No team for user ${user.id}, returning null`);
            return null;
        }

        const teamData = membership.team;
        // Handle potential array return from Supabase
        const team = (Array.isArray(teamData) ? teamData[0] : teamData) as {
            name: string;
            slug: string;
            subscription_status?: string;
            subscription_trial_ends_at?: string;
            subscription_tier?: string;
        };

        if (!team) return null;

        return {
            team_id: membership.team_id,
            team_name: team.name,
            team_slug: team.slug,
            user_role: membership.role as TeamRole,
            subscription_status: team.subscription_status as any,
            subscription_trial_ends_at: team.subscription_trial_ends_at,
            subscription_tier: team.subscription_tier as any,
        };
    }

    // ✅ AMÉLIORATION: Inclure subscription dans le contexte (évite un appel DB supplémentaire)
    return {
        team_id: data[0].team_id,
        team_name: data[0].team_name,
        team_slug: data[0].team_slug,
        user_role: data[0].user_role as TeamRole,
        subscription_status: data[0].subscription_status as any,
        subscription_trial_ends_at: data[0].subscription_trial_ends_at,
        subscription_tier: data[0].subscription_tier as any,
    };
}

/**
 * Crée une équipe personnelle pour un utilisateur qui n'en a pas.
 * Appelé explicitement depuis auth-redirect.ts quand l'utilisateur a un selected_plan,
 * ou depuis /pro/start quand l'utilisateur active manuellement son essai.
 */
export async function createPersonalTeam(userId: string, userEmail: string, metadata?: Record<string, unknown>): Promise<UserTeamContext | null> {
    const supabase = await createClient();

    // Générer un slug unique
    const slug = `perso-${userId.substring(0, 8)}`;
    const userName = userEmail.split("@")[0] || "Utilisateur";
    const teamName = `Espace de ${userName}`;

    // Extraire le plan des métadonnées (inscrit via signup)
    const selectedPlan = metadata?.selected_plan || "starter";
    const trialDays = 14;
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

    try {
        // Créer l'équipe avec le plan initial
        const { data: newTeam, error: teamError } = await supabase
            .from("teams")
            .insert({
                name: teamName,
                slug,
                subscription_tier: selectedPlan,
                subscription_status: 'trial',
                subscription_trial_ends_at: trialEndsAt.toISOString()
            })
            .select("id, name, slug, subscription_tier, subscription_status, subscription_trial_ends_at")
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
            subscription_tier: newTeam.subscription_tier as any,
            subscription_status: newTeam.subscription_status as any,
            subscription_trial_ends_at: newTeam.subscription_trial_ends_at,
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
