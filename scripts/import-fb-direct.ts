import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';
import fs from 'fs';

loadEnvConfig(process.cwd());

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function extractField(obj: any, fields: string | string[]): string | null {
    const fieldList = Array.isArray(fields) ? fields : [fields];
    for (const field of fieldList) {
        let value = obj;
        for (const part of field.split('.')) {
            if (value === null || value === undefined) { value = null; break; }
            value = value[part];
        }
        if (value && typeof value === 'string' && value.trim() !== '') return value.trim();
    }
    return null;
}

function isRealEstateAd(title: string): boolean {
    const titleLower = title.toLowerCase();
    const realEstateKeywords = [
        'maison', 'villa', 'appartement', 'appart', 'studio', 'terrain',
        'parcelle', 'lot', 'immeuble', 'duplex', 'chambre',
        'location', 'louer', 'à louer', 'vendre', 'vente', 'bail',
        'propriété', 'bien immobilier', 'immobilier', 'résidence'
    ];
    const nonRealEstateKeywords = [
        'meuble', 'table', 'chaise', 'sofa', 'salon', 'lit', 'armoire',
        'carrelage', 'carreaux', 'peinture', 'ciment', 'tôle', 'bois',
        'quincaillerie', 'outil', 'électronique', 'téléphone', 'ordinateur',
        'véhicule', 'voiture', 'moto', 'bateau', 'électroménager',
        'climatisation', 'frigo', 'cuisinière', 'vêtement', 'habit',
        'chaussure', 'sac', 'bijoux', 'jeux', 'jouet', 'livre'
    ];

    for (const kw of nonRealEstateKeywords) if (titleLower.includes(kw)) return false;
    for (const kw of realEstateKeywords) if (titleLower.includes(kw)) return true;
    return false;
}

function classifyAd(title: string, location: string) {
    const t = title.toLowerCase();
    const l = (location || '').toLowerCase();
    let category = 'Autre';
    if (t.includes('terrain') || t.includes('parcelle')) category = 'Terrain';
    else if (t.includes('villa') || t.includes('maison')) category = 'Villa';
    else if (t.includes('appart') || t.includes('studio') || t.includes('chambre')) category = 'Appartement';
    else if (t.includes('bureau') || t.includes('local') || t.includes('commercial')) category = 'Commercial';

    let type = 'Vente';
    if (t.includes('louer') || t.includes('location') || t.includes('à louer') || t.includes('bail')) type = 'Location';

    let city = 'Dakar';
    if (l.includes('saly') || l.includes('mbour') || l.includes('somone')) city = 'Saly';
    else if (l.includes('thies') || l.includes('thiès')) city = 'Thiès';
    else if (l.includes('saint-louis') || l.includes('ndar')) city = 'Saint-Louis';
    else if (l.includes('rufisque')) city = 'Rufisque';

    return { category, type, city };
}

async function run() {
    console.log('Fetching dataset from Apify...');
    const res = await fetch(`https://api.apify.com/v2/datasets/UA4Tl1AoSSXeoLOpe/items?token=${process.env.APIFY_API_TOKEN_FACEBOOK || process.env.APIFY_API_TOKEN}`);
    const ads = await res.json();
    console.log(`Fetched ${ads.length} items from Apify.`);

    const processedAds = [];
    let skipped = 0;
    for (const ad of ads) {
        const url = extractField(ad, ['listingUrl', 'url']);
        const title = extractField(ad, ['marketplace_listing_title', 'title']);
        if (!url || !title) { skipped++; continue; }
        if (!isRealEstateAd(title)) { skipped++; continue; }

        const location = extractField(ad, ['location.reverse_geocode.city', 'location.reverse_geocode.state', 'location']) || '';
        const { category, type, city } = classifyAd(title, location);

        processedAds.push({
            source_url: url,
            title,
            price: extractField(ad, ['listing_price.formatted_amount', 'price']),
            location: location || null,
            image_url: extractField(ad, ['primary_listing_photo_url', 'primary_listing_photo.photo_image_url', 'image']),
            source_site: 'Facebook Marketplace',
            category,
            type,
            city,
            last_seen_at: new Date().toISOString()
        });
    }

    console.log(`Filtered down to ${processedAds.length} valid real estate listings. Upserting into DB...`);
    if (processedAds.length > 0) {
        const uniqueMap = new Map();
        for (const ad of processedAds) uniqueMap.set(ad.source_url, ad);
        const uniqueAds = Array.from(uniqueMap.values());
        console.log(`Deduplicated to ${uniqueAds.length} unique ads.`);

        const { error } = await supabase.from('external_listings').upsert(uniqueAds, { onConflict: 'source_url' });
        if (error) console.error('Database Error:', error);
        else console.log('Successfully upserted into Supabase!');
    }
}
run();
