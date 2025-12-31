'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function uploadInsurance(formData: FormData) {
    const file = formData.get('file') as File;
    const leaseId = formData.get('leaseId') as string;

    if (!file || !leaseId) {
        return { error: "Fichier ou bail manquant" };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Non authentifié" };

    try {
        // 1. Upload du fichier
        const fileExt = file.name.split('.').pop();
        const fileName = `insurance_${leaseId}_${Date.now()}.${fileExt}`;

        // Utilisation du bucket 'documents' (à créer si inexistant, ou 'leases'/'properties')
        // On suppose 'documents' pour les docs locataires
        const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(`insurance/${fileName}`, file);

        if (uploadError) {
            console.error("Erreur upload:", uploadError);
            return { error: "Erreur lors de l'envoi du fichier" };
        }

        const { data: { publicUrl } } = supabase.storage
            .from('documents')
            .getPublicUrl(`insurance/${fileName}`);

        // 2. Mise à jour du bail (besoin des droits d'écriture sur leases -> Admin Client souvent nécessaire si RLS strictes sur update)
        // Les locataires n'ont généralement PAS le droit d'update leur bail directement (seul le proprio ou admin).
        // On utilise donc supabaseAdmin.

        const { createClient: createAdminClient } = await import("@supabase/supabase-js");
        const supabaseAdmin = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { error: updateError } = await supabaseAdmin
            .from('leases')
            .update({ insurance_url: publicUrl })
            .eq('id', leaseId);

        if (updateError) {
            console.error("Erreur maj bail:", updateError);
            return { error: "Erreur lors de l'enregistrement de l'assurance" };
        }

        revalidatePath('/portal/documents');
        return { success: true, url: publicUrl };

    } catch (e) {
        console.error(e);
        return { error: "Erreur serveur inattendue" };
    }
}
