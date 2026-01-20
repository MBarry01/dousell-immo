import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialisation de Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Configuration par source - Mapping des champs selon le scraper
// Chaque champ peut être un string ou un array de strings (fallback)
const SOURCE_CONFIG: Record<string, {
  urlField: string | string[];
  titleField: string | string[];
  priceField: string | string[];
  locationField: string | string[];
  imageField: string | string[];
}> = {
  CoinAfrique: {
    urlField: 'url',
    titleField: 'title',
    priceField: 'price',
    locationField: 'location',
    imageField: ['image', 'image_url', 'img'],
  },
  'Expat-Dakar': {
    urlField: ['url', 'link'],           // Ton scraper envoie 'url'
    titleField: 'title',
    priceField: ['price', 'prix'],       // Ton scraper envoie 'price'
    locationField: ['location', 'localisation'],
    imageField: ['image', 'photo', 'thumbnail'],
  },
  Seloger: {
    urlField: 'url',
    titleField: 'nom',
    priceField: 'price',
    locationField: 'adresse',
    imageField: ['image_principale', 'image'],
  },
};

// TTL en jours - Annonces non vues après ce délai seront supprimées
const CLEANUP_TTL_DAYS = 7;

// Header secret pour sécuriser le webhook
const WEBHOOK_SECRET = process.env.APIFY_WEBHOOK_SECRET;

/**
 * Extrait la première valeur non-nulle parmi plusieurs champs possibles
 */
function extractField(obj: Record<string, unknown>, fields: string | string[]): string | null {
  const fieldList = Array.isArray(fields) ? fields : [fields];
  for (const field of fieldList) {
    const value = obj[field];
    if (value && typeof value === 'string' && value.trim() !== '') {
      return value.trim();
    }
  }
  return null;
}

/**
 * Classification automatique basée sur le titre et la localisation
 */
function classifyAd(title: string, location: string) {
  const titleLower = title.toLowerCase();
  const locLower = location.toLowerCase();

  // Catégorie du bien
  let category = 'Autre';
  if (titleLower.includes('terrain') || titleLower.includes('parcelle')) {
    category = 'Terrain';
  } else if (titleLower.includes('villa') || titleLower.includes('maison')) {
    category = 'Villa';
  } else if (titleLower.includes('appart') || titleLower.includes('studio') || titleLower.includes('chambre')) {
    category = 'Appartement';
  } else if (titleLower.includes('bureau') || titleLower.includes('local') || titleLower.includes('commercial')) {
    category = 'Commercial';
  }

  // Type de transaction
  let type = 'Vente';
  if (titleLower.includes('louer') || titleLower.includes('location') || titleLower.includes('à louer') || titleLower.includes('bail')) {
    type = 'Location';
  }

  // Ville
  let city = 'Dakar';
  if (locLower.includes('saly') || locLower.includes('mbour') || locLower.includes('somone')) {
    city = 'Saly';
  } else if (locLower.includes('thiès') || locLower.includes('thies')) {
    city = 'Thiès';
  } else if (locLower.includes('saint-louis') || locLower.includes('saint louis') || locLower.includes('ndar')) {
    city = 'Saint-Louis';
  } else if (locLower.includes('rufisque')) {
    city = 'Rufisque';
  } else if (locLower.includes('diamniadio')) {
    city = 'Diamniadio';
  }

  return { category, type, city };
}

export async function POST(req: Request) {
  try {
    // 1. Vérification du secret (sécurité)
    if (WEBHOOK_SECRET) {
      const authHeader = req.headers.get('x-webhook-secret') || req.headers.get('authorization');
      if (authHeader !== WEBHOOK_SECRET && authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
        console.error('Webhook secret invalide');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const body = await req.json();

    // 2. Extraction des paramètres (support format Apify + custom)
    const datasetId = body.resource?.defaultDatasetId || body.datasetId;
    const source = body.source || body.source_site || 'CoinAfrique';
    const apifyToken = process.env.APIFY_API_TOKEN;

    if (!datasetId || !apifyToken) {
      console.error('Missing datasetId or apifyToken');
      return NextResponse.json({ error: 'Missing configuration' }, { status: 400 });
    }

    // Validation de la source
    const config = SOURCE_CONFIG[source];
    if (!config) {
      console.error(`Source inconnue: ${source}. Sources supportées: ${Object.keys(SOURCE_CONFIG).join(', ')}`);
      return NextResponse.json({
        error: `Source inconnue: ${source}`,
        supportedSources: Object.keys(SOURCE_CONFIG)
      }, { status: 400 });
    }

    console.log(`[${source}] Démarrage sync depuis dataset ${datasetId}`);

    // 3. Récupération des données depuis Apify
    const response = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apifyToken}`
    );

    if (!response.ok) {
      throw new Error(`Apify fetch failed: ${response.statusText}`);
    }

    const ads: Record<string, unknown>[] = await response.json();
    const now = new Date().toISOString();

    console.log(`[${source}] ${ads.length} annonces brutes reçues`);

    // 4. Traitement avec mapping flexible
    const processedAds = [];
    let skipped = 0;

    for (const ad of ads) {
      const sourceUrl = extractField(ad, config.urlField);
      const title = extractField(ad, config.titleField);

      // Validation : URL et titre obligatoires
      if (!sourceUrl || !title) {
        skipped++;
        continue;
      }

      const location = extractField(ad, config.locationField) || '';
      const { category, type, city } = classifyAd(title, location);

      processedAds.push({
        source_url: sourceUrl,
        title,
        price: extractField(ad, config.priceField),
        location: location || null,
        image_url: extractField(ad, config.imageField),
        source_site: source,
        category,
        type,
        city,
        last_seen_at: now,
      });
    }

    console.log(`[${source}] ${processedAds.length} annonces valides (${skipped} ignorées)`);

    // 5. Déduplication dans le batch (même URL)
    const uniqueAdsMap = new Map<string, typeof processedAds[0]>();
    for (const ad of processedAds) {
      uniqueAdsMap.set(ad.source_url, ad);
    }
    const uniqueAds = Array.from(uniqueAdsMap.values());

    console.log(`[${source}] ${uniqueAds.length} annonces uniques après déduplication`);

    // 6. Upsert en base (insertion ou mise à jour)
    if (uniqueAds.length > 0) {
      const { error: upsertError } = await supabase
        .from('external_listings')
        .upsert(uniqueAds, { onConflict: 'source_url' });

      if (upsertError) {
        throw new Error(`Upsert failed: ${upsertError.message}`);
      }
    }

    // 7. Nettoyage ciblé : uniquement les annonces de CETTE source non vues depuis TTL jours
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - CLEANUP_TTL_DAYS);

    const { data: deletedData, error: deleteError } = await supabase
      .from('external_listings')
      .delete()
      .eq('source_site', source)
      .lt('last_seen_at', cutoffDate.toISOString())
      .select('id');

    if (deleteError) {
      console.error(`[${source}] Erreur nettoyage:`, deleteError.message);
    } else {
      const deletedCount = deletedData?.length || 0;
      if (deletedCount > 0) {
        console.log(`[${source}] ${deletedCount} annonces obsolètes supprimées (>${CLEANUP_TTL_DAYS} jours)`);
      }
    }

    // 8. Réponse avec statistiques
    return NextResponse.json({
      success: true,
      source,
      stats: {
        received: ads.length,
        valid: processedAds.length,
        unique: uniqueAds.length,
        skipped,
        cleanupTTL: `${CLEANUP_TTL_DAYS} jours`,
      },
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Erreur Webhook:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET pour vérifier que le webhook est actif
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    supportedSources: Object.keys(SOURCE_CONFIG),
    cleanupTTL: `${CLEANUP_TTL_DAYS} jours`,
    secured: !!WEBHOOK_SECRET,
  });
}
