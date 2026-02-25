
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkMaintenance() {
    const { data, count, error } = await supabase
        .from('maintenance_requests')
        .select('id, photos', { count: 'exact' });

    if (error) {
        console.error("Error fetching maintenance:", error);
        return;
    }

    console.log(`Total maintenance requests: ${count}`);
    let photoCount = 0;
    let supabasePhotoCount = 0;

    data?.forEach(m => {
        if (m.photos && Array.isArray(m.photos)) {
            photoCount += m.photos.length;
            m.photos.forEach((img: string) => {
                if (img.includes('supabase.co')) supabasePhotoCount++;
            });
        }
    });

    console.log(`Total maintenance photos: ${photoCount}`);
    console.log(`Photos on Supabase: ${supabasePhotoCount}`);
}

checkMaintenance();
