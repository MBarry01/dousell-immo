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
    { path: 'public/images/couverturepay.png', folder: 'doussel/static/banners' },
    { path: 'public/images/dashmock.webp', folder: 'doussel/static/banners' },
    { path: 'public/images/mockpay.png', folder: 'doussel/static/illustrations' },
    { path: 'public/images/mockcomputer.png', folder: 'doussel/static/illustrations' },
    { path: 'public/images/mockcph.png', folder: 'doussel/static/illustrations' },
    { path: 'public/images/paiement.webp', folder: 'doussel/static/features' },
    { path: 'public/images/document.webp', folder: 'doussel/static/features' },
    { path: 'public/images/etat_lieux.webp', folder: 'doussel/static/features' },
    { path: 'public/images/alerte.webp', folder: 'doussel/static/features' },
    { path: 'public/images/compare1.webp', folder: 'doussel/static/comparison' },
    { path: 'public/images/compare2.webp', folder: 'doussel/static/comparison' },

    // Testimonials & People
    { path: 'public/images/amadou_sow.webp', folder: 'doussel/static/images' },
    { path: 'public/images/fatou_ndiaye.jpg', folder: 'doussel/static/images' },
    { path: 'public/images/jean_marc_diouf.webp', folder: 'doussel/static/images' },
    { path: 'public/images/aicha_diallo.webp', folder: 'doussel/static/images' },
    { path: 'public/images/moussa_konate.jpg', folder: 'doussel/static/images' },
    { path: 'public/images/sophie_diop.webp', folder: 'doussel/static/images' },
    { path: 'public/images/cheikh_anta.webp', folder: 'doussel/static/images' },
    { path: 'public/images/anta_faye.webp', folder: 'doussel/static/images' },
    { path: 'public/images/paul_mendy.webp', folder: 'doussel/static/images' },

    // Missing Branding & Modals
    { path: 'public/images/bannerlogin1.png', folder: 'doussel/static/modals' },
    { path: 'public/images/bannerupsell1.png', folder: 'doussel/static/modals' },
    { path: 'public/images/bannerpopup1.png', folder: 'doussel/static/modals' },
    { path: 'public/tabdash.png', folder: 'doussel/static/banners' },
    { path: 'public/images/mockphon.png', folder: 'doussel/static/illustrations' },
    { path: 'public/images/mockcph.png', folder: 'doussel/static/illustrations' },
    { path: 'public/images/mockcomputer.png', folder: 'doussel/static/illustrations' },
    { path: 'public/images/bouton-senegal.png', folder: 'doussel/static/icons' },
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
            const publicId = path.basename(asset.path, path.extname(asset.path));
            console.log(`Uploading ${asset.path} as ${publicId}...`);
            const result = await cloudinary.uploader.upload(fullPath, {
                folder: asset.folder,
                public_id: publicId,
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
