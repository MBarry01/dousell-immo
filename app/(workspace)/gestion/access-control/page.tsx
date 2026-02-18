import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getUserTeamContext } from "@/lib/team-context";
import { hasTeamPermission } from "@/lib/permissions";
import { AccessControlDashboard } from "./components/AccessControlDashboard";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Contrôle d'Accès | Dousell",
  description: "Gérer les demandes d'accès temporaire et les permissions",
};

export default async function AccessControlPage() {
  // Vérifier que l'utilisateur a les permissions
  const context = await getUserTeamContext();

  if (!context) {
    redirect("/login");
  }

  const canManageAccess = await hasTeamPermission("team.members.edit_role");

  if (!canManageAccess) {
    redirect("/gestion");
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Contrôle d&apos;Accès Temporaire
        </h1>
        <p className="text-zinc-400">
          Gérez les demandes d&apos;accès et les permissions temporaires de votre équipe
        </p>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <AccessControlDashboard teamId={context.teamId} />
      </Suspense>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full bg-zinc-800" />
      <Skeleton className="h-64 w-full bg-zinc-800" />
      <Skeleton className="h-64 w-full bg-zinc-800" />
    </div>
  );
}
