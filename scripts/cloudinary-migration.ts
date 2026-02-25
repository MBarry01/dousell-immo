import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Configuration Cloudinary
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const IMAGES_DIR = path.join(PUBLIC_DIR, 'images');
const GIF_DIR = path.join(PUBLIC_DIR, 'Gif');
const MAPPING_FILE = path.join(process.cwd(), 'cloudinary-mapping.json');
console.log(`Mapping file will be saved to: ${MAPPING_FILE}`);
const THRESHOLD_BYTES = 1 * 1024 * 1024; // 1MB

interface Mapping {
    [key: string]: {
        cloudinary_url: string;
        public_id: string;
        original_size: number;
    }
}

async function uploadFile(filePath: string, relativePath: string): Promise<{ url: string, public_id: string } | null> {
    try {
        console.log(`Uploading ${relativePath}...`);
        const folder = path.dirname(relativePath).replace(/\\/g, '/');
        const filename = path.basename(relativePath, path.extname(relativePath));

        const result = await cloudinary.uploader.upload(filePath, {
            folder: `doussel/static/${folder}`,
            public_id: filename,
            overwrite: true,
            resource_type: 'auto'
        });

        return {
            url: result.secure_url,
            public_id: result.public_id
        };
    } catch (error) {
        console.error(`Error uploading ${relativePath}:`, error);
        return null;
    }
}

async function migrate() {
    const mapping: Mapping = {};
    if (fs.existsSync(MAPPING_FILE)) {
        Object.assign(mapping, JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf8')));
    }

    const processDir = async (dir: string, baseDir: string) => {
        if (!fs.existsSync(dir)) return;
        const files = fs.readdirSync(dir);

        for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                await processDir(fullPath, baseDir);
                continue;
            }

            const relativePath = path.relative(PUBLIC_DIR, fullPath).replace(/\\/g, '/');
            const publicPath = `/${relativePath}`;

            console.log(`Checking ${publicPath} (${stat.size} bytes)`);
            if (stat.size > THRESHOLD_BYTES) {
                console.log(`File ${publicPath} is larger than threshold.`);
                if (!mapping[publicPath]) {
                    const result = await uploadFile(fullPath, relativePath);
                    if (result) {
                        mapping[publicPath] = {
                            cloudinary_url: result.url,
                            public_id: result.public_id,
                            original_size: stat.size
                        };
                        console.log(`Successfully mapped ${publicPath} to ${result.url}`);
                        // Save mapping incrementally
                        fs.writeFileSync(MAPPING_FILE, JSON.stringify(mapping, null, 2));
                    }
                } else {
                    console.log(`File ${publicPath} already in mapping.`);
                }
            }
        }
    };

    console.log("Starting migration of large assets...");
    await processDir(IMAGES_DIR, IMAGES_DIR);
    await processDir(GIF_DIR, GIF_DIR);
    console.log("Migration complete. Mapping saved to cloudinary-mapping.json");
}

migrate();
