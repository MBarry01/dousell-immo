import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { TeamHeader } from "./components/TeamHeader";
import { MembersList } from "./components/MembersList";
import { CreateTeamPrompt } from "./components/CreateTeamPrompt";
import { getTeamStats } from "./actions";
import type { Team, TeamMember, TeamRole } from "@/types/team";

export const metadata = {
  title: "Équipe | Gestion Locative - Dousell Immo",
  description: "Gérez votre équipe et collaborateurs",
};

// Type pour les données du profil
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  // Récupérer le membership de l'utilisateur
  const { data: membership, error: membershipError } = await supabase
    .from("team_members")
    .select(
      `
      team_id,
      role,
      team:teams(*)
    `
    )
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  // Pas d'équipe = récupérer profil et afficher prompt de création
  if (!membership?.team || membershipError) {
    // Récupérer les données du profil pour pré-remplir
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_name, company_address, company_phone, company_email, company_ninea, full_name, email")
      .eq("id", user.id)
      .single();

    return <CreateTeamPrompt profileData={profile as ProfileData | null} />;
  }

  const team = membership.team as unknown as Team;
  const userRole = membership.role as TeamRole;

  // Récupérer les membres de l'équipe
  const { data: members } = await supabase
    .from("team_members")
    .select(
      `
      *,
      user:profiles(id, email, full_name, phone)
    `
    )
    .eq("team_id", membership.team_id)
    .eq("status", "active")
    .order("role", { ascending: true })
    .order("joined_at", { ascending: true });

  // Récupérer les stats
  const statsResult = await getTeamStats(membership.team_id);
  const stats = statsResult.success ? statsResult.stats : undefined;

  return (
    <div className="space-y-6">
      <TeamHeader team={team} userRole={userRole} stats={stats} />

      <MembersList
        members={(members as TeamMember[]) || []}
        teamId={membership.team_id}
        currentUserRole={userRole}
        currentUserId={user.id}
      />
    </div>
  );
}
