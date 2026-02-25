import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

const assetsToUpload = [
    // Logos
    { path: 'public/Logo.svg', folder: 'doussel/static/logos' },
    { path: 'public/Logo_black.svg', folder: 'doussel/static/logos' },
    { path: 'public/LogoOr1.png', folder: 'doussel/static/logos' },
    { path: 'public/Logo_black.png', folder: 'doussel/static/logos' },
    { path: 'public/logoJnOr.png', folder: 'doussel/static/logos' },
    { path: 'public/logoWhite.png', folder: 'doussel/static/logos' },
    { path: 'public/monument.png', folder: 'doussel/static/banners' },

    // Icons
    { path: 'public/icons/icon-192.png', folder: 'doussel/static/icons' },
    { path: 'public/images/wave.png', folder: 'doussel/static/icons' },
    { path: 'public/images/om.png', folder: 'doussel/static/icons' },
    { path: 'public/images/CB.png', folder: 'doussel/static/icons' },

    // Banners & Heavy Illustrations
    { path: 'public/images/herobg.webp', folder: 'doussel/static/banners' },
    { path: 'public/images/CouverturePay.png', folder: 'doussel/static/banners' },
    { path: 'public/images/DashMock.webp', folder: 'doussel/static/banners' },
    { path: 'public/images/mockpay.png', folder: 'doussel/static/illustrations' },
    { path: 'public/images/mockComputer.png', folder: 'doussel/static/illustrations' },
    { path: 'public/images/mockCPh.png', folder: 'doussel/static/illustrations' },
    { path: 'public/images/Paiement.webp', folder: 'doussel/static/features' },
    { path: 'public/images/document.webp', folder: 'doussel/static/features' },
    { path: 'public/images/Etat_Lieux.webp', folder: 'doussel/static/features' },
    { path: 'public/images/alerte.webp', folder: 'doussel/static/features' },
    { path: 'public/images/compare1.webp', folder: 'doussel/static/comparison' },
    { path: 'public/images/compare2.webp', folder: 'doussel/static/comparison' },

    // Testimonials (Those not already migrated if any)
    { path: 'public/images/Anta Faye.webp', folder: 'doussel/static/testimonials' },
];

async function uploadStaticAssets() {
    console.log("🚀 Starting static assets upload...");

    for (const asset of assetsToUpload) {
        const fullPath = path.resolve(process.cwd(), asset.path);
        if (!fs.existsSync(fullPath)) {
            console.log(`⚠️ Skip: ${asset.path} (not found)`);
            continue;
        }

        try {
            console.log(`Uploading ${asset.path}...`);
            const result = await cloudinary.uploader.upload(fullPath, {
                folder: asset.folder,
                use_filename: true,
                unique_filename: false,
                overwrite: true,
                tags: ['static', 'branding']
            });
            console.log(`✅ Success: ${asset.path} -> ${result.secure_url}`);
        } catch (e) {
            console.error(`❌ Failed: ${asset.path}`, e);
        }
    }

    console.log("\nDone! ✨");
}

uploadStaticAssets();
