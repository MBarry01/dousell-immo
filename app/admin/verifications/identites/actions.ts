"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { requireAnyRole } from "@/lib/permissions";

/**
 * DEBUG: Get ALL identity documents to see what's in the database
 */
export async function debugGetAllIdentityDocuments() {
    try {
        const supabase = await createClient();
        await requireAnyRole(["admin", "superadmin"]);

        const { data, error } = await supabase
            .from("user_documents")
            .select("*")
            .order("created_at", { ascending: false });

        console.log("📋 ALL user_documents:", data);
        console.log("❌ Error if any:", error);

        return { data, error };
    } catch (error) {
        console.error("Debug error:", error);
        return { data: null, error };
    }
}

/**
 * Approve an identity document and verify user profile globally
 */
export async function approveIdentity(userId: string, docId: string) {
    const timestamp = new Date().toISOString();
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

        // 2. Update document: mark as certified and ensure certification_scope is global
        const { error: docError } = await supabase
            .from("user_documents")
            .update({
                is_certified: true,
                source: "verification",
                certification_scope: "global"
            })
            .eq("id", docId);

        if (docError) {
            console.error("❌ Error updating document:", docError);
            return {
                success: false,
                error: `Erreur lors de la mise à jour du document: ${docError.message}`
            };
        }

        // 2.5. Auto-certify all properties owned by this user
        const { data: updatedProperties, error: propertiesError } = await supabase
            .from("properties")
            .update({ verification_status: "verified" })
            .eq("owner_id", userId)
            .select("id, title");

        if (propertiesError) {
            console.error("⚠️ Error auto-certifying properties:", propertiesError);
        }

        // 3. Revalidate cache - Force aggressive cache invalidation
        revalidatePath("/admin/verifications/identites", "page");
        revalidatePath("/admin/verifications", "layout");
        revalidatePath("/compte/mes-documents", "page");
        revalidatePath("/compte/profil", "page");
        revalidatePath(`/profil/${userId}`, "page");

        return {
            success: true,
            message: "Identité vérifiée avec succès",
            timestamp, // Add timestamp to verify freshness
            serverExecuted: true
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

        revalidatePath("/admin/verifications/identites");

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
 * Revoke identity verification for a user (e.g., if document becomes obsolete)
 */
export async function revokeIdentityVerification(userId: string, reason: string) {
    try {
        const supabase = await createClient();

        // Check permissions
        await requireAnyRole(["admin", "superadmin"]);

        console.log("🔄 Revoking identity verification for user:", userId);

        // 1. Update user profile: set is_identity_verified = false
        const { error: profileError } = await supabase
            .from("profiles")
            .update({ is_identity_verified: false })
            .eq("id", userId);

        if (profileError) {
            console.error("❌ Error revoking profile verification:", profileError);
            return {
                success: false,
                error: `Erreur lors de la révocation du profil: ${profileError.message}`
            };
        }

        console.log("✅ Profile verification revoked - is_identity_verified = false");

        // 2. Mark all identity documents as uncertified
        const { error: docError } = await supabase
            .from("user_documents")
            .update({ is_certified: false })
            .eq("user_id", userId)
            .eq("certification_scope", "global");

        if (docError) {
            console.error("❌ Error uncertifying documents:", docError);
        } else {
            console.log("✅ Identity documents uncertified");
        }

        // 3. Remove verification from all user properties
        console.log("🔄 Removing verification from all user properties...");
        const { data: updatedProperties, error: propertiesError } = await supabase
            .from("properties")
            .update({ verification_status: null })
            .eq("owner_id", userId)
            .eq("verification_status", "verified")
            .select("id, title");

        if (propertiesError) {
            console.error("⚠️ Error removing property verifications:", propertiesError);
        } else {
            console.log(`✅ Removed verification from ${updatedProperties?.length || 0} properties:`,
                updatedProperties?.map(p => p.title).join(", "));
        }

        // 4. Revalidate paths
        revalidatePath("/admin/verifications/identites");
        revalidatePath("/compte/mes-documents");
        revalidatePath("/compte/profil");
        revalidatePath(`/profil/${userId}`);

        console.log(`⚠️ Identity verification revoked for user ${userId}. Reason: ${reason}`);

        return {
            success: true,
            message: "Vérification d'identité révoquée avec succès"
        };
    } catch (error) {
        console.error("❌ revokeIdentityVerification error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Une erreur est survenue"
        };
    }
}

/**
 * Get ALL identity documents for verification (pending, verified, rejected)
 */
export async function getPendingIdentityDocuments() {
    try {
        const supabase = await createClient();

        // Check permissions
        await requireAnyRole(["admin", "superadmin"]);

        // Fetch ALL identity documents (not just uncertified)
        const { data: documents, error: docsError } = await supabase
            .from("user_documents")
            .select("id, user_id, file_name, file_path, file_type, file_size, mime_type, created_at, source, certification_scope, is_certified")
            .eq("certification_scope", "global")
            .order("created_at", { ascending: false });

        if (docsError) {
            console.error("❌ Error fetching pending documents:", docsError);
            return {
                success: false,
                error: docsError.message,
                data: []
            };
        }

        if (!documents || documents.length === 0) {
            return {
                success: true,
                data: []
            };
        }

        // Fetch profiles for each document
        const userIds = [...new Set(documents.map(d => d.user_id))];

        if (userIds.length === 0) {
            console.log("📋 No user IDs to fetch profiles for");
            return {
                success: true,
                data: []
            };
        }

        const { data: profiles, error: profilesError } = await supabase
            .from("profiles")
            .select("id, full_name, phone, is_identity_verified, created_at")
            .in("id", userIds);

        // Note: Supabase sometimes returns {} as error even when successful, ignore it

        // Map profiles to documents and generate signed URLs
        const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

        const documentsWithProfiles = await Promise.all(
            documents.map(async (doc) => {
                // Generate signed URL for the document (2 hours for moderation)
                const { data: urlData } = await supabase.storage
                    .from("verification-docs")
                    .createSignedUrl(doc.file_path, 7200); // 2 hours

                return {
                    id: doc.id,
                    file_name: doc.file_name,
                    file_type: doc.file_type,
                    file_url: urlData?.signedUrl || "",
                    file_size: doc.file_size,
                    uploaded_at: doc.created_at,
                    user_id: doc.user_id,
                    is_certified: doc.is_certified || false,
                    profiles: profilesMap.get(doc.user_id) || {
                        id: doc.user_id,
                        full_name: "Utilisateur inconnu",
                        phone: null,
                        is_identity_verified: false,
                        created_at: doc.created_at
                    }
                };
            })
        );

        return {
            success: true,
            data: documentsWithProfiles
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
