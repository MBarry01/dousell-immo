import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProperty() {
    const propertyId = '5d80f21a-d64c-4cbf-bc57-aa11e42fba68';

    console.log('🔍 Checking property:', propertyId);

    // 1. Get property
    const { data: property, error: propError } = await supabase
        .from('properties')
        .select('id, title, owner_id, service_type, contact_phone')
        .eq('id', propertyId)
        .single();

    console.log('\n📋 Property data:', property);
    if (propError) console.error('❌ Property error:', propError);

    // 2. Get owner if exists
    if (property?.owner_id) {
        const { data: owner, error: ownerError } = await supabase
            .from('profiles')
            .select('id, full_name, phone, is_identity_verified')
            .eq('id', property.owner_id)
            .single();

        console.log('\n👤 Owner data:', owner);
        if (ownerError) console.error('❌ Owner error:', ownerError);
    } else {
        console.log('\n⚠️ No owner_id found on property!');
    }
}

checkProperty().then(() => process.exit(0));
