"use server";

import { createClient } from "@/utils/supabase/server";
import { requireAnyRole } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

export type LeadStatus = "nouveau" | "contacté" | "clos";

export interface Lead {
  id: string;
  full_name: string;
  phone: string;
  project_type: string;
  availability: string;
  message: string;
  status: LeadStatus;
  property_id: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Récupère tous les leads, triés par statut (nouveaux en premier) puis par date
 */
export async function getLeads(): Promise<Lead[]> {
  await requireAnyRole();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false }); // Plus récents en premier

  // Trier manuellement pour avoir "nouveau" en premier
  if (data) {
    const statusOrder: Record<string, number> = {
      nouveau: 0,
      contacté: 1,
      clos: 2,
    };
    data.sort((a, b) => {
      const statusDiff = (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
      if (statusDiff !== 0) return statusDiff;
      // Si même statut, trier par date (plus récent en premier)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }

  if (error) {
    console.error("❌ Error fetching leads:", {
      errorObject: error,
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      fullError: JSON.stringify(error),
    });
    return [];
  }

  return (data || []) as Lead[];
}

/**
 * Met à jour le statut d'un lead
 */
export async function updateLeadStatus(
  leadId: string,
  status: LeadStatus
): Promise<{ success: boolean; error?: string }> {
  await requireAnyRole();
  const supabase = await createClient();

  const { error } = await supabase
    .from("leads")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", leadId);

  if (error) {
    console.error("Error updating lead status:", error);
    return {
      success: false,
      error: "Impossible de mettre à jour le statut.",
    };
  }

  revalidatePath("/admin/leads");
  revalidatePath("/admin");
  return { success: true };
}

