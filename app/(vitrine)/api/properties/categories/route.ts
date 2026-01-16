import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

type CategoryStats = {
  id: string;
  name: string;
  count: number;
  image: string | null;
  searchType: string; // Type à utiliser dans l'URL de recherche
};

// Types en minuscules comme stockés en DB (via le formulaire de dépôt)
// Note: immeuble est groupé avec appartements pour la UI
// searchType: le premier type DB (minuscule) à utiliser pour la recherche
const CATEGORY_MAPPING: Record<string, { dbTypes: string[]; name: string; searchType: string }> = {
  villas: { dbTypes: ["villa", "Villa", "Maison", "maison"], name: "Villas de Luxe", searchType: "villa" },
  appartements: { dbTypes: ["appartement", "Appartement", "immeuble", "Immeuble"], name: "Appartements", searchType: "appartement" },
  terrains: { dbTypes: ["terrain", "Terrain"], name: "Terrains", searchType: "terrain" },
  studios: { dbTypes: ["studio", "Studio"], name: "Studios", searchType: "studio" },
};

export async function GET() {
  try {
    const supabase = await createClient();

    // Récupérer tous les biens (disponibles ou approuvés) avec leur type et images
    const { data: properties, error } = await supabase
      .from("properties")
      .select("id, details, images, status, validation_status")
      .or("status.eq.disponible,validation_status.eq.approved");

    if (error) {
      console.error("Error fetching properties for categories:", error);
      return NextResponse.json(
        { categories: [], error: "Erreur lors du chargement" },
        { status: 500 }
      );
    }

    // Calculer les stats et trouver une image représentative pour chaque catégorie
    const categories: CategoryStats[] = Object.entries(CATEGORY_MAPPING).map(
      ([id, { dbTypes, name, searchType }]) => {
        const categoryProperties = (properties || []).filter((p) => {
          const propertyType = p.details?.type;
          return dbTypes.includes(propertyType);
        });

        // Trouver la première image disponible pour cette catégorie
        let image: string | null = null;
        for (const prop of categoryProperties) {
          if (prop.images && prop.images.length > 0 && prop.images[0]) {
            image = prop.images[0];
            break;
          }
        }

        return {
          id,
          name,
          count: categoryProperties.length,
          image,
          searchType,
        };
      }
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
