import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("Missing Supabase credentials.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function runMigration() {
    const migrationFile = "20260130160425_unification_v4_5_atomic.sql";
    const migrationPath = path.join(process.cwd(), "supabase", "migrations", migrationFile);

    console.log(`🚀 Lecture de la migration: ${migrationFile}`);
    const sql = fs.readFileSync(migrationPath, "utf8");

    // Note: On utilise une fonction RPC custom 'execute_sql' si elle existe.
    // Sinon on doit passer par la CLI ou une autre méthode.
    // Dans cet environnement, on va tenter d'utiliser l'extension d'exécution SQL de Supabase
    // ou on va avertir l'utilisateur.

    console.log("⌛ Tentative d'exécution via RPC execute_sql...");

    const { data, error } = await supabase.rpc("execute_sql", { sql_query: sql });

    if (error) {
        if (error.message.includes("function \"execute_sql\" does not exist")) {
            console.error("❌ Erreur: La fonction RPC 'execute_sql' n'existe pas sur votre instance Supabase.");
            console.log("💡 Astuce: Copiez-collez le contenu de 'supabase/migrations/" + migrationFile + "' dans l'éditeur SQL de Supabase.");
        } else {
            console.error("❌ Erreur SQL:", error.message);
        }
        process.exit(1);
    }

    console.log("✅ Migration appliquée avec succès !");
}

runMigration();
