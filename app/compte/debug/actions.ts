'use server';

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function fixMissingProfile() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Non connecté" };
    }

    const { error } = await supabase
        .from('profiles')
        .upsert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
            avatar_url: user.user_metadata?.avatar_url,
            updated_at: new Date().toISOString(),
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating profile:", error);
        return { error: error.message };
    }

    revalidatePath('/compte/debug');
    revalidatePath('/compte');
    return { success: true };
}
