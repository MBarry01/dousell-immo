
import { createClient } from '@supabase/supabase-js';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Supabase Setup
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Cloudinary Setup
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

async function migrateAvatars() {
    console.log("🚀 Starting avatar migration (Supabase -> Cloudinary)...");

    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url');

    if (error) {
        console.error("❌ Error fetching profiles:", error);
        return;
    }

    let totalMigrated = 0;

    for (const profile of profiles || []) {
        if (profile.avatar_url && profile.avatar_url.includes('supabase.co')) {
            try {
                console.log(`  Migrating avatar for ${profile.full_name || profile.id}...`);

                const result = await cloudinary.uploader.upload(profile.avatar_url, {
                    folder: 'doussel/profiles/avatars',
                    public_id: `avatar_${profile.id}`,
                    resource_type: 'auto',
                    overwrite: true,
                    tags: ['avatar', 'migrated']
                });

                await supabase
                    .from('profiles')
                    .update({ avatar_url: result.secure_url })
                    .eq('id', profile.id);

                totalMigrated++;
                console.log(`  ✅ Uploaded to ${result.secure_url}`);
            } catch (uploadError) {
                console.error(`  ❌ Failed to migrate avatar:`, uploadError);
            }
        }
    }

    console.log(`\nAvatar migration complete! ✅ Total migrated: ${totalMigrated}`);
}

migrateAvatars();
