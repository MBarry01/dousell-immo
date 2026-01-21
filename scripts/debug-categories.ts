import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugCategories() {
  console.log("=== DEBUG CATEGORIES ===\n");

  // 1. Récupérer tous les biens disponibles et approuvés
  const { data: properties, error } = await supabase
    .from("properties")
    .select("id, title, property_type, category, details, status, validation_status")
    .eq("status", "disponible")
    .eq("validation_status", "approved");

  if (error) {
    console.error("Erreur:", error);
    return;
  }

  console.log(`Total biens disponibles et approuvés: ${properties?.length}\n`);

  // 2. Analyser les property_type
  const propertyTypes: Record<string, number> = {};
  const detailsTypes: Record<string, number> = {};

  properties?.forEach((p) => {
    // Compter property_type
    const pType = p.property_type || "null";
    propertyTypes[pType] = (propertyTypes[pType] || 0) + 1;

    // Compter details.type
    const dType = p.details?.type || "null";
    detailsTypes[dType] = (detailsTypes[dType] || 0) + 1;
  });

  console.log("=== property_type (colonne directe) ===");
  Object.entries(propertyTypes).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });

  console.log("\n=== details.type (JSON) ===");
  Object.entries(detailsTypes).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });

  // 3. Chercher spécifiquement les terrains
  console.log("\n=== TERRAINS ===");
  const terrains = properties?.filter((p) => {
    const pType = (p.property_type || "").toLowerCase();
    const dType = ((p.details?.type as string) || "").toLowerCase();
    return pType.includes("terrain") || dType.includes("terrain");
  });

  console.log(`Terrains trouvés: ${terrains?.length}`);
  terrains?.forEach((t) => {
    console.log(`  - ${t.title}`);
    console.log(`    property_type: ${t.property_type}`);
    console.log(`    details.type: ${t.details?.type}`);
  });
}

debugCategories();
