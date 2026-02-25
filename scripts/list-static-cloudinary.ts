import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

async function listStatic() {
    try {
        const result = await cloudinary.api.resources({
            type: 'upload',
            prefix: 'doussel/static/',
            max_results: 100
        });
        console.log("--- Static Assets on Cloudinary ---");
        result.resources.forEach((r: any) => {
            console.log(`${r.public_id} -> ${r.secure_url}`);
        });
    } catch (e) {
        console.error(e);
    }
}

listStatic();
