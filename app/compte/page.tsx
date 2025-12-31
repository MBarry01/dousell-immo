import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { OwnerDashboard } from "./components/OwnerDashboard";

export default async function ComptePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 1. Vérifier si c'est un locataire (Bail actif)
  const { data: lease } = await supabase
    .from('leases')
    .select('id')
    .eq('tenant_email', user.email!)
    .eq('status', 'active')
    .maybeSingle();

  const isTenant = !!lease;

  // 2. Vérifier si c'est un propriétaire (A des biens)
  const { count: propertyCount } = await supabase
    .from('properties')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', user.id);

  const isOwner = (propertyCount || 0) > 0;

  // 3. Vérifier le statut d'activation Gestion Locative
  const { data: profile } = await supabase
    .from('profiles')
    .select('gestion_locative_status, gestion_locative_enabled')
    .eq('id', user.id)
    .single();

  const gestionLocativeEnabled = profile?.gestion_locative_enabled || false;
  const gestionLocativeStatus = profile?.gestion_locative_status || 'inactive';

  // 4. Afficher le dashboard - Plus de redirection automatique
  // Le dashboard s'adapte selon le rôle (isOwner, isTenant, gestionLocativeEnabled)
  return (
    <OwnerDashboard
      isTenant={isTenant}
      isOwner={isOwner}
      gestionLocativeEnabled={gestionLocativeEnabled}
      gestionLocativeStatus={gestionLocativeStatus}
    />
  );
}

