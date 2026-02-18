"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { uploadListingProof } from "./upload-proof";

const _verificationSchema = z.object({
  propertyId: z.string().min(1, "ID du bien requis"),
  proofDocumentUrl: z.string().min(1, "URL du document requise"),
});

export type VerificationSubmitResult = {
  success: boolean;
  error?: string;
  data?: {
    propertyId: string;
    verificationStatus: string;
  };
};

/**
 * Soumet une demande de vérification pour un bien immobilier
 * @param propertyId - ID du bien à vérifier
 * @param proofFile - Fichier de preuve (document PDF, image, etc.)
 */
export async function submitListingVerification(
  propertyId: string,
  proofFile: File
): Promise<VerificationSubmitResult> {
  try {
    const supabase = await createClient();

    // Vérifier que l'utilisateur est connecté
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "Vous devez être connecté pour soumettre une vérification.",
      };
    }

    // Vérifier que le bien appartient à l'utilisateur (ownership)
    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select("owner_id")
      .eq("id", propertyId)
      .single();

    if (propertyError || !property) {
      return {
        success: false,
        error: "Bien introuvable.",
      };
    }

    if (property.owner_id !== user.id) {
      return {
        success: false,
        error: "Vous n'êtes pas propriétaire de ce bien.",
      };
    }

    // Upload du document de preuve
    const formData = new FormData();
    formData.append("proof", proofFile);
    const uploadResult = await uploadListingProof(formData);

    if (!uploadResult.success || !uploadResult.data?.url) {
      return {
        success: false,
        error: uploadResult.error || "Échec de l'upload du document.",
      };
    }

    // Mettre à jour le bien avec le statut de vérification et l'URL du document
    const { error: updateError } = await supabase
      .from("properties")
      .update({
        verification_status: "pending",
        proof_document_url: uploadResult.data.url,
        verification_requested_at: new Date().toISOString(),
      })
      .eq("id", propertyId);

    if (updateError) {
      console.error("❌ Error updating property verification:", updateError);
      return {
        success: false,
        error: "Erreur lors de la mise à jour du bien.",
      };
    }

    // Revalidation des chemins
    revalidatePath(`/compte/biens/${propertyId}`);
    revalidatePath("/admin");

    return {
      success: true,
      data: {
        propertyId,
        verificationStatus: "pending",
      },
    };
  } catch (error) {
    console.error("❌ Error in submitListingVerification:", error);
    return {
      success: false,
      error: "Une erreur inattendue s'est produite.",
    };
  }
}
