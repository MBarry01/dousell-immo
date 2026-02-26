import { redirect } from "next/navigation";
import { getUserTeamContext } from "@/lib/team-context";
import { getTeamProperties } from "./actions";
import { BiensClient } from "./biens-client";
import Link from "next/link";
import { Settings, Building2, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Biens | Gestion Locative - Dousel",
  description: "Gérez les biens immobiliers de votre équipe",
};

export default async function BiensPage() {
  const teamContext = await getUserTeamContext();

  // Si pas d'équipe, afficher un message convivial pour configurer l'agence
  if (!teamContext) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-zinc-900 border border-white/10 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
          {/* Icon */}
          <div className="mx-auto w-16 h-16 bg-[#F4C430]/10 rounded-2xl flex items-center justify-center border border-[#F4C430]/20">
            <Building2 className="w-8 h-8 text-[#F4C430]" />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Configuration requise</h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Avant de gérer vos biens, veuillez configurer les informations de votre agence.
              Cela nous permettra de personnaliser vos documents officiels.
            </p>
          </div>

          {/* CTA Button */}
          <Link
            href="/gestion/config"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#F4C430] hover:bg-[#F4C430]/90 text-black font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(244,196,48,0.2)] hover:shadow-[0_0_30px_rgba(244,196,48,0.4)]"
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
