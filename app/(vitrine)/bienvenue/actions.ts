"use server";

import { createClient } from "@/utils/supabase/server";
import { createPersonalTeam } from "@/lib/team-permissions.server";
import { redirect } from "next/navigation";

/**
 * Active l'essai gratuit de gestion locative pour un utilisateur existant
 * (typiquement un user Google OAuth qui choisit "Gérer mes biens" sur /bienvenue)
 */
export async function activateGestionTrial() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Non connecté" };
    }

    // Vérifier que l'utilisateur n'a pas déjà une équipe
    const { data: existingMembership } = await supabase
        .from("team_members")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();

    if (existingMembership) {
        // Déjà une équipe, rediriger directement
        redirect("/gestion");
    }

    // Créer l'équipe personnelle avec trial
    const teamContext = await createPersonalTeam(
        user.id,
        user.email || "Utilisateur",
        { ...user.user_metadata, selected_plan: "starter" }
    );

    if (!teamContext) {
        return { error: "Erreur lors de la création de votre espace. Veuillez réessayer." };
    }

    // Marquer first_login comme false
    await supabase
        .from("profiles")
        .update({ first_login: false })
        .eq("id", user.id);

    redirect("/gestion");
}
