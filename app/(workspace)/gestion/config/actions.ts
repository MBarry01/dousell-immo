"use server";

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { invalidateCache } from '@/lib/cache/cache-aside';
import { getUserTeamContext } from '@/lib/team-context';
import { requireTeamPermission } from '@/lib/permissions';

export async function updateBranding(formData: FormData) {
    const { teamId } = await requireTeamPermission("team.settings.edit");
    const supabase = await createClient();

    const updates = {
        name: formData.get('company_name'), // Map company_name -> name
        company_address: formData.get('company_address'),
        company_phone: formData.get('company_phone'),
        company_email: formData.get('company_email'),
        company_ninea: formData.get('company_ninea'),
        updated_at: new Date().toISOString()
    };

    const { error } = await supabase
        .from('teams')
        .update(updates)
        .eq('id', teamId);

    if (!error) {
        // IMPORTANT: Revalider TOUTES les pages qui utilisent le profil/team
        revalidatePath('/gestion/config');
        revalidatePath('/gestion');
    }

    return { success: !error, error: error?.message };
}

/**
 * Met à jour les paramètres de branding Premium de l'utilisateur
 */
export async function updatePremiumBranding(formData: {
    company_name?: string;
    company_address?: string;
    company_phone?: string;
    company_email?: string;
    company_ninea?: string;
}) {
    const { teamId } = await requireTeamPermission("team.settings.edit");
    const supabase = await createClient();

    const updates = {
        name: formData.company_name,
        company_address: formData.company_address || null,
        company_phone: formData.company_phone || null,
        company_email: formData.company_email || null,
        company_ninea: formData.company_ninea || null,
        updated_at: new Date().toISOString()
    };

    const { error } = await supabase
        .from('teams')
        .update(updates)
        .eq('id', teamId);

    if (error) {
        console.error("Erreur mise à jour branding:", error.message);
        return { success: false, error: error.message };
    }

    revalidatePath('/gestion/config');
    return { success: true };
}

/**
 * Upload du logo vers Supabase Storage et mise à jour du profil
 */
export async function uploadLogo(file: File) {
    const { teamId } = await requireTeamPermission("team.settings.edit");
    const supabase = await createClient();

    // Générer un nom de fichier unique avec teamId
    const fileExt = file.name.split('.').pop();
    const fileName = `teams/${teamId}/logo_${Date.now()}.${fileExt}`;

    // Upload vers le bucket 'branding'
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('branding')
        .upload(fileName, file, { upsert: true });

    if (uploadError) {
        console.error("Erreur upload logo:", uploadError.message);
        return { success: false, error: uploadError.message };
    }

    // Obtenir l'URL publique
    const { data: { publicUrl } } = supabase.storage
        .from('branding')
        .getPublicUrl(fileName);

    // Mettre à jour l'équipe
    const { error } = await supabase
        .from('teams')
        .update({ logo_url: publicUrl })
        .eq('id', teamId);

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath('/gestion/config');
    return { success: true, url: publicUrl };
}

/**
 * Upload de la signature vers Supabase Storage et mise à jour du profil
 */
export async function uploadSignature(file: File) {
    const { teamId } = await requireTeamPermission("team.settings.edit");
    const supabase = await createClient();

    const fileExt = file.name.split('.').pop();
    const fileName = `teams/${teamId}/signature_${Date.now()}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('branding')
        .upload(fileName, file, { upsert: true });

    if (uploadError) {
        console.error("Erreur upload signature:", uploadError.message);
        return { success: false, error: uploadError.message };
    }

    const { data: { publicUrl } } = supabase.storage
        .from('branding')
        .getPublicUrl(fileName);

    const { error } = await supabase
        .from('teams')
        .update({ signature_url: publicUrl })
        .eq('id', teamId);

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath('/gestion/config');
    return { success: true, url: publicUrl };
}

/**
 * Récupérer les données de branding de l'utilisateur
 */
export async function getPremiumBranding() {
    try {
        const { user, team } = await getUserTeamContext();

        // Mapper team -> Expected format (fallback to profile if needed)
        const data = {
            full_name: user?.user_metadata?.full_name,
            company_name: team?.name,
            company_address: team?.company_address,
            company_phone: team?.company_phone,
            company_email: team?.company_email,
            company_ninea: team?.company_ninea,
            logo_url: team?.logo_url,
            signature_url: team?.signature_url
        };

        return { success: true, data };
    } catch (err) {
        return { success: false, data: null };
    }
}

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

export async function sendTestEmail(profileData: any) {
    // ✅ CORRECTION SÉCURITÉ: Vérification de permission renforcée
    // Seuls les membres avec permission team.settings.edit peuvent envoyer des emails de test
    const { teamId, user } = await requireTeamPermission("team.settings.edit");
    const supabase = await createClient();

    if (!N8N_WEBHOOK_URL) {
        console.warn('N8N_WEBHOOK_URL non configuré');
        // Fallback simulation for dev environment if no webhook
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { success: true, message: "Simulation (Webhook non configuré)" };
    }

    try {
        // Construct the test payload with user's specific branding
        const payload = {
            type: 'test_email',
            recipientEmail: user.email, // Send to the logged-in user
            ownerName: profileData?.full_name || "Nom Propriétaire",
            companyName: profileData?.company_name || "Nom Agence",
            companyAddress: profileData?.company_address || "Adresse Agence",
            companyLogo: profileData?.logo_url || "",
            companySignature: profileData?.signature_url || "",
            // Add dummy data for template preview
            tenantName: "Jean Dupont (Exemple)",
            amount: 150000,
            month: new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
        };

        const response = await fetch(`${N8N_WEBHOOK_URL}/generate-lease-pdf`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`Webhook error: ${response.status}`);
        }

        return { success: true };
    } catch (error) {
        console.error('Erreur envoi test:', error);
        return { success: false, error: "Erreur lors de l'envoi" };
    }
}
