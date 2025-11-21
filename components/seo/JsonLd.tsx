import type { Property } from "@/types/property";

type JsonLdProps = {
  property: Property;
  baseUrl?: string;
};

/**
 * Composant pour générer les données structurées Schema.org (JSON-LD)
 * pour les pages de détail des biens immobiliers.
 * 
 * Utilise le schéma RealEstateListing pour obtenir des Rich Snippets Google.
 */
export function JsonLd({ property, baseUrl = "https://dousell-immo.app" }: JsonLdProps) {
  const propertyUrl = `${baseUrl}/biens/${property.id}`;
  const firstImage = property.images?.[0] || "";

  // Tronquer la description à 160 caractères pour le SEO
  const truncatedDescription = property.description
    ? property.description.length > 160
      ? property.description.substring(0, 157) + "..."
      : property.description
    : "";

  // Récupérer le district depuis location (peut être dans district ou landmark)
  const district = (property.location as { district?: string }).district || 
                   property.location.landmark || 
                   property.location.city;

  // Construire le schéma JSON-LD selon les spécifications
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    description: truncatedDescription,
    image: firstImage,
    url: propertyUrl,
    offers: {
      price: property.price,
      priceCurrency: "XOF",
    },
    address: {
      addressLocality: district,
      addressRegion: "Dakar",
      addressCountry: "SN",
    },
  };

  // Nettoyer les propriétés undefined pour un JSON propre
  const cleanJsonLd = JSON.parse(JSON.stringify(jsonLd));

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(cleanJsonLd, null, 0) }}
    />
  );
}

