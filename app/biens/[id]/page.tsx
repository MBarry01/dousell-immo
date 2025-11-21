import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PropertyDetailView } from "@/components/property/property-detail-view";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getPropertyById,
  getSimilarProperties,
  getApprovedPropertyIds,
} from "@/services/propertyService";
import {
  getPropertyReviews,
  getPropertyReviewStats,
} from "@/services/reviewService";
import { createClient } from "@/utils/supabase/server";

// Revalidation toutes les heures (3600 secondes) pour mettre à jour les données périodiquement
export const revalidate = 3600;

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
  const property = await getPropertyById(resolvedParams.id);
  if (!property) {
    return {
      title: "Bien introuvable",
      description: "Ce bien n'existe pas ou n'est plus disponible.",
    };
  }

  // Formater le titre selon le format demandé : "[Type] à [Quartier] - [Prix] | Doussel Immo"
  const propertyType = property.details.type || "Bien";
  const district = (property.location as { district?: string }).district || 
                   property.location.landmark || 
                   property.location.city;
  const formattedPrice = new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(property.price);
  
  const title = `${propertyType} à ${district} - ${formattedPrice} FCFA | Doussel Immo`;

  // Description optimisée pour le SEO
  const description = property.description.length > 160
    ? property.description.substring(0, 157) + "..."
    : property.description;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://doussel-immo.app";
  const propertyUrl = `${baseUrl}/biens/${property.id}`;

  return {
    title,
    description,
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
  const property = await getPropertyById(resolvedParams.id);
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
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://doussel-immo.app";
  const shareUrl = `${baseUrl}/biens/${property.id}`;

  return (
    <>
      <JsonLd property={property} baseUrl={baseUrl} />
      <PropertyDetailView
        property={property}
        similar={similar}
        shareUrl={shareUrl}
        reviews={reviews}
        reviewStats={reviewStats}
      />
    </>
  );
}