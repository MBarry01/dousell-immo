'use server'

import { createClient } from "@/utils/supabase/server";
import { internalProcessReminders } from "@/lib/reminders-service";

/**
 * Server Action for Manual Trigger (User Context)
 * Called from UI Button.
 */
export async function processLateReminders() {
    const supabase = await createClient(); // Authenticated user client
    return await internalProcessReminders(supabase);
}
