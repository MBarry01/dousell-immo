
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkDocs() {
    const { data, count, error } = await supabase
        .from('user_documents')
        .select('id, file_path, file_name', { count: 'exact' });

    if (error) {
        console.error("Error fetching docs:", error);
        return;
    }

    console.log(`Total docs: ${count}`);
    let imageCount = 0;
    let supabaseImageCount = 0;

    data?.forEach(d => {
        const isImage = d.file_name?.match(/\.(jpg|jpeg|png|webp|gif)$/i);
        if (isImage) {
            imageCount++;
            // In user_documents, file_path might be a relative path if on Supabase Storage
            // or a full URL if on Cloudinary.
            if (!d.file_path.startsWith('http')) supabaseImageCount++;
        }
    });

    console.log(`Total images in docs: ${imageCount}`);
    console.log(`Images on Supabase Storage: ${supabaseImageCount}`);
}

checkDocs();
