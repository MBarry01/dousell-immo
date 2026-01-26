import { redirect } from "next/navigation";
import { getUserTeamContext } from "@/lib/team-permissions";
import { getTeamProperties } from "./actions";
import { BiensClient } from "./biens-client";
import Link from "next/link";
import { Settings, Building2, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Biens | Gestion Locative - Dousell Immo",
  description: "Gérez les biens immobiliers de votre équipe",
};

export default async function BiensPage() {
  const teamContext = await getUserTeamContext();

  // Si pas d'équipe, afficher un message convivial pour configurer l'agence
  if (!teamContext) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center space-y-6">
          {/* Icon */}
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
            <Building2 className="w-8 h-8 text-white" />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Configuration requise</h2>
            <p className="text-zinc-400 text-sm">
              Avant de gérer vos biens, veuillez configurer les informations de votre agence.
              Cela nous permettra de personnaliser vos documents officiels.
            </p>
          </div>

          {/* CTA Button */}
          <Link
            href="/gestion/config"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl transition-all"
          >
            <Settings className="w-5 h-5" />
            Configurer mon agence
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const { properties, error } = await getTeamProperties(teamContext.team_id);

  return (
    <BiensClient
      teamId={teamContext.team_id}
      teamName={teamContext.team_name}
      userRole={teamContext.user_role}
      initialProperties={properties}
      error={error}
    />
  );
}
