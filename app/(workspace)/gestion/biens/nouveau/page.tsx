import { redirect } from "next/navigation";
import { getUserTeamContext, hasTeamPermission } from "@/lib/team-permissions";
import { NouveauBienClient } from "./nouveau-client";

export const metadata = {
  title: "Ajouter un bien | Gestion - Dousell Immo",
  description: "Créer une nouvelle annonce immobilière pour votre équipe",
};

export default async function NouveauBienPage() {
  const teamContext = await getUserTeamContext();

  if (!teamContext) {
    redirect("/compte?message=no_team");
  }

  const canCreate = await hasTeamPermission(teamContext.team_id, "properties.create");
  if (!canCreate) {
    redirect("/gestion/biens?error=permission_denied");
  }

  return (
    <NouveauBienClient
      teamId={teamContext.team_id}
      teamName={teamContext.team_name}
    />
  );
}
