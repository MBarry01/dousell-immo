
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
}

// Initialize Supabase client with Service Role Key (admin privileges)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function fixPropertiesFromLeases() {
    console.log('🔍 Checking for orphan leases (without property_id)...');

    // 1. Get leases without property_id
    const { data: leases, error: leasesError } = await supabase
        .from('leases')
        .select('*')
        .is('property_id', null);

    if (leasesError) {
        console.error('Error fetching leases:', leasesError);
        return;
    }

    if (!leases || leases.length === 0) {
        console.log('✅ No orphan leases found. All leases are linked to a property.');
        return;
    }

    console.log(`Found ${leases.length} leases without property.`);

    let createdCount = 0;
    let errorCount = 0;

    for (const lease of leases) {
        const propertyTitle = lease.property_address || `Bien sans adresse (Ref: ${lease.id.substring(0, 8)})`;
        console.log(`Processing lease for tenant: ${lease.tenant_name} (${propertyTitle})`);

        // 2. Create the Property
        // We treat them as 'location' category since they have a lease.
        const { data: newProp, error: createError } = await supabase
            .from('properties')
            .insert({
                title: propertyTitle,
                description: `Généré automatiquement depuis le bail de ${lease.tenant_name}`,
                price: lease.monthly_amount,
                currency: lease.currency || 'FCFA',
                category: 'location',
                status: 'disponible', // Default, user can change later
                owner_id: lease.owner_id,
                is_agency_listing: false,
                location: {
                    address: lease.property_address || '',
                    city: 'Dakar', // Default fallback
                    country: 'Senegal'
                }
            })
            .select()
            .single();

        if (createError) {
            console.error(`❌ Failed to create property for lease ${lease.id}:`, createError.message);
            errorCount++;
            continue;
        }

        // 3. Link Lease to Property
        const { error: updateError } = await supabase
            .from('leases')
            .update({ property_id: newProp.id })
            .eq('id', lease.id);

        if (updateError) {
            console.error(`❌ Failed to update lease ${lease.id} with property ${newProp.id}:`, updateError.message);
            errorCount++;
        } else {
            console.log(`✅ Created property "${newProp.title}" and linked to lease.`);
            createdCount++;
        }
    }

    console.log('\n✨ Process completed.');
    console.log(`Created: ${createdCount}`);
    console.log(`Errors: ${errorCount}`);
}

fixPropertiesFromLeases().catch(console.error);
