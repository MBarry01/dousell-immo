import { createClient } from "@/utils/supabase/server";
import { Suspense } from "react";
import DouselNavbarClient, { DouselNavbarClientProps } from "./DouselNavbarClient";

interface DouselNavbarProps {
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
export default async function DouselNavbar({ ctaOverride }: DouselNavbarProps) {
  const supabase = await createClient();

  // Vérification rapide de la session (très léger)
  const { data: { user } } = await supabase.auth.getUser();

  const isLoggedIn = !!user;

  return (
    <Suspense>
      <DouselNavbarClient
        isLoggedIn={isLoggedIn}
        ctaOverride={ctaOverride}
      />
    </Suspense>
  );
}

