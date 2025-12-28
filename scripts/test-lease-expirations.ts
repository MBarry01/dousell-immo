/**
 * Script de test: Vérifier le système d'alertes de fin de bail
 * Usage: npx tsx scripts/test-lease-expirations.ts
 */

import { checkLeaseExpirations } from '@/lib/lease-expiration-service';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config({ path: '.env.local' });

async function testLeaseExpirations() {
    console.log('🧪 Test du système d\'alertes de fin de bail...\n');

    try {
        const result = await checkLeaseExpirations();

        console.log('\n📊 Résultats:');
        console.log(`   - Alertes envoyées: ${result.count}`);
        console.log(`   - Message: ${result.message}`);

        if (result.errors && result.errors.length > 0) {
            console.log(`   - Erreurs: ${result.errors.length}`);
            console.error('   Détails des erreurs:', result.errors);
        }

        console.log('\n✅ Test terminé !');

    } catch (error: any) {
        console.error('❌ Erreur lors du test:', error.message);
        console.error(error);
        process.exit(1);
    }
}

testLeaseExpirations();
