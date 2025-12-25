"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { requireAnyRole } from "@/lib/permissions";

/**
 * Approve an identity document and verify user profile globally
 */
export async function approveIdentity(userId: string, docId: string) {
    try {
        const supabase = await createClient();

        // Check permissions
        await requireAnyRole(["admin", "superadmin"]);

        // 1. Update user profile: set is_identity_verified = true
        const { error: profileError } = await supabase
            .from("profiles")
            .update({ is_identity_verified: true })
            .eq("id", userId);

        if (profileError) {
            console.error("❌ Error updating profile:", profileError);
            return {
                success: false,
                error: `Erreur lors de la mise à jour du profil: ${profileError.message}`
            };
        }

        // 2. Update document: mark as certified
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
        revalidatePath("/admin/verifications/identites");
        revalidatePath("/compte/mes-documents");

        // TODO: Send notification email to user

        console.log(`✅ Identity verified for user ${userId}, document ${docId}`);

        return {
            success: true,
            message: "Identité vérifiée avec succès"
        };
    } catch (error) {
        console.error("❌ approveIdentity error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Une erreur est survenue"
        };
    }
}

/**
 * Reject an identity document with reason
 */
export async function rejectIdentity(userId: string, docId: string, reason: string) {
    try {
        const supabase = await createClient();

        // Check permissions
        await requireAnyRole(["admin", "superadmin"]);

        // Update document with rejection info
        const { error: docError } = await supabase
            .from("user_documents")
            .update({
                // Note: Add rejection_reason column if needed
                // rejection_reason: reason,
                is_certified: false
            })
            .eq("id", docId);

        if (docError) {
            console.error("❌ Error rejecting document:", docError);
            return {
                success: false,
                error: `Erreur lors du rejet du document: ${docError.message}`
            };
        }

        // Revalidate paths
        revalidatePath("/admin/verifications/identites");

        // TODO: Send rejection email to user with reason

        console.log(`⚠️ Identity rejected for user ${userId}, document ${docId}. Reason: ${reason}`);

        return {
            success: true,
            message: "Document rejeté"
        };
    } catch (error) {
        console.error("❌ rejectIdentity error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Une erreur est survenue"
        };
    }
}

/**
 * Get pending identity documents for verification
 */
export async function getPendingIdentityDocuments() {
    try {
        const supabase = await createClient();

        // Check permissions
        await requireAnyRole(["admin", "superadmin"]);

        const { data, error } = await supabase
            .from("user_documents")
            .select(`
        id,
        file_name,
        file_type,
        file_url,
        file_size,
        uploaded_at,
        user_id,
        profiles:user_id (
          id,
          full_name,
          phone,
          email,
          is_identity_verified,
          created_at
        )
      `)
            .eq("certification_scope", "global")
            .eq("is_certified", false)
            .order("uploaded_at", { ascending: true });

        if (error) {
            console.error("❌ Error fetching pending documents:", error);
            return {
                success: false,
                error: error.message,
                data: []
            };
        }

        return {
            success: true,
            data: data || []
        };
    } catch (error) {
        console.error("❌ getPendingIdentityDocuments error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Une erreur est survenue",
            data: []
        };
    }
}
