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

  const { data: memberships, error: memError } = await supabaseAdmin
    .from("team_members")
    .select(`
      id,
      team_id,
      role,
      status,
      team:teams(*)
    `)
    .eq("user_id", user.id)
    .eq("status", "active");

  if (memError) {
    console.error("[WorkspaceLayout] ✗ Erreur fetch memberships:", memError);
  }

  const teams = (memberships?.map((m: any) => {
    const team = Array.isArray(m.team) ? m.team[0] : m.team;
    if (!team) return null;

    let effectiveStatus = team.subscription_status || "canceled";
    let effectiveTier = team.subscription_tier || "starter";

    if (effectiveStatus === "trialing" && team.subscription_trial_ends_at) {
      const trialEnd = new Date(team.subscription_trial_ends_at);
      if (trialEnd < new Date()) {
        effectiveStatus = "past_due";
        effectiveTier = "starter";
      }
    }

    return {
      id: team.id || m.team_id,
      name: team.name || "Mon équipe",
      slug: team.slug || "",
      logo_url: team.logo_url,
      company_name: team.company_name ?? null,
      company_address: team.company_address ?? null,
      company_phone: team.company_phone ?? null,
      role: m.role,
      subscription_tier: effectiveTier,
      subscription_status: effectiveStatus,
      status: m.status || "active",
    };
  }).filter(Boolean) || []) as any[];

  // Trouver l'équipe active (via cookie ou première par défaut)
  const { getActiveTeamId } = await import("@/lib/team-switching");
  const preferredTeamId = await getActiveTeamId();

  // Vérifier si l'équipe préférée existe toujours dans les équipes de l'utilisateur
  const activeTeamExists = preferredTeamId ? teams.some(t => t?.id === preferredTeamId) : false;
  const currentTeamId = activeTeamExists ? preferredTeamId : (teams[0]?.id || null);

  // NOUVEAU : Plus de redirection vers welcome modal ici. 
  // Le layout du workspace est universel pour tous les utilisateurs connectés.
  // Les pages spécifiques (ex: /gestion) peuvent avoir leurs propres gardes si nécessaire.

  return (
    <WorkspaceLayoutClient
      user={user}
      teams={teams as any}
      currentTeamId={currentTeamId}
    >
      {children}
    </WorkspaceLayoutClient>
  );
}
