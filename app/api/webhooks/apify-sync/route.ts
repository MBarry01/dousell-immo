import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialisation de Supabase
// Note: Utilisation de NEXT_PUBLIC_SUPABASE_URL car SUPABASE_URL n'est pas défini dans .env.local
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { resource } = body; // Contient l'ID du dataset d'Apify

        // 1. Récupération des données depuis Apify
        const datasetId = resource?.defaultDatasetId;
        const apifyToken = process.env.APIFY_API_TOKEN;

        if (!datasetId || !apifyToken) {
            console.error("Missing datasetId or apifyToken");
            return NextResponse.json({ error: "Missing configuration" }, { status: 400 });
        }

        const response = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${apifyToken}`);

        if (!response.ok) {
            throw new Error(`Apify fetch failed: ${response.statusText}`);
        }

        const ads = await response.json();

        const now = new Date().toISOString();
        console.log(`Traitement de ${ads.length} annonces brutes...`);

        // 2. VALIDATION : Ne garder que les annonces avec titre et URL valides
        const validAds = ads.filter((ad: any) =>
            ad.title && ad.title.trim() !== "" &&
            ad.url && ad.url.trim() !== ""
        );
        console.log(`${validAds.length} annonces valides sur ${ads.length}`);

        // 3. Traitement et Classification Automatique
        const processedAds = validAds.map((ad: any) => {
            const title = (ad.title || "").toLowerCase();
            const loc = (ad.location || "").toLowerCase();

            // Logique de Catégorie
            let category = "Autre";
            if (title.includes("terrain") || title.includes("parcelle")) category = "Terrain";
            else if (title.includes("villa") || title.includes("maison")) category = "Villa";
            else if (title.includes("appart") || title.includes("studio")) category = "Appartement";

            // Logique de Type (Vente vs Location)
            let type = "Vente";
            if (title.includes("louer") || title.includes("location")) type = "Location";

            // Logique de Ville (Dakar, Saly, Thiès...)
            let city = "Dakar";
            if (loc.includes("saly") || loc.includes("mbour")) city = "Saly";
            else if (loc.includes("thiès") || loc.includes("thies")) city = "Thiès";

            return {
                source_url: ad.url, // Clé unique pour l'Upsert
                title: ad.title,
                price: ad.price,
                location: ad.location,
                image_url: ad.image_url,
                source_site: "CoinAfrique",
                category,
                type,
                city,
                last_seen_at: now
            };
        });

        // 3. Déduplication (éviter les doublons d'URL dans le même batch)
        const uniqueAdsMap = new Map<string, typeof processedAds[0]>();
        for (const ad of processedAds) {
            if (ad.source_url) {
                uniqueAdsMap.set(ad.source_url, ad);
            }
        }
        const uniqueAds = Array.from(uniqueAdsMap.values());
        console.log(`${uniqueAds.length} annonces uniques sur ${processedAds.length}`);

        // 4. Upsert dans Supabase (Mise à jour ou Insertion)
        // Note: upsert returns { data, error }
        const { error: upsertError } = await supabase
            .from('external_listings')
            .upsert(uniqueAds, { onConflict: 'source_url' });

        if (upsertError) throw upsertError;

        // 4. Nettoyage Automatique des disparus
        // On supprime les annonces qui n'ont pas été vues lors de ce run
        await supabase
            .from('external_listings')
            .delete()
            .lt('last_seen_at', now);

        return NextResponse.json({ message: "Sync réussie", count: ads.length });

    } catch (error: any) {
        console.error("Erreur Webhook:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
