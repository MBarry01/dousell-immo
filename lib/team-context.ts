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
    const supabase = await createClient();

    // 1. Récupérer l'utilisateur
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        redirect("/auth/login");
    }

    // 2. Récupérer l'équipe active (via cookie ou fallback)
    const { getActiveTeamId } = await import("@/lib/team-switching");
    const preferredTeamId = await getActiveTeamId();

    // On récupère TOUS les memberships actifs (pour pouvoir choisir le bon)
    const { data: memberships, error: teamError } = await supabase
        .from('team_members')
        .select(`
            role,
            team_id,
            teams (*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');

    // 3. Sélectionner la bonne équipe
    let memberData = null;

    if (memberships && memberships.length > 0) {
        if (preferredTeamId) {
            memberData = memberships.find(m => m.team_id === preferredTeamId);
        }
        // Fallback: Si pas de cookie ou équipe non trouvée, prendre la première
        if (!memberData) {
            memberData = memberships[0];
        }
    }

    // 4. Auto-Healing: Si pas d'équipe (cas rare post-migration ou nouveau user essayant d'accéder à gestion)
    // On redirige vers l'onboarding pro
    if (teamError || !memberData) {
        console.warn(`[TeamContext] No active team found for user ${user.id}, redirecting to pro start`);
        redirect("/pro/start");
    }

    // teams est renvoyé comme un objet simple
    const team = Array.isArray(memberData.teams) ? memberData.teams[0] : memberData.teams;

    if (!team) {
        console.warn(`[TeamContext] Team data missing for user ${user.id}, redirecting to pro start`);
        redirect("/pro/start");
    }

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
