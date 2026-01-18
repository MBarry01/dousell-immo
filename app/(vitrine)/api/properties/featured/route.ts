import { NextResponse } from "next/server";
import { getFeaturedProperties, getLatestProperties } from "@/services/propertyService.cached";

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

    // Essayer d'abord les biens en vedette
    let properties = await getFeaturedProperties(limit);

    // Si pas assez de biens vedettes, compléter avec les plus récents
    if (properties.length < limit) {
      const latestProperties = await getLatestProperties(limit - properties.length);
      const featuredIds = new Set(properties.map((p) => p.id));
      const additionalProperties = latestProperties.filter((p) => !featuredIds.has(p.id));
      properties = [...properties, ...additionalProperties].slice(0, limit);
    }

    // Mapper les propriétés pour le frontend
    const mappedProperties = properties.map(mapPropertyForFrontend);

    return NextResponse.json({ properties: mappedProperties });
  } catch (error) {
    console.error("Error fetching featured properties:", error);
    return NextResponse.json({ properties: [], error: "Erreur lors du chargement" }, { status: 500 });
  }
}
