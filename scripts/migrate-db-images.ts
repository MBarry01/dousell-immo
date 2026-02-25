
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

async function migrateImages() {
    console.log("🚀 Starting database images migration (Supabase -> Cloudinary)...");

    // 1. Fetch properties with Supabase images
    const { data: properties, error } = await supabase
        .from('properties')
        .select('id, title, images, team_id');

    if (error) {
        console.error("❌ Error fetching properties:", error);
        return;
    }

    let totalMigrated = 0;
    let totalFailed = 0;

    for (const property of properties || []) {
        if (!property.images || property.images.length === 0) continue;

        const newImages: string[] = [];
        let hasChanged = false;

        console.log(`\nChecking property: ${property.title} (${property.id})`);

        for (const imageUrl of property.images) {
            if (imageUrl.includes('supabase.co')) {
                try {
                    console.log(`  Migrating ${imageUrl}...`);

                    // Use Cloudinary's ability to upload from a URL
                    const teamFolder = `doussel/teams/${property.team_id || 'unknown'}/properties`;
                    const filename = imageUrl.split('/').pop()?.split('?')[0] || `property_${Date.now()}`;
                    const publicId = filename.split('.')[0];

                    const result = await cloudinary.uploader.upload(imageUrl, {
                        folder: teamFolder,
                        public_id: publicId,
                        resource_type: 'auto',
                        overwrite: true,
                        tags: ['property', 'migrated']
                    });

                    newImages.push(result.secure_url);
                    hasChanged = true;
                    totalMigrated++;
                    console.log(`  ✅ Uploaded to ${result.secure_url}`);
                } catch (uploadError) {
                    console.error(`  ❌ Failed to migrate image:`, uploadError);
                    newImages.push(imageUrl); // Keep old URL on failure
                    totalFailed++;
                }
            } else {
                newImages.push(imageUrl);
            }
        }

        if (hasChanged) {
            const { error: updateError } = await supabase
                .from('properties')
                .update({ images: newImages })
                .eq('id', property.id);

            if (updateError) {
                console.error(`  ❌ Error updating property in DB:`, updateError);
            } else {
                console.log(`  ✨ Database updated for property ${property.id}`);
            }
        }
    }

    console.log(`\n\nMigration complete!`);
    console.log(`✅ Total migrated: ${totalMigrated}`);
    console.log(`❌ Total failed: ${totalFailed}`);
}

migrateImages();
