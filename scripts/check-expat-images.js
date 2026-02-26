const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkExpatDakar() {
    const { data, error } = await supabase
        .from('external_listings')
        .select('image_url')
        .ilike('source_site', '%Expat-Dakar%')
        .limit(100);

    if (error) {
        console.error("DB Error:", error);
        return;
    }

    const domains = new Set();
    data.forEach(d => {
        if (d.image_url) {
            try { domains.add(new URL(d.image_url).hostname); } catch (e) { }
        }
    });
    console.log("Expat-Dakar domains:", [...domains]);
}

checkExpatDakar();
