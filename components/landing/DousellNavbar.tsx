import { createClient } from "@/utils/supabase/server";
import DousellNavbarClient, { DousellNavbarClientProps } from "./DousellNavbarClient";

interface DousellNavbarProps {
  ctaOverride?: {
    text: string;
    href: string;
  };
}

/**
 * Smart Header - Server Component Wrapper
 * 
 * Vérifie la session utilisateur côté serveur et adapte le CTA:
 * - Visiteur mode owner: "Essai Gratuit" → /register
 * - Visiteur mode tenant: "Voir les annonces" → / (détecté côté client via URL)
 * - Utilisateur connecté: "Mon Espace" → /gestion
 */
export default async function DousellNavbar({ ctaOverride }: DousellNavbarProps) {
  const supabase = await createClient();

  // Vérification rapide de la session (très léger)
  const { data: { user } } = await supabase.auth.getUser();

  const isLoggedIn = !!user;

  return (
    <DousellNavbarClient
      isLoggedIn={isLoggedIn}
      ctaOverride={ctaOverride}
    />
  );
}

