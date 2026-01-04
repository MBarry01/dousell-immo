"use server";

import { createClient } from "@/utils/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { revalidatePath } from "next/cache";

export type UserRole = "admin" | "moderateur" | "agent";

/**
 * Accorde un rôle via une fonction SQL (bypass RLS)
 */
export async function grantRoleViaFunction(
  userId: string,
  role: UserRole
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  const supabase = await createClient();

  try {
    // Utiliser une fonction SQL pour bypass RLS
    const { data, error } = await supabase.rpc("grant_user_role", {
      target_user_id: userId,
      role_to_grant: role,
    });

    if (error) {
      console.error("Error granting role via function:", error);
      return {
        success: false,
        error: `Erreur: ${error.message || "Impossible d'accorder le rôle"}`,
      };
    }

    revalidatePath("/admin/roles");
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Error in grantRoleViaFunction:", error);
    return {
      success: false,
      error: `Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
    };
  }
}




