import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';
import fs from 'fs';

loadEnvConfig(process.cwd());

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
    const sources = ['CoinAfrique', 'Expat-Dakar', 'Facebook Marketplace', 'Seloger'];
    const results: any[] = [];

    console.log('\n🔍 VÉRIFICATION DE LA BASE DE DONNÉES (external_listings) \n');

    let totalAds = 0;

    for (const source of sources) {
        const { count, error } = await supabase
            .from('external_listings')
            .select('*', { count: 'exact', head: true })
            .eq('source_site', source);

        if (error) {
            console.error(`Erreur pour ${source}:`, error.message);
            continue;
        }

        const { data: latest } = await supabase
            .from('external_listings')
            .select('created_at, updated_at, title, location')
            .eq('source_site', source)
            .order('updated_at', { ascending: false })
            .limit(1);

        const logEntry = {
            source,
            count,
            latestUpdate: latest && latest.length > 0 ? new Date(latest[0].updated_at || latest[0].created_at).toLocaleString('fr-FR', { timeZone: 'Africa/Dakar' }) : null,
            exampleTitle: latest && latest.length > 0 ? latest[0].title : null,
            exampleLocation: latest && latest.length > 0 ? latest[0].location : null,
        };
        results.push(logEntry);

        console.log(`🏢 Source: ${source}`);
        console.log(`👉 Nombre total d'annonces: ${count}`);

        if (latest && latest.length > 0) {
            console.log(`📅 Dernière mise à jour: ${new Date(latest[0].updated_at || latest[0].created_at).toLocaleString('fr-FR', { timeZone: 'Africa/Dakar' })}`);
            console.log(`📝 Exemple: "${latest[0].title}" à ${latest[0].location || 'N/A'}`);
        } else {
            console.log(`⚠️ Aucune annonce trouvée.`);
        }
        console.log('----------------------------------------------------');

        totalAds += (count || 0);
    }

    results.push({ totalAds });
    fs.writeFileSync('check-results.json', JSON.stringify(results, null, 2));

    console.log(`\n✅ TOTAL ANNONCES EN BASE: ${totalAds}`);
}

check();
