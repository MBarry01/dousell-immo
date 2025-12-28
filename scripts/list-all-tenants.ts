import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function listAllTenants() {
    console.log("📋 --- LISTE DE TOUS LES LOCATAIRES ---\n");

    const { data: leases, error } = await supabase
        .from('leases')
        .select('id, tenant_name, tenant_email, status')
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error("❌ Erreur:", error);
        return;
    }

    console.log(`Total : ${leases.length} baux trouvés\n`);

    leases.forEach((lease, index) => {
        console.log(`${index + 1}. ${lease.tenant_name}`);
        console.log(`   Email  : ${lease.tenant_email || 'Pas d\'email'}`);
        console.log(`   Statut : ${lease.status || 'N/A'}`);
        console.log(`   ID     : ${lease.id}`);
        console.log('');
    });

    console.log("\n💡 Cherche 'Yahya' dans cette liste.");
    console.log("   Si tu le vois, note son nom EXACT pour le script.");
}

listAllTenants();
