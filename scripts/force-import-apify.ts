import { POST } from '../app/api/webhooks/apify-sync/route';
import { loadEnvConfig } from '@next/env';

// Charger les variables d'environnement (ex: CLOUDINARY_URL, SUPABASE_URL, etc.)
loadEnvConfig(process.cwd());

async function run() {
    const datasetId = 'UA4Tl1AoSSXeoLOpe';
    const token = process.env.APIFY_API_TOKEN_FACEBOOK || '';

    // Surcharger le token d'Apify pour utiliser celui de l'utilisateur
    process.env.APIFY_API_TOKEN_FACEBOOK = token;
    // Définir un webhook secret local
    const secret = 'local-force-secret';
    process.env.APIFY_WEBHOOK_SECRET = secret;

    console.log(`🚀 Démarrage de l'import pour le dataset ${datasetId}...`);

    const req = new Request('http://localhost/api/webhooks/apify-sync', {
        method: 'POST',
        headers: {
            'x-webhook-secret': secret,
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            resource: { defaultDatasetId: datasetId },
            source: 'Facebook Marketplace'
        })
    });

    try {
        const res = await POST(req);
        const json = await res.json();
        console.log('✅ Résultat webhook:', JSON.stringify(json, null, 2));
    } catch (err) {
        console.error('❌ Erreur:', err);
    }
}

run();
