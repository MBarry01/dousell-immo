
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

async function migrateInventory() {
    console.log("🚀 Starting Inventory Report migration (Supabase -> Cloudinary)...");

    const { data: reports, error } = await supabase
        .from('inventory_reports')
        .select('*, leases!inner(team_id)');

    if (error) {
        console.error("❌ Error fetching reports:", error);
        return;
    }

    let totalMigrated = 0;

    for (const report of reports || []) {
        let hasChanged = false;
        const teamId = report.leases?.team_id || 'unknown';

        // 1. Migrate Signatures
        if (report.owner_signature && report.owner_signature.includes('supabase.co')) {
            try {
                console.log(`  Migrating owner signature for report ${report.id}...`);
                const result = await cloudinary.uploader.upload(report.owner_signature, {
                    folder: `doussel/teams/${teamId}/inventory/${report.id}/signatures`,
                    tags: ['signature', 'migrated']
                });
                report.owner_signature = result.secure_url;
                hasChanged = true;
                totalMigrated++;
            } catch (e) { console.error("  ❌ owner_signature failed:", e); }
        }

        if (report.tenant_signature && report.tenant_signature.includes('supabase.co')) {
            try {
                console.log(`  Migrating tenant signature for report ${report.id}...`);
                const result = await cloudinary.uploader.upload(report.tenant_signature, {
                    folder: `doussel/teams/${teamId}/inventory/${report.id}/signatures`,
                    tags: ['signature', 'migrated']
                });
                report.tenant_signature = result.secure_url;
                hasChanged = true;
                totalMigrated++;
            } catch (e) { console.error("  ❌ tenant_signature failed:", e); }
        }

        // 2. Migrate Photos inside Rooms JSON
        if (report.rooms && Array.isArray(report.rooms)) {
            for (const room of report.rooms) {
                if (room.items && Array.isArray(room.items)) {
                    for (const item of room.items) {
                        if (item.photos && Array.isArray(item.photos)) {
                            const newPhotos: string[] = [];
                            for (const photoUrl of item.photos) {
                                if (photoUrl.includes('supabase.co')) {
                                    try {
                                        console.log(`  Migrating item photo in room ${room.name} for report ${report.id}...`);
                                        const result = await cloudinary.uploader.upload(photoUrl, {
                                            folder: `doussel/teams/${teamId}/inventory/${report.id}/items`,
                                            tags: ['inventory-item', 'migrated']
                                        });
                                        newPhotos.push(result.secure_url);
                                        hasChanged = true;
                                        totalMigrated++;
                                    } catch (e) {
                                        console.error("  ❌ photo upload failed:", e);
                                        newPhotos.push(photoUrl);
                                    }
                                } else {
                                    newPhotos.push(photoUrl);
                                }
                            }
                            item.photos = newPhotos;
                        }
                    }
                }
            }
        }

        if (hasChanged) {
            const { error: updateError } = await supabase
                .from('inventory_reports')
                .update({
                    owner_signature: report.owner_signature,
                    tenant_signature: report.tenant_signature,
                    rooms: report.rooms
                })
                .eq('id', report.id);

            if (updateError) console.error("  ❌ DB update failed:", updateError);
            else console.log(`  ✨ Report ${report.id} updated in DB.`);
        }
    }

    console.log(`\nInventory migration complete! ✅ Total migrated: ${totalMigrated}`);
}

migrateInventory();
