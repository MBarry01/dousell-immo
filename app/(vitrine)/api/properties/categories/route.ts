

import { NextResponse } from "next/server";
import { getPropertiesCount, getProperties, type PropertyFilters } from "@/services/propertyService";
import { getExternalListingsCount } from "@/services/gatewayService";

export const dynamic = "force-dynamic";

type CategoryStats = {
  id: string;
  name: string;
  count: number;
  image: string | null;
  searchType: string;
};

// Configuration des catégories avec les filtres correspondants pour le service
const CATEGORY_CONFIG: Record<string, {
  name: string;
  searchType: string; // Pour l'URL
  filters: PropertyFilters; // Pour la requête DB
}> = {
  villas: {
    name: "Villas de Luxe",
    searchType: "Villa",
    filters: { types: ["Villa", "Maison"] }
  },
  appartements: {
    name: "Appartements",
    searchType: "Appartement",
    filters: { types: ["Appartement", "Immeuble", "Studio", "Duplex"] }
  },
  terrains: {
    name: "Terrains",
    searchType: "Terrain",
    filters: { type: "Terrain" }
  },
  commercial: {
    name: "Immeubles & Commerce",
    searchType: "Commercial",
    filters: { types: ["Immeuble", "Bureau", "Commerce", "Local", "Entrepôt", "Autre"] }
  },
};

export async function GET() {
  try {
    const categories: CategoryStats[] = await Promise.all(
      Object.entries(CATEGORY_CONFIG).map(async ([id, config]) => {
        // 1. Récupérer le compte total (Interne + Externe)
        const [internalCount, externalCount] = await Promise.all([
          getPropertiesCount(config.filters),
          getExternalListingsCount("any", { category: config.searchType })
        ]);

        const count = internalCount + externalCount;

        // 2. Récupérer une image représentative (le bien le plus récent ayant une image)
        // On demande un peu plus (5) au cas où les premiers n'aient pas d'images valide
        const recentProps = await getProperties({ ...config.filters, limit: 5 });
        const image = recentProps.find(p => p.images && p.images.length > 0)?.images[0] || null;

        return {
          id,
          name: config.name,
          count,
          image,
          searchType: config.searchType,
        };
      })
    );

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Error in categories API:", error);
    return NextResponse.json(
      { categories: [], error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
