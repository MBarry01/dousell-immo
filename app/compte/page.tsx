import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { OwnerDashboard } from "./components/OwnerDashboard";
import { getUserDashboardInfo } from "@/services/rentalService.cached";

export default async function ComptePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Récupérer les infos du dashboard avec cache
  const dashboardInfo = await getUserDashboardInfo(user.id, user.email!);

  // Afficher le dashboard - Plus de redirection automatique
  // Le dashboard s'adapte selon le rôle (isOwner, isTenant, gestionLocativeEnabled)
  return (
    <OwnerDashboard
      isTenant={dashboardInfo.isTenant}
      isOwner={dashboardInfo.isOwner}
      gestionLocativeEnabled={dashboardInfo.gestionLocativeEnabled}
      gestionLocativeStatus={dashboardInfo.gestionLocativeStatus}
    />
  );
}

