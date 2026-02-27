import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import { PropertyDetailView } from "@/components/property/property-detail-view";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getPropertyById,
  getSimilarProperties,
  getApprovedPropertyIds,
} from "@/services/propertyService.cached";
import { slugify } from "@/lib/slugs";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import {
  getPropertyReviews,
  getPropertyReviewStats,
} from "@/services/reviewService";
import { createClient } from "@/utils/supabase/server";

// Revalidation toutes les heures (3600 secondes) pour mettre à jour les données périodiquement
export const revalidate = 3600;
// Force dynamic to avoid build-time errors if env vars are missing
export const dynamic = 'force-dynamic';

// Regular expression for UUID validation
const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

type PropertyPageProps = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * Génère les paramètres statiques pour les 20 biens approuvés les plus récents
 * Cela permet de pré-générer ces pages en HTML statique au build time (ultra-rapide)
 */
export async function generateStaticParams() {
  try {
    const approvedIds = await getApprovedPropertyIds(20);
    return approvedIds.map((id) => ({
      id,
    }));
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}

export async function generateMetadata({
  params,
}: PropertyPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  // Validation UUID pour éviter l'erreur Postgres 22P02
  if (!UUID_REGEX.test(id)) {
    return {
      title: "Identifiant invalide",
      description: "L'identifiant du bien est incorrect.",
    };
  }

  const property = await getPropertyById(id);
  if (!property) {
    return {
      title: "Bien introuvable",
      description: "Ce bien n'existe pas ou n'est plus disponible.",
    };
  }

  const formattedPrice = new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(property.price);

  // Formatage du prix pour le CTR (ex: 120M XOF)
  const priceInMillions = property.price >= 1000000
    ? (property.price / 1000000).toFixed(0) + "M"
    : formattedPrice;

  const transactionLabel = property.transaction === "vente" ? "à vendre" : "à louer";
  const city = property.location.city;
  const type = property.details.type || "Bien";

  // Titre: "Appartement F3 à vendre Dakar – 120M XOF" (Cible < 60 chars)
  let title = `${type} ${transactionLabel} ${city} – ${priceInMillions} XOF`;
  if (title.length > 60) {
    title = `${type} ${transactionLabel} ${city} – ${priceInMillions}`;
  }

  // Description optimisée (< 155 chars)
  const district = (property.location as any).district || property.location.landmark || "";
  const surface = property.specs.surface ? `${property.specs.surface}m²` : "";
  const description = `${type} ${surface} à ${district ? district + ", " : ""}${city}. ${property.description.substring(0, 100)}... Consultez les photos et détails sur Dousel.`;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.dousel.com";
  const propertyUrl = `${baseUrl}/biens/${property.id}`;

  return {
    title,
    description,
    alternates: {
      canonical: propertyUrl,
    },
    openGraph: {
      title: property.title,
      description: `${property.specs.rooms} pièces - ${property.specs.surface} m² - ${property.location.city}`,
      images: property.images?.[0] ? [property.images[0]] : [],
      url: propertyUrl,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: property.title,
      description: `${property.specs.rooms} pièces - ${property.specs.surface} m² - ${property.location.city}`,
      images: property.images?.[0] ? [property.images[0]] : [],
    },
  };
}

export default async function PropertyPage({ params }: PropertyPageProps) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  // Validation UUID pour éviter l'erreur Postgres 22P02
  if (!UUID_REGEX.test(id)) notFound();

  const property = await getPropertyById(id);
  if (!property) notFound();

  // Récupérer l'utilisateur courant pour afficher ses réactions
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Récupérer les avis en parallèle avec les propriétés similaires
  const [similar, reviews, reviewStats] = await Promise.all([
    getSimilarProperties(
      property.transaction,
      property.location.city,
      4,
      property.id
    ),
    getPropertyReviews(property.id, user?.id),
    getPropertyReviewStats(property.id),
  ]);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.dousel.com";
  const shareUrl = `${baseUrl}/biens/${property.id}`;

  const breadcrumbItems = [
    { name: "Accueil", url: baseUrl },
    { name: "Biens", url: `${baseUrl}/biens` },
    { name: property.title, url: shareUrl }
  ];

  return (
    <>
      <JsonLd property={property} baseUrl={baseUrl} />
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <PropertyDetailView
        property={property}
        similar={similar}
        shareUrl={shareUrl}
        reviews={reviews}
        reviewStats={reviewStats}
      />

      {/* Maillage Interne SEO Géo */}
      <section className="container mx-auto px-4 py-12 border-t border-white/5 mt-8">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-xl font-semibold mb-6 text-white/90">Explorer l'immobilier au Sénégal</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href={`/immobilier/${slugify(property.location.city)}`}
              className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#F4C430]/30 hover:bg-white/10 transition-all group"
            >
              <p className="text-sm text-white/50 mb-1">Voir tout l'immobilier à</p>
              <p className="font-medium text-[#F4C430] group-hover:underline">{property.location.city} →</p>
            </Link>
            {property.details.type && (
              <Link
                href={`/immobilier/${slugify(property.location.city)}/${slugify(property.details.type)}`}
                className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#F4C430]/30 hover:bg-white/10 transition-all group"
              >
                <p className="text-sm text-white/50 mb-1">Trouver un {property.details.type} à</p>
                <p className="font-medium text-[#F4C430] group-hover:underline">{property.location.city} →</p>
              </Link>
            )}
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/pro/blog/immobilier-senegal-diaspora"
              className="inline-flex items-center text-sm text-white/40 hover:text-[#F4C430] transition-colors"
            >
              Guide : Investir au Sénégal depuis l'étranger
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}