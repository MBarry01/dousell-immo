import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TeamSettingsForm } from "./TeamSettingsForm";
import type { Team, TeamRole } from "@/types/team";

export const metadata = {
  title: "Paramètres | Équipe - Dousel",
  description: "Configurez les paramètres de votre équipe",
};

export default async function TeamSettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  // Récupérer le membership avec les infos de l'équipe
  const { data: membership } = await supabase
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

  if (!membership?.team) redirect("/gestion/equipe");

  const team = membership.team as unknown as Team;
  const userRole = membership.role as TeamRole;

  // Seul le owner peut accéder aux paramètres
  if (userRole !== "owner") {
    redirect("/gestion/equipe");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/gestion/equipe">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Paramètres de l&apos;équipe</h1>
          <p className="text-sm text-muted-foreground">
            Modifiez les informations de votre équipe
          </p>
        </div>
      </div>

      {/* Formulaire */}
      <TeamSettingsForm team={team} />
    </div>
  );
}
