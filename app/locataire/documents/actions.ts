'use server';

import { revalidatePath } from 'next/cache';
import { getTenantSessionFromCookie } from '@/lib/tenant-magic-link';

/**
 * Upload insurance document for tenant
 * Uses tenant session from cookie (NOT supabase auth)
 */
export async function uploadInsurance(formData: FormData) {
    const file = formData.get('file') as File;
    const leaseId = formData.get('leaseId') as string;

    if (!file || !leaseId) {
        return { error: "Fichier ou bail manquant" };
    }

    // Get tenant session from cookie
    const session = await getTenantSessionFromCookie();

    if (!session) {
        return { error: "Session expirée. Veuillez vous reconnecter." };
    }

    // Verify the lease matches the session
    if (session.lease_id !== leaseId) {
        return { error: "Accès non autorisé" };
    }

    try {
        // Use admin client for storage and DB operations
        const { createClient: createAdminClient } = await import("@supabase/supabase-js");
        const supabaseAdmin = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 1. Upload file to storage
        const fileExt = file.name.split('.').pop();
        const fileName = `insurance_${leaseId}_${Date.now()}.${fileExt}`;

        // Convert File to ArrayBuffer for server-side upload
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { error: uploadError } = await supabaseAdmin.storage
            .from('documents')
            .upload(`insurance/${fileName}`, buffer, {
                contentType: file.type,
                upsert: false
            });

        if (uploadError) {
            console.error("Erreur upload:", uploadError);
            return { error: "Erreur lors de l'envoi du fichier" };
        }

        const { data: { publicUrl } } = supabaseAdmin.storage
            .from('documents')
            .getPublicUrl(`insurance/${fileName}`);

        // 2. Update lease with insurance URL
        const { error: updateError } = await supabaseAdmin
            .from('leases')
            .update({ insurance_url: publicUrl })
            .eq('id', leaseId);

        if (updateError) {
            console.error("Erreur maj bail:", updateError);
            return { error: "Erreur lors de l'enregistrement de l'assurance" };
        }

        revalidatePath('/locataire/documents');
        return { success: true, url: publicUrl };

    } catch (e) {
        console.error(e);
        return { error: "Erreur serveur inattendue" };
    }
}
