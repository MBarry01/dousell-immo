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
export function JsonLd({ property, baseUrl = "https://www.dousel.com" }: JsonLdProps) {
  const propertyUrl = `${baseUrl}/biens/${property.id}`;

  // Utiliser toutes les images disponibles
  const images = property.images && property.images.length > 0
    ? property.images
    : ["https://www.dousel.com/monument.png"];

  // Tronquer la description à 160 caractères pour le SEO
  const truncatedDescription = property.description
    ? property.description.length > 160
      ? property.description.substring(0, 157) + "..."
      : property.description
    : "";

  // Récupérer le district depuis location
  const district = (property.location as { district?: string }).district ||
    property.location.landmark ||
    property.location.city;

  // Temps de reformatage de la date (datePosted)
  const datePosted = property.created_by ? new Date().toISOString().split('T')[0] : (property as any).created_at ? new Date((property as any).created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

  // Construire le schéma JSON-LD selon les spécifications diaspora/pro
  const jsonLd: any = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "name": property.title,
    "description": truncatedDescription,
    "image": images,
    "url": propertyUrl,
    "datePosted": datePosted,
    "offers": {
      "@type": "Offer",
      "price": property.price,
      "priceCurrency": "XOF",
      "availability": "https://schema.org/InStock",
      "url": propertyUrl
    },
    "address": {
      "@type": "PostalAddress",
      "addressLocality": district,
      "addressRegion": property.location.city,
      "addressCountry": "SN"
    }
  };

  // Ajout des données géographiques précises
  if (property.location.coords && property.location.coords.lat) {
    jsonLd.geo = {
      "@type": "GeoCoordinates",
      "latitude": property.location.coords.lat,
      "longitude": property.location.coords.lng
    };
  }

  // Ajout des caractéristiques techniques (Rich Results)
  if (property.specs) {
    if (property.specs.rooms) {
      jsonLd.numberOfRooms = property.specs.rooms;
    }
    if (property.specs.surface) {
      jsonLd.floorSize = {
        "@type": "QuantitativeValue",
        "value": property.specs.surface,
        "unitCode": "MTK" // Square meters
      };
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

