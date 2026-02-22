// app/(workspace)/gestion/layout.tsx
import { getUserTeamContext } from "@/lib/team-permissions.server";
import { getActivationData } from "@/lib/activation/get-activation-stage";
import { ActivationBanner } from "@/components/activation/ActivationBanner";

export default async function GestionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const teamContext = await getUserTeamContext();

  // No team = onboarding not started yet, skip banner
  if (!teamContext) {
    return <>{children}</>;
  }

  const activation = await getActivationData(teamContext.team_id);

  return (
    <>
      <ActivationBanner
        stage={activation.stage}
        completedAt={activation.completedAt}
        teamId={teamContext.team_id}
        firstPropertyId={activation.firstPropertyId}
      />
      {children}
    </>
  );
}
