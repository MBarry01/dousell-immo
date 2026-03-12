import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

const assetsToUpload = [
    { path: 'C:\\Users\\Barry\\.gemini\\antigravity\\brain\\ec539e3c-d250-42a9-864f-8ca2e5930e5d\\touba_city_1773274436744.png', folder: 'Dousel/static/cities', id: 'touba' },
    { path: 'C:\\Users\\Barry\\.gemini\\antigravity\\brain\\ec539e3c-d250-42a9-864f-8ca2e5930e5d\\ziguinchor_city_1773274452082.png', folder: 'Dousel/static/cities', id: 'ziguinchor' },
    { path: 'C:\\Users\\Barry\\.gemini\\antigravity\\brain\\ec539e3c-d250-42a9-864f-8ca2e5930e5d\\kaolack_city_1773274469906.png', folder: 'Dousel/static/cities', id: 'kaolack' },
    { path: 'C:\\Users\\Barry\\.gemini\\antigravity\\brain\\ec539e3c-d250-42a9-864f-8ca2e5930e5d\\mbour_city_1773274484563.png', folder: 'Dousel/static/cities', id: 'mbour' },
    { path: 'C:\\Users\\Barry\\.gemini\\antigravity\\brain\\ec539e3c-d250-42a9-864f-8ca2e5930e5d\\diourbel_city_1773274498827.png', folder: 'Dousel/static/cities', id: 'diourbel' },
    { path: 'C:\\Users\\Barry\\.gemini\\antigravity\\brain\\ec539e3c-d250-42a9-864f-8ca2e5930e5d\\tambacounda_city_1773274512244.png', folder: 'Dousel/static/cities', id: 'tambacounda' },
    { path: 'C:\\Users\\Barry\\.gemini\\antigravity\\brain\\ec539e3c-d250-42a9-864f-8ca2e5930e5d\\default_senegal_1773274528463.png', folder: 'Dousel/static/cities', id: 'default_senegal' },
];

async function uploadCities() {
    console.log("🚀 Starting missing city images upload to Cloudinary...");

    for (const asset of assetsToUpload) {
        try {
            console.log(`Uploading ${asset.id}...`);
            const result = await cloudinary.uploader.upload(asset.path, {
                folder: asset.folder,
                public_id: asset.id,
                overwrite: true,
                tags: ['static', 'branding', 'cities']
            });
            console.log(`✅ Success: ${asset.id} -> ${result.secure_url}`);
        } catch (e) {
            console.error(`❌ Failed: ${asset.id}`, e);
        }
    }

    console.log("\nDone! ✨");
}

uploadCities();
