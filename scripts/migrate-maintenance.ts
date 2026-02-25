
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

async function migrateMaintenance() {
    console.log("🚀 Starting maintenance migration (Supabase -> Cloudinary)...");

    const { data: requests, error } = await supabase
        .from('maintenance_requests')
        .select('id, photo_urls, quote_url, team_id');

    if (error) {
        console.error("❌ Error fetching maintenance:", error);
        return;
    }

    let totalMigrated = 0;

    for (const req of requests || []) {
        let hasChanged = false;
        const newPhotos: string[] = [];
        let newQuoteUrl = req.quote_url;

        // Photos
        if (req.photo_urls && Array.isArray(req.photo_urls)) {
            for (const url of req.photo_urls) {
                if (url.includes('supabase.co')) {
                    try {
                        console.log(`  Migrating maintenance photo for ${req.id}...`);
                        const result = await cloudinary.uploader.upload(url, {
                            folder: `doussel/teams/${req.team_id || 'unknown'}/maintenance/${req.id}`,
                            resource_type: 'auto',
                            tags: ['maintenance', 'migrated']
                        });
                        newPhotos.push(result.secure_url);
                        hasChanged = true;
                        totalMigrated++;
                    } catch (e) {
                        console.error("  ❌ Photo upload failed:", e);
                        newPhotos.push(url);
                    }
                } else {
                    newPhotos.push(url);
                }
            }
        }

        // Quote
        if (req.quote_url && req.quote_url.includes('supabase.co')) {
            // Check if it's an image
            const isImage = req.quote_url.match(/\.(jpg|jpeg|png|webp|gif)$/i);
            if (isImage) {
                try {
                    console.log(`  Migrating quote image for ${req.id}...`);
                    const result = await cloudinary.uploader.upload(req.quote_url, {
                        folder: `doussel/teams/${req.team_id || 'unknown'}/maintenance/${req.id}/quotes`,
                        resource_type: 'auto',
                        tags: ['quote', 'migrated']
                    });
                    newQuoteUrl = result.secure_url;
                    hasChanged = true;
                    totalMigrated++;
                } catch (e) {
                    console.error("  ❌ Quote upload failed:", e);
                }
            }
        }

        if (hasChanged) {
            await supabase
                .from('maintenance_requests')
                .update({ photo_urls: newPhotos, quote_url: newQuoteUrl })
                .eq('id', req.id);
            console.log(`  ✨ Maintenance ${req.id} updated.`);
        }
    }

    console.log(`\nMaintenance migration complete! ✅ Total migrated: ${totalMigrated}`);
}

migrateMaintenance();
