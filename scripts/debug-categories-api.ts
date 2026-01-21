import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const CATEGORY_MAPPING: Record<string, { dbTypes: string[]; name: string; searchType: string }> = {
  villas: { dbTypes: ["villa", "Villa", "Maison", "maison"], name: "Villas de Luxe", searchType: "villa" },
  appartements: { dbTypes: ["appartement", "Appartement", "immeuble", "Immeuble"], name: "Appartements", searchType: "appartement" },
  terrains: { dbTypes: ["terrain", "Terrain"], name: "Terrains", searchType: "terrain" },
  studios: { dbTypes: ["studio", "Studio"], name: "Studios", searchType: "studio" },
};

async function testCategoriesAPI() {
  console.log("=== TEST CATEGORIES API (LOGIQUE CORRIGÉE) ===\n");

  const { data: properties, error } = await supabase
    .from("properties")
    .select("id, details, images, status, validation_status, property_type")
    .or("status.eq.disponible,validation_status.eq.approved");

  if (error) {
    console.error("Erreur:", error);
    return;
  }

  console.log(`Total biens: ${properties?.length}\n`);

  const categories = Object.entries(CATEGORY_MAPPING).map(
    ([id, { dbTypes, name, searchType }]) => {
      const categoryProperties = (properties || []).filter((p) => {
        const detailsType = p.details?.type;
        const propertyType = p.property_type;
        return dbTypes.includes(detailsType) || dbTypes.includes(propertyType);
      });

      return {
        id,
        name,
        count: categoryProperties.length,
        searchType,
      };
    }
  );

  console.log("=== RÉSULTATS PAR CATÉGORIE ===");
  categories.forEach((c) => {
    console.log(`${c.name}: ${c.count} biens`);
  });
}

testCategoriesAPI();
