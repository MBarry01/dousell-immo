import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { redirect } from "next/navigation";
import { WorkspaceLayoutClient } from "./workspace-layout-client";

export const dynamic = "force-dynamic";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Protection côté serveur - redirection si non connecté
  if (!user) {
    redirect("/login");
  }

  // Récupérer les équipes de l'utilisateur pour le TeamSwitcher
  const supabaseAdmin = createAdminClient();
  const { data: memberships } = await supabaseAdmin
    .from("team_members")
    .select(`
      team_id,
      role,
      team:teams(id, name, slug, logo_url, subscription_tier, subscription_status, subscription_trial_ends_at, stripe_subscription_id)
    `)
    .eq("user_id", user.id)
    .eq("status", "active");

  const teams = memberships?.map((m) => {
    const team = m.team as unknown as {
      id: string; name: string; slug: string; logo_url: string | null;
      subscription_tier: string; subscription_status: string;
      subscription_trial_ends_at: string | null; stripe_subscription_id: string | null;
    };

    // Calculer le statut et tier effectifs (le cron peut ne pas avoir encore tourné)
    let effectiveStatus = team?.subscription_status || "canceled";
    let effectiveTier = team?.subscription_tier || "starter";

    if (effectiveStatus === "trialing" && team?.subscription_trial_ends_at) {
      const trialEnd = new Date(team.subscription_trial_ends_at);
      if (trialEnd < new Date()) {
        effectiveStatus = "past_due";
        effectiveTier = "starter";
      }
    }

    return {
      id: team?.id || m.team_id,
      name: team?.name || "Mon équipe",
      slug: team?.slug || "",
      logo_url: team?.logo_url,
      role: m.role,
      subscription_tier: effectiveTier,
      subscription_status: effectiveStatus,
      status: "active",
    };
  }) || [];

  // Si l'utilisateur n'a aucune équipe, le rediriger vers la vitrine
  // avec le modal de bienvenue pour choisir son parcours
  if (teams.length === 0) {
    redirect("/pro/start");
  }

  // Trouver l'équipe active (via cookie ou première par défaut)
  const { getActiveTeamId } = await import("@/lib/team-switching");
  const preferredTeamId = await getActiveTeamId();

  // Vérifier si l'équipe préférée existe toujours dans les équipes de l'utilisateur
  const activeTeamExists = preferredTeamId ? teams.some(t => t.id === preferredTeamId) : false;

  const currentTeamId = activeTeamExists ? preferredTeamId : (teams[0]?.id || null);

  return (
    <WorkspaceLayoutClient
      user={user}
      teams={teams}
      currentTeamId={currentTeamId}
    >
      {children}
    </WorkspaceLayoutClient>
  );
}
