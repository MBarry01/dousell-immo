
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

async function listResources() {
    try {
        console.log("Listing Cloudinary resources...");
        const result = await cloudinary.api.resources({
            type: 'upload',
            prefix: 'doussel/',
            max_results: 50
        });

        console.log(`Found ${result.resources.length} resources in doussel/ folder:`);
        result.resources.forEach((res: any) => {
            console.log(`- ${res.public_id} (${res.secure_url})`);
        });

        const folders = await cloudinary.api.root_folders();
        console.log("\nRoot folders:", folders.folders.map((f: any) => f.name));

    } catch (error) {
        console.error("Error listing resources:", error);
    }
}

listResources();
