import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function titleToSlug(title) {
    if (!title) return '';
    return title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

async function fixSlugs() {
    console.log("Fetching articles...");
    const { data: articles, error } = await supabase.from('articles').select('id, title, slug');

    if (error) {
        console.error("Error fetching articles:", error);
        return;
    }

    console.log(`Found ${articles.length} articles.`);

    let fixedCount = 0;
    for (const article of articles) {
        const correctSlug = titleToSlug(article.title);

        // Check if the current slug contains spaces or uppercase letters, or just doesn't match the strictly slugified title
        if (article.slug !== correctSlug) {
            console.log(`Fixing slug for article: "${article.title}"\n  Old: ${article.slug}\n  New: ${correctSlug}\n`);
            const { error: updateError } = await supabase
                .from('articles')
                .update({ slug: correctSlug })
                .eq('id', article.id);

            if (updateError) {
                console.error(`Failed to update ${article.id}:`, updateError);
            } else {
                fixedCount++;
            }
        }
    }

    console.log(`\nOperation complete. Fixed ${fixedCount} article slugs.`);
}

fixSlugs();
