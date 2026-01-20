import { NextResponse } from "next/server";
import { getFeaturedProperties, getLatestProperties } from "@/services/propertyService.cached";
import { getExternalListingsByType } from "@/services/gatewayService";

export const dynamic = "force-dynamic";

// Mapper les données DB vers le format frontend attendu
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPropertyForFrontend(property: any) {
  return {
    ...property,
    // Mapper 'category' (DB) vers 'transaction' (frontend)
    transaction: property.category || "location",
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "3", 10);

    // Essayer d'abord les biens en vedette (Interne)
    let properties = await getFeaturedProperties(limit);

    // Si pas assez de biens vedettes, compléter avec les plus récents (Interne)
    if (properties.length < limit) {
      const remaining = limit - properties.length;
      const latestProperties = await getLatestProperties(remaining);
      const featuredIds = new Set(properties.map((p) => p.id));
      const additionalProperties = latestProperties.filter((p) => !featuredIds.has(p.id));
      properties = [...properties, ...additionalProperties];
    }

    // 3. Si TOUJOURS pas assez, compléter avec les partenaires (Externe)
    if (properties.length < limit) {
      const remaining = limit - properties.length;
      console.log(`[FeaturedAPI] Filling gap with ${remaining} external listings`);

      // On récupère un mix de locations et ventes
      // On demande un peu plus pour avoir du choix après filtre
      const [externalRentals, externalSales] = await Promise.all([
        getExternalListingsByType("location", { limit: remaining + 2 }),
        getExternalListingsByType("vente", { limit: remaining + 2 })
      ]);

      const allExternals = [...externalRentals, ...externalSales]
        // Mélanger un peu pour ne pas avoir que des locations
        .sort(() => Math.random() - 0.5);

      const featuredIds = new Set(properties.map((p) => p.id));
      const uniqueExternals = allExternals.filter((p) => !featuredIds.has(p.id));

      properties = [...properties, ...uniqueExternals].slice(0, limit);
    }

    // Mapper les propriétés pour le frontend
    const mappedProperties = properties.map(mapPropertyForFrontend);

    return NextResponse.json({ properties: mappedProperties });
  } catch (error) {
    console.error("Error fetching featured properties:", error);
    return NextResponse.json({ properties: [], error: "Erreur lors du chargement" }, { status: 500 });
  }
}
