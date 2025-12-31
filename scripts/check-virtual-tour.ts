
import { createClient } from "@supabase/supabase-js";
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!);

async function checkProperty() {
    const id = 'c5164c41-4df8-43a9-bfe6-96d74f5c74d2';
    console.log(`Checking property ${id}...`);

    const { data, error } = await supabase
        .from('properties')
        .select('id, title, virtual_tour_url')
        .eq('id', id)
        .single();

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log('--- PROPERTY DATA ---');
    console.log(`Title: ${data.title}`);
    console.log(`Virtual Tour URL: '${data.virtual_tour_url}'`);
    console.log('---------------------');
}

checkProperty();
