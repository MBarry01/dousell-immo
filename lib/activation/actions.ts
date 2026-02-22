"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function completeActivation(teamId: string) {
  const supabase = await createClient();

  await supabase
    .from("teams")
    .update({ activation_completed_at: new Date().toISOString() })
    .eq("id", teamId);

  revalidatePath("/gestion", "layout");
}
