"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { requireAnyRole } from "@/lib/permissions";

/**
 * Approve a property document and verify the specific property
 */
export async function approveProperty(propertyId: string, docId: string) {
    try {
        const supabase = await createClient();

        // Check permissions
        await requireAnyRole(["admin", "superadmin"]);

        // 1. Update property: set verification_status and potentially validation_status
        const { error: propertyError } = await supabase
            .from("properties")
            .update({
                verification_status: "verified",
                // Also approve if still pending
                validation_status: supabase.rpc("CASE WHEN validation_status = 'pending' THEN 'approved' ELSE validation_status END")
            })
            .eq("id", propertyId);

        if (propertyError) {
            console.error("❌ Error updating property:", propertyError);
            return {
                success: false,
                error: `Erreur lors de la mise à jour du bien: ${propertyError.message}`
            };
        }

        // 2.  Update document: mark as certified
        const { error: docError } = await supabase
            .from("user_documents")
            .update({
                is_certified: true,
                source: "verification"
            })
            .eq("id", docId);

        if (docError) {
            console.error("❌ Error updating document:", docError);
            return {
                success: false,
                error: `Erreur lors de la mise à jour du document: ${docError.message}`
            };
        }

        // 3. Revalidate paths
        revalidatePath("/admin/verifications/biens");
        revalidatePath("/admin/moderation");
        revalidatePath(`/biens/${propertyId}`);

        // TODO: Send notification email to owner

        console.log(`✅ Property verified: ${propertyId}, document ${docId}`);

        return {
            success: true,
            message: "Bien vérifié avec succès"
        };
    } catch (error) {
        console.error("❌ approveProperty error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Une erreur est survenue"
        };
    }
}

/**
 * Reject a property document with reason
 */
export async function rejectProperty(propertyId: string, docId: string, reason: string) {
    try {
        const supabase = await createClient();

        // Check permissions
        await requireAnyRole(["admin", "superadmin"]);

        // Update document with rejection info
        const { error: docError } = await supabase
            .from("user_documents")
            .update({
                // Note: Add rejection_reason column if needed
                is_certified: false
            })
            .eq("id", docId);

        if (docError) {
            console.error("❌ Error rejecting property document:", docError);
            return {
                success: false,
                error: `Erreur lors du rejet du document: ${docError.message}`
            };
        }

        // Optionally update property verification_status to indicate rejection
        await supabase
            .from("properties")
            .update({ verification_status: "rejected" })
            .eq("id", propertyId);

        // Revalidate paths
        revalidatePath("/admin/verifications/biens");

        // TODO: Send rejection email to owner with reason

        console.log(`⚠️ Property document rejected: ${propertyId}, document ${docId}. Reason: ${reason}`);

        return {
            success: true,
            message: "Document rejeté"
        };
    } catch (error) {
        console.error("❌ rejectProperty error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Une erreur est survenue"
        };
    }
}

/**
 * Get pending property documents for verification
 */
export async function getPendingPropertyDocuments() {
    try {
        const supabase = await createClient();

        // Check permissions
        await requireAnyRole(["admin", "superadmin"]);

        // Query to find properties with attached documents that need verification
        const { data, error } = await supabase
            .from("properties")
            .select(`
        id,
        title,
        price,
        location,
        images,
        verification_status,
        created_at,
        proof_document_url,
        owner_id,
        profiles:owner_id (
          id,
          full_name,
          phone,
          email
        )
      `)
            .not("proof_document_url", "is", null)
            .or("verification_status.is.null,verification_status.neq.verified")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("❌ Error fetching pending property documents:", error);
            return {
                success: false,
                error: error.message,
                data: []
            };
        }

        // For each property, fetch the actual document details
        const propertiesWithDocs = await Promise.all(
            (data || []).map(async (property) => {
                if (!property.proof_document_url) return null;

                const { data: docData } = await supabase
                    .from("user_documents")
                    .select("*")
                    .eq("id", property.proof_document_url)
                    .eq("certification_scope", "specific")
                    .eq("is_certified", false)
                    .single();

                if (!docData) return null;

                return {
                    ...property,
                    document: docData
                };
            })
        );

        // Filter out nulls
        const validProperties = propertiesWithDocs.filter(p => p !== null);

        return {
            success: true,
            data: validProperties || []
        };
    } catch (error) {
        console.error("❌ getPendingPropertyDocuments error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Une erreur est survenue",
            data: []
        };
    }
}
