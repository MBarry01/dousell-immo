import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ExternalPropertyTeaser } from "@/components/property/external-property-teaser";
import { getExternalListingById, getSimilarListings } from "@/services/gatewayService";

// Les données externes changent fréquemment (TTL scraping)
export const dynamic = "force-dynamic";

type ExternalPropertyPageProps = {
    params: Promise<{
        id: string;
    }>;
};

export async function generateMetadata({
    params,
}: ExternalPropertyPageProps): Promise<Metadata> {
    const resolvedParams = await params;
    const property = await getExternalListingById(resolvedParams.id);

    if (!property) {
        return {
            title: "Annonce introuvable",
            description: "Cette annonce partenaire n'existe pas ou n'est plus disponible.",
        };
    }

    const formattedPrice = new Intl.NumberFormat("fr-FR", {
        maximumFractionDigits: 0,
    }).format(property.price);

    const title = `${property.title} - ${formattedPrice} FCFA | Dousell Immo`;
    const description = `${property.details.type} à ${property.transaction === "location" ? "louer" : "vendre"} à ${property.location.city} - ${formattedPrice} FCFA${property.transaction === "location" ? "/mois" : ""} | Annonce partenaire via ${property.source_site || "nos partenaires"}`;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dousell-immo.app";

    return {
        title,
        description,
        openGraph: {
            title: property.title,
            description,
            images: property.images?.[0] ? [property.images[0]] : [],
            url: `${baseUrl}/biens/ext/${resolvedParams.id}`,
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title: property.title,
            description,
            images: property.images?.[0] ? [property.images[0]] : [],
        },
    };
}

export default async function ExternalPropertyPage({
    params,
}: ExternalPropertyPageProps) {
    const resolvedParams = await params;
    const property = await getExternalListingById(resolvedParams.id);

    if (!property) notFound();

    // Récupérer les biens similaires (internes + externes)
    const similar = await getSimilarListings({
        transactionType: property.transaction,
        city: property.location.city,
        propertyType: property.details.type,
        excludeIds: [property.id],
        limit: 4,
    });

    return (
        <ExternalPropertyTeaser
            property={property}
            similar={similar}
        />
    );
}
