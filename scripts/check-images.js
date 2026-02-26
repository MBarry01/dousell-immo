const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
    const { data, error } = await supabase
        .from('external_listings')
        .select('title, image_url, source_site, created_at')
        .limit(5)
        .order('created_at', { ascending: false });

    if (error) {
        console.error(error);
    } else {
        data.forEach(d => {
            console.log(`Title: ${d.title}`);
            console.log(`Image URL type: ${typeof d.image_url}`);
            console.log(`Image URL value: ${d.image_url}`);
            console.log(`---`);
        });
    }
}

check();
