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

    // Billing
    plan?: string;
    interval?: string;
}

export async function submitOnboarding(formData: OnboardingData, existingUserId?: string | null) {
    const supabase = await createClient();

    let userId: string;
    let isAutoConfirmed = false;

    if (existingUserId) {
        // ===== UTILISATEUR DEJA CONNECTE =====
        // Verifier que l'utilisateur est bien authentifie
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || user.id !== existingUserId) {
            return { error: "Session invalide. Veuillez vous reconnecter." };
        }

        userId = user.id;
        isAutoConfirmed = true;

        // Validation: seul le nom est obligatoire (email/password deja existants)
        if (!formData.fullName) {
            return { error: "Veuillez renseigner votre nom." };
        }

        // Mettre a jour le nom si modifie
        if (formData.fullName !== user.user_metadata?.full_name) {
            await supabase.auth.updateUser({
                data: { full_name: formData.fullName },
            });
        }
    } else {
        // ===== NOUVEAU UTILISATEUR =====
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
                emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://dousel.com'}/auth/callback?next=/gestion`,
            },
        });

        if (authError) {
            console.error("Auth Error:", authError);

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

        userId = authData.user.id;
        isAutoConfirmed = !!authData.session;
    }

    // 3. Mettre à jour le profil (Infos Personnelles uniquement + Flags)
    // Calculate trial end date (14 days from now)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    const profileUpdates: Record<string, unknown> = {
        // IMPORTANT: Activer la gestion locative pour les inscrits via /pro/start
        gestion_locative_enabled: true,
        gestion_locative_status: 'active', // Activation directe
        // NEW: Pro status fields for WORKFLOW_PROPOSAL
        pro_status: 'trial', // Start with trial period
        pro_trial_ends_at: trialEndsAt.toISOString(),
        first_login: false, // Skip /bienvenue since they came via /pro/start
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
    }

    // 4. CRÉATION DE L'ÉQUIPE (Agence)
    // C'est ici qu'on stocke le Branding (Logo, Signature, Nom Agence)
    const companyName = formData.companyName || `${formData.fullName.split(' ')[0]}'s Agency`;
    const slugBase = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'agency';
    const slug = `${slugBase}-${Math.floor(Math.random() * 10000)}`;

    const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .insert({
            name: companyName,
            slug: slug,
            company_address: formData.companyAddress || null,
            company_phone: formData.companyPhone || null,
            company_email: formData.companyEmail || null,
            company_ninea: formData.companyNinea || null,
            logo_url: formData.logoUrl || null,
            signature_url: formData.signatureUrl || null,
            created_by: userId,
            status: 'active',
            // Subscription fields (STANDARD SAAS ONBOARDING: Start with Trial based on chosen plan)
            subscription_tier: formData.plan || 'pro',
            subscription_status: 'trialing',
            subscription_trial_ends_at: trialEndsAt.toISOString(),
            intended_plan: formData.plan || 'pro',
        })
        .select()
        .single();

    if (teamError) {
        console.error("Team Creation Error:", teamError);
        // On continue même si erreur équipe, l'user est créé. Il pourra configurer plus tard.
    } else if (teamData) {
        // 5. Lier l'utilisateur à l'équipe (Owner)
        const { error: memberError } = await supabase
            .from('team_members')
            .insert({
                team_id: teamData.id,
                user_id: userId,
                role: 'owner',
                status: 'active'
            });

        if (memberError) {
            console.error("Team Member Error:", memberError);
        }

        // 6. Associer les biens existants de l'utilisateur à la nouvelle équipe
        // Les biens créés avant l'activation pro ont team_id = NULL
        const { error: propertiesError } = await supabase
            .from('properties')
            .update({ team_id: teamData.id })
            .eq('owner_id', userId)
            .is('team_id', null);

        if (propertiesError) {
            console.error("Properties Association Error:", propertiesError);
        }
    }

    return {
        success: true,
        userId,
        isAutoConfirmed,
        email: formData.email,
    };
}
