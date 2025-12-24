"use server";

import { requireAnyRole } from "@/lib/permissions";
import { createAdminClient } from "@/utils/supabase/admin";

export type VerificationRequest = {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyPrice: number;
  propertyImages: string[];
  proofDocumentUrl: string;
  verificationStatus: "pending" | "verified" | "rejected";
  verificationRequestedAt: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
};

export type ReviewVerificationResult = {
  success: boolean;
  error?: string;
};

/**
 * Récupère toutes les demandes de vérification en attente
 * @returns Liste des demandes de vérification avec informations du propriétaire
 */
export async function getPendingVerifications(): Promise<{
  success: boolean;
  data?: VerificationRequest[];
  error?: string;
}> {
  try {
    await requireAnyRole(["admin", "moderateur", "superadmin"]);

    const adminClient = createAdminClient();

    // Récupérer les biens avec vérification en attente
    const { data: properties, error: propertiesError } = await adminClient
      .from("properties")
      .select(
        `
        id,
        title,
        price,
        images,
        proof_document_url,
        verification_status,
        verification_requested_at,
        owner_id,
        profiles:owner_id (
          id,
          full_name,
          email
        )
      `
      )
      .eq("verification_status", "pending")
      .order("verification_requested_at", { ascending: true });

    if (propertiesError) {
      console.error("❌ Error fetching pending verifications:", propertiesError);
      return {
        success: false,
        error: "Erreur lors de la récupération des demandes.",
      };
    }

    // Transformer les données pour inclure les infos du propriétaire
    const verifications: VerificationRequest[] =
      properties?.map((p) => {
        // Gérer le cas où profiles peut être un tableau ou un objet
        const owner = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;

        return {
          id: p.id, // Utiliser l'ID du bien comme ID de vérification
          propertyId: p.id,
          propertyTitle: p.title,
          propertyPrice: p.price,
          propertyImages: (p.images as string[]) || [],
          proofDocumentUrl: p.proof_document_url || "",
          verificationStatus: (p.verification_status as "pending" | "verified" | "rejected") || "pending",
          verificationRequestedAt: p.verification_requested_at || new Date().toISOString(),
          ownerId: p.owner_id,
          ownerName: owner?.full_name || "Propriétaire inconnu",
          ownerEmail: owner?.email || "",
        };
      }) || [];

    return {
      success: true,
      data: verifications,
    };
  } catch (error) {
    console.error("❌ Error in getPendingVerifications:", error);
    return {
      success: false,
      error: "Une erreur inattendue s'est produite.",
    };
  }
}

/**
 * Approuve ou rejette une demande de vérification
 * @param verificationId - ID du bien à vérifier (propertyId)
 * @param status - Statut : "verified" ou "rejected"
 * @param rejectionReason - Raison du rejet (optionnel)
 */
export async function reviewVerification(
  verificationId: string,
  status: "verified" | "rejected",
  rejectionReason?: string
): Promise<ReviewVerificationResult> {
  try {
    await requireAnyRole(["admin", "moderateur", "superadmin"]);

    const adminClient = createAdminClient();

    // Mettre à jour le statut de vérification
    const updateData: {
      verification_status: "verified" | "rejected";
      verification_reviewed_at?: string;
      verification_rejection_reason?: string;
    } = {
      verification_status: status,
      verification_reviewed_at: new Date().toISOString(),
    };

    if (status === "rejected" && rejectionReason) {
      updateData.verification_rejection_reason = rejectionReason;
    }

    const { error: updateError } = await adminClient
      .from("properties")
      .update(updateData)
      .eq("id", verificationId);

    if (updateError) {
      console.error("❌ Error updating verification:", updateError);
      return {
        success: false,
        error: "Erreur lors de la mise à jour du statut.",
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("❌ Error in reviewVerification:", error);
    return {
      success: false,
      error: "Une erreur inattendue s'est produite.",
    };
  }
}
