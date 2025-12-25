/**
 * Script de test pour les documents de certification
 * Teste la récupération et la génération d'URLs signées
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Variables d'environnement manquantes");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testVerificationDocs() {
    console.log("🔍 Test des documents de certification\n");

    // 1. Récupérer les propriétés certifiées
    console.log("1️⃣ Récupération des propriétés certifiées...");
    const { data: properties, error: propertiesError } = await supabase
        .from("properties")
        .select("id, title, proof_document_url, verification_status, owner_id")
        .eq("verification_status", "verified")
        .not("proof_document_url", "is", null);

    if (propertiesError) {
        console.error("❌ Erreur:", propertiesError);
        return;
    }

    console.log(`✅ Trouvé ${properties?.length || 0} propriétés certifiées\n`);

    if (!properties || properties.length === 0) {
        console.log("⚠️ Aucune propriété certifiée trouvée");
        console.log("   Pour tester:");
        console.log("   1. Créez une annonce");
        console.log("   2. Uploadez un document de vérification");
        console.log("   3. Approuvez-la dans l'interface admin");
        return;
    }

    // 2. Tester chaque document
    for (const property of properties) {
        console.log(`\n📄 Propriété: ${property.title}`);
        console.log(`   ID: ${property.id}`);
        console.log(`   Owner: ${property.owner_id}`);
        console.log(`   Document Path: ${property.proof_document_url}`);

        // 3. Vérifier si le fichier existe dans le storage
        const { data: fileList, error: listError } = await supabase.storage
            .from("verification-docs")
            .list(property.proof_document_url.split("/").slice(0, -1).join("/"));

        if (listError) {
            console.error(`   ❌ Erreur lors de la liste des fichiers:`, listError);
            continue;
        }

        const fileName = property.proof_document_url.split("/").pop();
        const fileExists = fileList?.some((f) => f.name === fileName);

        if (fileExists) {
            console.log(`   ✅ Fichier trouvé dans le storage`);
        } else {
            console.log(`   ❌ Fichier NON trouvé dans le storage`);
            console.log(`   📂 Fichiers disponibles:`, fileList?.map((f) => f.name));
            continue;
        }

        // 4. Tester la génération d'URL signée
        const { data: urlData, error: urlError } = await supabase.storage
            .from("verification-docs")
            .createSignedUrl(property.proof_document_url, 3600);

        if (urlError) {
            console.error(`   ❌ Erreur génération URL:`, urlError);
            continue;
        }

        if (urlData?.signedUrl) {
            console.log(`   ✅ URL signée générée avec succès`);
            console.log(`   🔗 URL: ${urlData.signedUrl.substring(0, 80)}...`);

            // 5. Tester l'accès à l'URL
            try {
                const response = await fetch(urlData.signedUrl);
                console.log(`   📡 Status HTTP: ${response.status}`);
                console.log(`   📄 Content-Type: ${response.headers.get("content-type")}`);

                if (response.ok) {
                    const contentLength = response.headers.get("content-length");
                    console.log(`   ✅ Fichier accessible - Taille: ${contentLength} bytes`);
                } else {
                    console.log(`   ❌ Fichier non accessible - Status: ${response.status}`);
                }
            } catch (fetchError) {
                console.error(`   ❌ Erreur fetch:`, fetchError);
            }
        } else {
            console.log(`   ❌ URL signée vide`);
        }
    }

    console.log("\n✅ Test terminé");
}

testVerificationDocs().catch(console.error);
