"use server";

import { createClient } from "@/utils/supabase/server";

interface OnboardingData {
    // User
    fullName: string;
    email: string;
    phone?: string;
    password: string;

    // Agency
    companyName?: string;
    companyAddress?: string;
    companyPhone?: string;
    companyNinea?: string;
    companyEmail?: string;
    logoUrl?: string;
    signatureUrl?: string;

    // Goals
    teamSize?: string;
}

export async function submitOnboarding(formData: OnboardingData) {
    const supabase = await createClient();

    // 1. Validation basique
    if (!formData.email || !formData.password || !formData.fullName) {
        return { error: "Veuillez remplir tous les champs obligatoires." };
    }

    if (formData.password.length < 6) {
        return { error: "Le mot de passe doit contenir au moins 6 caractères." };
    }

    // 2. Créer le compte utilisateur
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
            data: {
                full_name: formData.fullName,
                phone: formData.phone || null,
                team_size: formData.teamSize || null,
            },
            emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?next=/gestion`,
        },
    });

    if (authError) {
        console.error("Auth Error:", authError);

        // Messages d'erreur en français
        if (authError.message.includes("already registered")) {
            return { error: "Cet email est déjà utilisé. Connectez-vous ou utilisez un autre email." };
        }
        if (authError.message.includes("Password")) {
            return { error: "Le mot de passe doit contenir au moins 6 caractères." };
        }
        if (authError.message.includes("Invalid email")) {
            return { error: "Adresse email invalide." };
        }

        return { error: authError.message };
    }

    if (!authData.user) {
        return { error: "Erreur lors de la création du compte." };
    }

    const userId = authData.user.id;
    const isAutoConfirmed = !!authData.session;

    // 3. Mettre à jour le profil avec TOUTES les infos
    // Le trigger Supabase crée le profil automatiquement, on l'update
    const profileUpdates: Record<string, unknown> = {
        // Infos agence/branding
        company_name: formData.companyName || null,
        company_address: formData.companyAddress || null,
        company_phone: formData.companyPhone || null,
        company_email: formData.companyEmail || null,
        company_ninea: formData.companyNinea || null,

        // Logo et signature
        logo_url: formData.logoUrl || null,
        signature_url: formData.signatureUrl || null,

        // IMPORTANT: Activer la gestion locative pour les inscrits via /commencer
        gestion_locative_enabled: true,
        gestion_locative_status: 'active', // Activation directe (pas de vérification requise pour l'essai)

        updated_at: new Date().toISOString(),
    };

    // Attendre un peu que le trigger crée le profil
    await new Promise(resolve => setTimeout(resolve, 500));

    const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', userId);

    if (profileError) {
        console.error("Profile Update Error:", profileError);
        // On ne fail pas la requête, le compte est créé
        // L'utilisateur pourra configurer plus tard dans /gestion/config
    }

    return {
        success: true,
        userId,
        isAutoConfirmed,
        email: formData.email,
    };
}
