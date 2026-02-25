
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkProperties() {
    const { data, count, error } = await supabase
        .from('properties')
        .select('id, images', { count: 'exact' });

    if (error) {
        console.error("Error fetching properties:", error);
        return;
    }

    console.log(`Total properties: ${count}`);
    let totalImages = 0;
    let supabaseImageCount = 0;

    data?.forEach(p => {
        if (p.images) {
            totalImages += p.images.length;
            p.images.forEach((img: string) => {
                if (img.includes('supabase.co')) supabaseImageCount++;
            });
        }
    });

    console.log(`Total images: ${totalImages}`);
    console.log(`Images on Supabase: ${supabaseImageCount}`);
}

checkProperties();
