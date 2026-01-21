import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTypeFilter(type: string) {
  console.log(`\n=== TEST FILTRE type="${type}" ===`);

  // Simuler la requête avec le fix (cherche dans details.type OU property_type)
  const { data, error } = await supabase
    .from("properties")
    .select("id, title, property_type, details")
    .eq("status", "disponible")
    .eq("validation_status", "approved")
    .or(`details->>type.ilike.${type},property_type.ilike.${type}`);

  if (error) {
    console.error("Erreur:", error.message);
    return;
  }

  console.log(`Résultats: ${data?.length} biens trouvés`);
  data?.forEach((p) => {
    console.log(`  - ${p.title}`);
    console.log(`    property_type: ${p.property_type}, details.type: ${p.details?.type}`);
  });
}

async function main() {
  await testTypeFilter("studio");
  await testTypeFilter("terrain");
  await testTypeFilter("villa");
  await testTypeFilter("appartement");
}

main();
