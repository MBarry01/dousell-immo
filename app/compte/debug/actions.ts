'use server';

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function fixMissingProfile(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        console.error("Non connecté");
        return;
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
        return;
    }

    revalidatePath('/compte/debug');
    revalidatePath('/compte');
}
