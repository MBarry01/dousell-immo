import { Suspense } from "react";
import { HeroSection } from "@/components/sections/hero";
import { PropertySection } from "@/components/sections/property-section";
import { QuickSearch } from "@/components/search/quick-search";
import { HomeSEOContent } from "@/components/sections/home-seo-content";
import { getHomePageSections } from "@/services/homeService.cached";
import { VerificationSuccessToast } from "@/components/auth/verification-success-toast";
import { LandingPageJsonLd, LocalBusinessJsonLd } from "@/components/seo/json-ld";

// ISR: Régénère la page toutes les heures (3600 secondes)
// Cela améliore drastiquement les performances (TTFB < 500ms) et réduit la charge sur Supabase
export const revalidate = 3600;

import { createClient } from "@/utils/supabase/server";


export default async function Home() {
  const supabase = await createClient();

  // Mode ISR activé : aucun appel dépendant du contexte utilisateur (cookies/session)
  // pour garantir que la page d'accueil est pré-rendue statiquement au build/revalidation
  const sectionsResult = await getHomePageSections();
  const { locations, ventes, terrains } = sectionsResult;

  return (
    <div className="space-y-6">
      <LandingPageJsonLd />
      <LocalBusinessJsonLd />

      {/* Toast de succès après vérification d'email */}
      <Suspense fallback={null}>
        <VerificationSuccessToast />
      </Suspense>

      {/* Hero Section */}
      <HeroSection />

      {/* Quick Search */}
      <QuickSearch />

      {/* Sections de propriétés style Netflix/Airbnb */}
      <div className="space-y-12 pb-4 pt-8">
        {/* Section 1: Locations populaires */}
        {locations.properties.length > 0 && (
          <PropertySection
            title="Locations populaires · Dakar"
            subtitle={`${locations.total} biens disponibles`}
            properties={locations.properties}
            href="/recherche?category=location&city=Dakar"
            limit={8}
          />
        )}

        {/* Section 2: Ventes (Villas & Studios) */}
        {ventes.properties.length > 0 && (
          <PropertySection
            title="Devenez propriétaire · Villas & Studios"
            subtitle={`${ventes.total} biens à vendre`}
            properties={ventes.properties}
            href="/recherche?category=vente"
          />
        )}

        {/* Section 3: Terrains */}
        {terrains.properties.length > 0 && (
          <PropertySection
            title="Terrains à vendre · Investissement"
            subtitle={`${terrains.total} terrains disponibles`}
            properties={terrains.properties}
            href="/recherche?category=vente&type=terrain"
          />
        )}

        {/* Message si aucune section n'a de résultats */}
        {locations.properties.length === 0 &&
          ventes.properties.length === 0 &&
          terrains.properties.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-lg text-white/70">
                Aucun bien disponible pour le moment.
              </p>
              <p className="mt-2 text-sm text-white/50">
                Revenez bientôt pour découvrir nos nouvelles offres.
              </p>
            </div>
          )}
      </div>

      {/* Section SEO Optimisée (Bas de page) */}
      <HomeSEOContent />
    </div>
  );
}
