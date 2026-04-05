import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';
import { v2 as cloudinary } from 'cloudinary';
import { randomUUID } from 'crypto';
import fs from 'fs';

loadEnvConfig(process.cwd());

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const secret = process.env.APIFY_WEBHOOK_SECRET;

// Utilise la variable d'environnement CLOUDINARY_URL automatiquement
cloudinary.config({
    secure: true
});

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
    if (!title) return false;
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
    const t = (title || '').toLowerCase();
    const l = (location || '').toLowerCase();
    let category = 'Autre';
    if (t.includes('terrain') || t.includes('parcelle')) category = 'Terrain';
    else if (t.includes('villa') || t.includes('maison')) category = 'Villa';
    else if (t.includes('appart') || t.includes('studio') || t.includes('chambre') || t.includes('f2') || t.includes('f3') || t.includes('f4')) category = 'Appartement';
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

async function uploadToCloudinary(imageUrl: string, source: string): Promise<string | null> {
    if (!imageUrl) return null;
    try {
        const safeUrl = imageUrl.split('?')[0];
        const timestamp = Math.floor(Date.now() / 1000);
        const result = await cloudinary.uploader.upload(imageUrl, {
            folder: `external_listings/${source.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
            public_id: `ad_${timestamp}_${randomUUID().substring(0, 8)}`,
            fetch_format: 'avif',
            quality: '80',
            width: 1200,
            crop: 'limit',
            timeout: 20000
        });
        return result.secure_url;
    } catch (err: any) {
        fs.appendFileSync('import-log.txt', `Cloudinary error: ${err?.message || err}\n`);
        return null;
    }
}

async function fetchApifyItems(url: string) {
    try {
        let datasetUrl = url;
        // if url is a run url, resolve dataset id first
        if (url.includes('/runs/last')) {
            const runRes = await fetch(url);
            const runData = await runRes.json();
            const datasetId = runData.data.defaultDatasetId;
            const urlObj = new URL(url);
            const token = urlObj.searchParams.get('token');
            datasetUrl = `https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}`;
        }

        const res = await fetch(datasetUrl);
        return await res.json();
    } catch (err) {
        fs.appendFileSync('import-log.txt', `Erreur fetch apify: ${err}\n`);
        return null;
    }
}

async function importDataset(source: string, url: string, mappingFields: any) {
    fs.appendFileSync('import-log.txt', `\nImporting ${source}...\n`);
    const items = await fetchApifyItems(url);

    if (!items || !Array.isArray(items)) {
        fs.appendFileSync('import-log.txt', `Pas de data pour ${source}\n`);
        return;
    }

    fs.appendFileSync('import-log.txt', `Trouvé ${items.length} items\n`);

    const processedAds = [];
    let successCount = 0;

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const itemUrl = extractField(item, mappingFields.url);
        const title = extractField(item, mappingFields.title);

        if (!itemUrl || !title) continue;
        if (!isRealEstateAd(title)) continue;

        const location = extractField(item, mappingFields.location) || '';
        const priceStr = extractField(item, mappingFields.price) || '';
        const { category, type, city } = classifyAd(title, location);

        const rawImage = extractField(item, mappingFields.image);
        let finalImageUrl = rawImage;
        if (rawImage && (source === 'Expat-Dakar' || source === 'CoinAfrique')) {
            const cldImage = await uploadToCloudinary(rawImage, source);
            if (cldImage) finalImageUrl = cldImage;
        }

        processedAds.push({
            source_url: itemUrl,
            title,
            price: priceStr,
            location: location || null,
            image_url: finalImageUrl,
            source_site: source,
            category,
            type,
            city,
            last_seen_at: new Date().toISOString()
        });

        if (processedAds.length % 10 === 0) fs.appendFileSync('import-log.txt', `Processed ${processedAds.length}...\n`);
    }

    const uniqueAds = Array.from(new Map(processedAds.map(ad => [ad.source_url, ad])).values());

    fs.appendFileSync('import-log.txt', `Upserting ${uniqueAds.length} unique ads pour ${source}...\n`);
    if (uniqueAds.length > 0) {
        const chunkSize = 50;
        for (let i = 0; i < uniqueAds.length; i += chunkSize) {
            const chunk = uniqueAds.slice(i, i + chunkSize);
            const { error } = await supabase.from('external_listings').upsert(chunk, { onConflict: 'source_url' });
            if (error) {
                fs.appendFileSync('import-log.txt', `Erreur DB: ${JSON.stringify(error)}\n`);
            }
        }
        fs.appendFileSync('import-log.txt', `✅ Upsert terminé pour ${source}\n`);
    }
}

async function run() {
    await importDataset('CoinAfrique', `https://api.apify.com/v2/acts/apify~cheerio-scraper/runs/last?token=${process.env.APIFY_API_TOKEN}`, {
        url: ['url', 'link'],
        title: 'title',
        price: 'price',
        location: 'location',
        image: ['image', 'images.0'],
        rooms: 'rooms'
    });

    await importDataset('Expat-Dakar', `https://api.apify.com/v2/datasets/P0trlWUPkwWCmO4Bq/items?token=${process.env.APIFY_API_TOKEN_EXPAT || process.env.APIFY_API_TOKEN}`, {
        url: 'url',
        title: 'title',
        price: 'price',
        location: 'location',
        image: ['image', 'images.0'],
        surface: 'surface'
    });
}

run();
