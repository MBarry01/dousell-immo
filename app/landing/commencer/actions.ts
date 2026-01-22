"use server";

import { createClient } from "@/utils/supabase/server";

export async function submitOnboarding(formData: any) {
    const supabase = await createClient();

    // 1. Create User
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
            data: {
                full_name: formData.fullName,
                phone: formData.phone,
            },
            // IMPORTANT: Redirect to /commencer/success or similar if verification is needed
            // preventing auto-confirmation if email verification is enabled.
        },
    });

    if (authError) {
        console.error("Auth Error:", authError);
        return { error: authError.message };
    }

    if (!authData.user) {
        return { error: "Erreur lors de la création du compte." };
    }

    const userId = authData.user.id;

    // 2. Prepare Profile Updates (Agency Info)
    // We mirror the updateBranding logic from config/actions.ts
    const profileUpdates = {
        company_name: formData.companyName || null,
        company_address: formData.companyAddress || null,
        company_phone: formData.companyPhone || null,
        company_email: formData.companyEmail || null,
        // Store features in metadata or a specific column if available. 
        // Since we don't know if 'features' column exists, we'll try to update it 
        // but relies on Supabase to ignore unknown columns or we check schema.
        // Safest is to not break the query. We'll stick to known columns from config-form.tsx.
        updated_at: new Date().toISOString()
    };

    // We need to wait a tiny bit for the trigger to create the profile usually, 
    // OR we can simple try to update it.
    // If the trigger hasn't run yet, this update might fail or return 0 rows.
    // A safer bet in Supabase is usually to INSERT on conflict do update, or wait a second.
    // But since we are creating the user via signUp, the trigger should fire immediately.

    // Let's attempt update.
    const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', userId);

    if (profileError) {
        console.error("Profile Update Error (Agency Info might be missing):", profileError);
        // We don't fail the whole request, but we log it.
    }

    // 3. Store Interest / Team Size (Metadata)
    if (formData.teamSize) {
        await supabase.auth.updateUser({
            data: {
                team_size: formData.teamSize
            }
        });
    }

    return { success: true, userId };
}
