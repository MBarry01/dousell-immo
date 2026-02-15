
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing env vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanBadDocs() {
    // 1. Lister les documents maintenance suspects dans user_documents
    const { data: docs, error } = await supabase
        .from('user_documents')
        .select('id, file_name, file_path, file_size, entity_type')
        .eq('entity_type', 'maintenance');

    if (error) {
        console.error("Erreur list:", error);
        return;
    }

    console.log(`Trouvé ${docs.length} documents de maintenance dans user_documents.`);

    // Identifier ceux qui sont "vides" ou invalides
    // Critères : file_size = 0 et file_path ne contient pas de nom de fichier valide ou pointant vers un dossier
    const badDocs = docs.filter(d => d.file_size === 0 || d.file_path === 'undefined' || d.file_path === 'null' || !d.file_path);

    console.log(`${badDocs.length} documents suspects à supprimer.`);

    if (badDocs.length > 0) {
        const ids = badDocs.map(d => d.id);
        const { error: delError } = await supabase
            .from('user_documents')
            .delete()
            .in('id', ids);

        if (delError) console.error("Erreur suppression:", delError);
        else console.log("Suppression effectuée avec succès.");
    }
}

cleanBadDocs();
