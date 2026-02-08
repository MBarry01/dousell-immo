import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { cache } from "react";
import { TeamRole } from "@/types/team";

/**
 * Récupère le contexte d'équipe de l'utilisateur connecté (Pattern Enterprise)
 * Utilisé comme Single Source of Truth (SSOT) dans toute l'application.
 * 
 * L'utilisation de 'cache' de React garantit que la requête n'est exécutée 
 * qu'une seule fois par cycle de rendu (Request Memoization).
 */
export const getUserTeamContext = cache(async () => {
    const t0 = Date.now();
    const LOG = "[TeamContext]";
    const supabase = await createClient();

    // 1. Récupérer l'utilisateur
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
        console.error(LOG, "✗ Auth error:", authError.message, authError.status);
        redirect("/auth/login");
    }
    if (!user) {
        console.warn(LOG, "✗ Pas d'utilisateur authentifié");
        redirect("/auth/login");
    }
    console.log(LOG, `✓ User récupéré en ${Date.now() - t0}ms:`, user.id.slice(0, 8), user.email);

    // 2. Récupérer l'équipe active (via cookie ou fallback)
    const { getActiveTeamId } = await import("@/lib/team-switching");
    const preferredTeamId = await getActiveTeamId();
    console.log(LOG, "Cookie team préférée:", preferredTeamId?.slice(0, 8) || "aucune");

    // On récupère TOUS les memberships actifs (pour pouvoir choisir le bon)
    const t1 = Date.now();
    const { data: memberships, error: teamError } = await supabase
        .from('team_members')
        .select(`
            role,
            team_id,
            teams (
                id,
                name,
                slug,
                subscription_status,
                subscription_trial_ends_at,
                subscription_tier,
                company_address,
                company_phone,
                company_email,
                company_ninea,
                logo_url,
                signature_url
            )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');

    console.log(LOG, `Memberships query en ${Date.now() - t1}ms:`, {
        count: memberships?.length ?? 0,
        error: teamError?.message || null,
        teamIds: memberships?.map(m => m.team_id?.slice(0, 8)),
    });

    // 3. Sélectionner la bonne équipe
    let memberData = null;

    if (memberships && memberships.length > 0) {
        if (preferredTeamId) {
            memberData = memberships.find(m => m.team_id === preferredTeamId);
            if (!memberData) {
                console.warn(LOG, `Team préférée ${preferredTeamId.slice(0, 8)} non trouvée dans memberships, fallback`);
            }
        }
        // Fallback: Si pas de cookie ou équipe non trouvée, prendre la première
        if (!memberData) {
            memberData = memberships[0];
        }
    }

    // 4. Auto-Healing: Si pas d'équipe (cas rare post-migration ou nouveau user essayant d'accéder à gestion)
    // On redirige vers l'onboarding pro
    if (teamError || !memberData) {
        console.warn(LOG, `✗ No active team for user ${user.id}`, {
            teamError: teamError?.message,
            membershipsCount: memberships?.length ?? 0,
            memberData: !!memberData,
        });
        redirect("/pro/start");
    }

    // teams est renvoyé comme un objet simple
    const team = Array.isArray(memberData.teams) ? memberData.teams[0] : memberData.teams;

    if (!team) {
        console.warn(LOG, `✗ Team data missing for user ${user.id}, memberData.teams:`, memberData.teams);
        redirect("/pro/start");
    }

    console.log(LOG, `✓ Contexte complet en ${Date.now() - t0}ms:`, {
        teamId: memberData.team_id?.slice(0, 8),
        teamName: team.name,
        role: memberData.role,
        tier: team.subscription_tier,
        sub_status: team.subscription_status,
    });

    // 4. Retour standardisé
    return {
        user,
        team, // L'objet équipe complet
        teamId: memberData.team_id as string, // L'ID pour les requêtes (plus propre que team.id)
        role: memberData.role as TeamRole, // Le rôle typé pour les permissions
        subscription_status: team.subscription_status,
        subscription_trial_ends_at: team.subscription_trial_ends_at,
        subscription_tier: team.subscription_tier,
    };
});
