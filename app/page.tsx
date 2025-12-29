import { Suspense } from "react";
import { HeroSection } from "@/components/sections/hero";
import { PropertySection } from "@/components/sections/property-section";
import { QuickSearch } from "@/components/search/quick-search";
import { getHomePageSections } from "@/services/homeService";
import { VerificationSuccessToast } from "@/components/auth/verification-success-toast";

// Cache la page d'accueil pendant 1 heure (3600 secondes)
// Cela améliore les performances et réduit la charge sur Supabase
export const revalidate = 3600;
// Force dynamic to avoid build-time errors if env vars are missing
export const dynamic = 'force-dynamic';

export default async function Home() {
  // Récupération optimisée des 3 sections de la home page
  // Toutes les propriétés sont automatiquement filtrées pour être :
  // - Approuvées (validation_status = 'approved')
  // - Disponibles (status = 'disponible')
  const { locations, ventes, terrains } = await getHomePageSections();

  return (
    <div className="space-y-6">
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
        {locations.length > 0 && (
          <PropertySection
            title="Locations populaires · Dakar"
            subtitle={`${locations.length} biens disponibles`}
            properties={locations}
            href="/recherche?category=location&city=Dakar"
            limit={8}
          />
        )}

        {/* Section 2: Ventes (Villas & Studios) */}
        {ventes.length > 0 && (
          <PropertySection
            title="Devenez propriétaire · Villas & Studios"
            subtitle={`${ventes.length} biens à vendre`}
            properties={ventes}
            href="/recherche?category=vente"
          />
        )}

        {/* Section 3: Terrains */}
        {terrains.length > 0 && (
          <PropertySection
            title="Terrains à vendre · Investissement"
            subtitle={`${terrains.length} terrains disponibles`}
            properties={terrains}
            href="/recherche?category=vente&type=terrain"
          />
        )}

        {/* Message si aucune section n'a de résultats */}
        {locations.length === 0 && ventes.length === 0 && terrains.length === 0 && (
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
    </div>
  );
}
