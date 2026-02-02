import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { redirect } from "next/navigation";
import { TeamPageClient } from "./components/TeamPageClient";
import { CreateTeamPrompt } from "./components/CreateTeamPrompt";
import { getTeamStats } from "./actions";
import type { Team, TeamMember, TeamRole } from "@/types/team";

export const metadata = {
  title: "Équipe | Gestion Locative - Dousell Immo",
  description: "Gérez votre équipe et collaborateurs",
};

interface ProfileData {
  company_name: string | null;
  company_address: string | null;
  company_phone: string | null;
  company_email: string | null;
  company_ninea: string | null;
  full_name: string | null;
  email: string | null;
}

export default async function TeamPage() {
  const supabase = await createClient();
  const supabaseAdmin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  // Récupérer toutes les équipes actives de l'utilisateur
  const { data: memberships } = await supabaseAdmin
    .from("team_members")
    .select("team_id, role")
    .eq("user_id", user.id)
    .eq("status", "active");

  let team: Team | null = null;
  let membership = null;

  if (memberships && memberships.length > 0) {
    // 1. Déterminer l'équipe active via le cookie
    const { getActiveTeamId } = await import("@/lib/team-switching");
    const preferredTeamId = await getActiveTeamId();

    // 2. Trouver le membership correspondant à l'équipe préférée, ou prendre le premier par défaut
    const activeMembership = preferredTeamId
      ? memberships.find((m) => m.team_id === preferredTeamId)
      : memberships[0];

    // Si on a trouvé un membership valide (soit via cookie, soit le premier par défaut)
    const targetMembership = activeMembership || memberships[0];

    if (targetMembership) {
      const { data: teamData } = await supabaseAdmin
        .from("teams")
        .select("*")
        .eq("id", targetMembership.team_id)
        .single();

      if (teamData) {
        team = teamData as unknown as Team;
        membership = { ...targetMembership, team: teamData };
      }
    }
  }

  // Pas d'équipe = afficher prompt de création
  if (!membership || !team) {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("company_name, company_address, company_phone, company_email, company_ninea, full_name, email")
      .eq("id", user.id)
      .single();

    return <CreateTeamPrompt profileData={profile as ProfileData | null} />;
  }

  const userRole = membership.role as TeamRole;

  // Récupérer les membres
  const { data: rawMembers } = await supabaseAdmin
    .from("team_members")
    .select("*")
    .eq("team_id", membership.team_id)
    .eq("status", "active")
    .order("role", { ascending: true })
    .order("joined_at", { ascending: true });

  const members: TeamMember[] = [];

  if (rawMembers && rawMembers.length > 0) {
    const userIds = rawMembers.map((m) => m.user_id);
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name, phone")
      .in("id", userIds);

    members.push(
      ...rawMembers.map((m) => {
        const profile = profiles?.find((p) => p.id === m.user_id);
        return {
          ...m,
          user: profile || { id: m.user_id, email: "Inconnu", full_name: "Utilisateur inconnu", phone: null },
        } as unknown as TeamMember;
      })
    );
  }

  // Récupérer les invitations en attente
  const { data: rawInvitations } = await supabaseAdmin
    .from("team_invitations")
    .select("*")
    .eq("team_id", membership.team_id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  // Récupérer les emails des membres actifs pour filtrer les invitations obsolètes
  const memberEmails = new Set(
    members
      .map((m) => (m.user as { email?: string })?.email?.toLowerCase())
      .filter(Boolean)
  );

  // Filtrer les invitations dont l'utilisateur est déjà membre actif
  const invitations = (rawInvitations || []).filter(
    (inv) => !memberEmails.has(inv.email.toLowerCase())
  );

  // Récupérer les stats
  const statsResult = await getTeamStats(membership.team_id);
  const stats = statsResult.success ? statsResult.stats : undefined;

  return (
    <TeamPageClient
      team={team}
      members={members}
      invitations={invitations}
      stats={stats}
      currentUserId={user.id}
      currentUserRole={userRole}
    />
  );
}
