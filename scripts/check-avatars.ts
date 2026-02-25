
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkAvatars() {
    const { data, count, error } = await supabase
        .from('profiles')
        .select('id, avatar_url', { count: 'exact' });

    if (error) {
        console.error("Error fetching profiles:", error);
        return;
    }

    console.log(`Total profiles: ${count}`);
    let avatarCount = 0;
    let supabaseAvatarCount = 0;

    data?.forEach(p => {
        if (p.avatar_url) {
            avatarCount++;
            if (p.avatar_url.includes('supabase.co')) supabaseAvatarCount++;
        }
    });

    console.log(`Total avatars: ${avatarCount}`);
    console.log(`Avatars on Supabase: ${supabaseAvatarCount}`);
}

checkAvatars();
