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
  console.log("🔍 [getPendingVerifications] Début");
  try {
    console.log("🔍 [getPendingVerifications] Vérification des permissions...");
    await requireAnyRole(["admin", "moderateur", "superadmin"]);
    console.log("✅ [getPendingVerifications] Permissions OK");

    console.log("🔍 [getPendingVerifications] Création du client admin...");
    const adminClient = createAdminClient();
    console.log("✅ [getPendingVerifications] Client admin créé");

    // Récupérer les biens avec vérification en attente
    console.log("🔍 [getPendingVerifications] Requête BD pour propriétés pending...");
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
          full_name
        )
      `
      )
      .eq("verification_status", "pending")
      .order("verification_requested_at", { ascending: true });

    console.log("🔍 [getPendingVerifications] Propriétés trouvées:", properties?.length || 0);

    if (propertiesError) {
      console.error("❌ [getPendingVerifications] ERREUR BD:", propertiesError);
      console.error("❌ [getPendingVerifications] Message:", propertiesError.message);
      console.error("❌ [getPendingVerifications] Details:", propertiesError.details);
      console.error("❌ [getPendingVerifications] Code:", propertiesError.code);
      return {
        success: false,
        error: "Erreur lors de la récupération des demandes.",
      };
    }

    // Transformer les données pour inclure les infos du propriétaire + URLs signées
    console.log("🔍 [getPendingVerifications] Transformation des données et génération des URLs...");
    const verifications: VerificationRequest[] = await Promise.all(
      (properties || []).map(async (p, index) => {
        console.log(`🔍 [getPendingVerifications] [${index + 1}/${properties?.length}] Traitement: ${p.title}`);
        // Gérer le cas où profiles peut être un tableau ou un objet
        const owner = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;

        // Récupérer l'email depuis auth.users (profiles n'a pas de colonne email)
        let ownerEmail = "";
        if (p.owner_id) {
          const { data: userData } = await adminClient.auth.admin.getUserById(p.owner_id);
          ownerEmail = userData?.user?.email || "";
        }

        // Générer URL signée pour le document de preuve
        let signedDocUrl = "";
        if (p.proof_document_url) {
          console.log(`   📄 Document path: ${p.proof_document_url}`);
          // Vérifier si c'est déjà une URL complète ou un chemin
          if (p.proof_document_url.startsWith("http://") || p.proof_document_url.startsWith("https://")) {
            console.log("   ℹ️ URL complète détectée");
            signedDocUrl = p.proof_document_url;
          } else {
            console.log("   ℹ️ Génération d'URL signée...");
            // Générer URL signée (1 heure suffit pour l'admin)
            const { data: urlData, error: urlError } = await adminClient.storage
              .from("verification-docs")
              .createSignedUrl(p.proof_document_url, 3600);

            if (urlError) {
              console.error(`   ❌ Erreur génération URL:`, urlError.message);
            } else if (urlData?.signedUrl) {
              console.log(`   ✅ URL signée générée`);
            } else {
              console.warn(`   ⚠️ Aucune URL générée`);
            }
            signedDocUrl = urlData?.signedUrl || "";
          }
        } else {
          console.log(`   ⚠️ Aucun document de preuve`);
        }

        return {
          id: p.id, // Utiliser l'ID du bien comme ID de vérification
          propertyId: p.id,
          propertyTitle: p.title,
          propertyPrice: p.price,
          propertyImages: (p.images as string[]) || [],
          proofDocumentUrl: signedDocUrl,
          verificationStatus: (p.verification_status as "pending" | "verified" | "rejected") || "pending",
          verificationRequestedAt: p.verification_requested_at || new Date().toISOString(),
          ownerId: p.owner_id,
          ownerName: owner?.full_name || "Propriétaire inconnu",
          ownerEmail: ownerEmail,
        };
      })
    );

    console.log(`✅ [getPendingVerifications] ${verifications.length} vérifications transformées`);

    return {
      success: true,
      data: verifications,
    };
  } catch (error) {
    console.error("❌ [getPendingVerifications] EXCEPTION CATCH:", error);
    console.error("❌ [getPendingVerifications] Type:", typeof error);
    console.error("❌ [getPendingVerifications] Message:", error instanceof Error ? error.message : String(error));
    console.error("❌ [getPendingVerifications] Stack:", error instanceof Error ? error.stack : 'N/A');
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
