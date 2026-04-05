import fs from 'fs';

async function importDataset(datasetId: string, source: string) {
    console.log(`\n===========================================`);
    console.log(`🔄 Démarrage import pour ${source} (Dataset: ${datasetId})`);
    const secret = process.env.APIFY_WEBHOOK_SECRET;

    try {
        const res = await fetch('http://127.0.0.1:3000/api/webhooks/apify-sync', {
            method: 'POST',
            headers: {
                'x-webhook-secret': secret || '',
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                resource: { defaultDatasetId: datasetId },
                source: source
            })
        });

        // webhook repond asynchrone pour ne pas timeout, ou synchrone
        const json = await res.json();
        console.log(`✅ Résultat ${source}:`, json);
    } catch (err) {
        console.error(`❌ Erreur pour ${source}:`, err);
    }
}

async function run() {
    // 1. CoinAfrique
    console.log('Récupération du Run ID de CoinAfrique...');
    const runRes = await fetch(`https://api.apify.com/v2/acts/apify~cheerio-scraper/runs/last?token=${process.env.APIFY_API_TOKEN}`);
    const runData = await runRes.json();
    const coinDatasetId = runData.data.defaultDatasetId;
    console.log('-> Dataset ID:', coinDatasetId);

    await importDataset(coinDatasetId, 'CoinAfrique');

    // 2. Expat-Dakar
    // URL fournie: https://api.apify.com/v2/datasets/P0trlWUPkwWCmO4Bq/items?...
    await importDataset('P0trlWUPkwWCmO4Bq', 'Expat-Dakar');
}

run();
