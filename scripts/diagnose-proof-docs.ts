/**
 * Script de diagnostic pour inspecter proof_document_url
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Variables d'environnement manquantes");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnose() {
    console.log("🔍 Diagnostic des documents de certification\n");

    const { data: properties, error } = await supabase
        .from("properties")
        .select("id, title, proof_document_url, verification_status, owner_id")
        .eq("verification_status", "verified")
        .not("proof_document_url", "is", null);

    if (error) {
        console.error("❌ Erreur:", error);
        return;
    }

    if (!properties || properties.length === 0) {
        console.log("⚠️ Aucune propriété certifiée trouvée");
        return;
    }

    console.log(`✅ Trouvé ${properties.length} propriétés certifiées\n`);

    for (const prop of properties) {
        console.log("━".repeat(80));
        console.log(`📄 ${prop.title}`);
        console.log(`   ID: ${prop.id}`);
        console.log(`   Owner: ${prop.owner_id}`);
        console.log(`   proof_document_url: "${prop.proof_document_url}"`);
        console.log(`   Type: ${prop.proof_document_url?.startsWith("http") ? "URL complète" : "Chemin relatif"}`);

        // Tester si c'est une URL HTTP
        if (prop.proof_document_url?.startsWith("http")) {
            console.log(`   ℹ️ C'est une URL HTTP, test d'accès...`);
            try {
                const response = await fetch(prop.proof_document_url);
                console.log(`   Status: ${response.status}`);
                const contentType = response.headers.get("content-type");
                console.log(`   Content-Type: ${contentType}`);

                if (response.ok) {
                    const text = await response.text();
                    if (text.includes("<!DOCTYPE") || text.includes("<html")) {
                        console.log(`   ❌ PROBLEME: L'URL retourne du HTML au lieu d'un fichier!`);
                        console.log(`   Extrait: ${text.substring(0, 200)}`);
                    } else {
                        console.log(`   ✅ L'URL retourne bien un fichier`);
                    }
                }
            } catch (e) {
                console.log(`   ❌ Erreur d'accès:`, e);
            }
        } else {
            // C'est un chemin, tester dans le storage
            console.log(`   ℹ️ C'est un chemin relatif, test dans storage...`);
            const { data, error: urlError } = await supabase.storage
                .from("verification-docs")
                .createSignedUrl(prop.proof_document_url, 60);

            if (urlError) {
                console.log(`   ❌ Erreur génération URL:`, urlError.message);
            } else if (data?.signedUrl) {
                console.log(`   ✅ URL signée générée`);
                // Tester l'accès
                try {
                    const response = await fetch(data.signedUrl);
                    console.log(`   Status: ${response.status}`);
                    if (response.ok) {
                        console.log(`   ✅ Fichier accessible`);
                    } else {
                        console.log(`   ❌ Fichier non accessible`);
                    }
                } catch (e) {
                    console.log(`   ❌ Erreur:`, e);
                }
            }
        }
    }

    console.log("\n━".repeat(80));
    console.log("✅ Diagnostic terminé");
}

diagnose().catch(console.error);
