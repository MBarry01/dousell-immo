const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
    const { data, error } = await supabase
        .from('external_listings')
        .select('image_url')
        .limit(500);

    if (error) {
        console.error(error);
    } else {
        const domains = new Set();
        data.forEach(d => {
            if (d.image_url) {
                try { domains.add(new URL(d.image_url).hostname); } catch (e) { }
            }
        });
        fs.writeFileSync('domains.json', JSON.stringify([...domains], null, 2));
        console.log("Done");
    }
}

check();
