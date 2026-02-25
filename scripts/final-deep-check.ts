
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function finalCheck() {
    console.log("--- Checking Inventory Reports ---");
    const { data: reports } = await supabase.from('inventory_reports').select('*').limit(10);
    console.log(`Found ${reports?.length || 0} inventory reports.`);

    reports?.forEach(r => {
        console.log(`Report ID: ${r.id}`);
        if (r.rooms) {
            const roomsStr = JSON.stringify(r.rooms);
            if (roomsStr.includes('supabase.co')) {
                console.log(`  ⚠️ FOUND Supabase image in rooms JSON!`);
            }
        }
        if (r.owner_signature?.includes('supabase.co')) console.log(`  ⚠️ Supabase sig in owner_signature`);
        if (r.tenant_signature?.includes('supabase.co')) console.log(`  ⚠️ Supabase sig in tenant_signature`);
    });

    console.log("--- Checking Lease Documents ---");
    const { data: leases } = await supabase.from('leases').select('*').limit(10);
    leases?.forEach(l => {
        if (l.contract_url?.includes('supabase.co')) {
            // We usually don't migrate PDFs to Cloudinary, only images.
            // But let's check if there are images.
        }
    });

    console.log("--- Checking Vitrine/Public Properties ---");
    // The 'properties' table was already checked and partially migrated.
    // I'll re-verify if any 'supabase.co' strings remain in ANY row.
    const { data: allProps } = await supabase.from('properties').select('id, images');
    let remaining = 0;
    allProps?.forEach(p => {
        p.images?.forEach((img: string) => {
            if (img.includes('supabase.co')) remaining++;
        });
    });
    console.log(`Remaining Supabase images in properties: ${remaining}`);
}

finalCheck();
