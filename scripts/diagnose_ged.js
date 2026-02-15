
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function diagnose() {
    console.log("--- GED DIAGNOSIS ---");

    const { data: docs, error: docsError } = await supabase
        .from('user_documents')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    if (docsError) {
        console.error("Error fetching docs:", docsError);
        return;
    }

    console.log(`Found ${docs.length} recent documents:`);
    docs.forEach(d => {
        console.log(`- ID: ${d.id} | Name: ${d.name} | LeaseID: ${d.lease_id} | EntityID: ${d.entity_id} | Type: ${d.file_type} | Cat: ${d.category}`);
    });

    const leaseId = '15b0d825-778c-461b-ad87-27ce75fbbaae';
    console.log(`\nChecking specific lease: ${leaseId}`);
    const { data: specificDoc, error: specError } = await supabase
        .from('user_documents')
        .select('*')
        .eq('lease_id', leaseId)
        .maybeSingle();

    if (specError) console.error("Error fetching specific doc:", specError);
    else if (specificDoc) console.log("Found document for lease:", specificDoc.id);
    else console.log("No document found for lease ID in lease_id column.");

    const { data: entityDoc } = await supabase
        .from('user_documents')
        .select('*')
        .eq('entity_id', leaseId)
        .maybeSingle();

    if (entityDoc) console.log("Found document for lease ID in entity_id column:", entityDoc.id);

}

diagnose();
