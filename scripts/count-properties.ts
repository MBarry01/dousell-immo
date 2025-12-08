import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Variables d'environnement manquantes");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  const { data, count, error } = await supabase
    .from("properties")
    .select("id", { count: "exact" })
    .eq("validation_status", "approved")
    .eq("status", "disponible");

  if (error) {
    console.error("❌ Erreur:", error);
    return;
  }

  console.log(`📊 Total propriétés approuvées et disponibles: ${count}`);
}

main();




