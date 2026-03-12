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
    { path: 'C:\\Users\\Barry\\.gemini\\antigravity\\brain\\ec539e3c-d250-42a9-864f-8ca2e5930e5d\\dakar_city_1773273924177.png', folder: 'Dousel/static/cities', id: 'dakar' },
    { path: 'C:\\Users\\Barry\\.gemini\\antigravity\\brain\\ec539e3c-d250-42a9-864f-8ca2e5930e5d\\rufisque_city_1773273938714.png', folder: 'Dousel/static/cities', id: 'rufisque' },
    { path: 'C:\\Users\\Barry\\.gemini\\antigravity\\brain\\ec539e3c-d250-42a9-864f-8ca2e5930e5d\\thies_city_1773273951739.png', folder: 'Dousel/static/cities', id: 'thies' },
    { path: 'C:\\Users\\Barry\\.gemini\\antigravity\\brain\\ec539e3c-d250-42a9-864f-8ca2e5930e5d\\saly_city_1773273965939.png', folder: 'Dousel/static/cities', id: 'saly' },
    { path: 'C:\\Users\\Barry\\.gemini\\antigravity\\brain\\ec539e3c-d250-42a9-864f-8ca2e5930e5d\\saint_louis_city_1773273980007.png', folder: 'Dousel/static/cities', id: 'saint-louis' },
    { path: 'C:\\Users\\Barry\\.gemini\\antigravity\\brain\\ec539e3c-d250-42a9-864f-8ca2e5930e5d\\diamniadio_city_1773273994524.png', folder: 'Dousel/static/cities', id: 'diamniadio' },
];

async function uploadCities() {
    console.log("🚀 Starting city images upload to Cloudinary...");

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
