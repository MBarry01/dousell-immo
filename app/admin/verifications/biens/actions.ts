"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { requireAnyRole } from "@/lib/permissions";

/**
 * Check if a string is a valid UUID
 */
function isUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
}

/**
 * Approve a property document and verify the specific property
 */
export async function approveProperty(propertyId: string, docId: string) {
    try {
        const supabase = await createClient();

        // Check permissions
        await requireAnyRole(["admin", "superadmin"]);

        // 1. Update property: set verification_status
        const { error: propertyError } = await supabase
            .from("properties")
            .update({
                verification_status: "verified"
            })
            .eq("id", propertyId);

        if (propertyError) {
            console.error("❌ Error updating property:", propertyError);
            return {
                success: false,
                error: `Erreur lors de la mise à jour du bien: ${propertyError.message}`
            };
        }

        // 2. Update document: mark as certified (if it exists in user_documents)
        const { error: docError } = await supabase
            .from("user_documents")
            .update({
                is_certified: true,
                source: "verification"
            })
            .eq("id", docId);

        if (docError) {
            console.log("⚠️ Could not update document (may not exist in user_documents):", docError);
        }

        // 3. Revalidate paths
        revalidatePath("/admin/verifications/biens");
        revalidatePath("/admin/moderation");
        revalidatePath(`/biens/${propertyId}`);

        console.log(`✅ Property verified: ${propertyId}`);

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

        // Update document with rejection info (if it exists)
        await supabase
            .from("user_documents")
            .update({
                is_certified: false,
                rejection_reason: reason
            })
            .eq("id", docId);

        // Update property verification_status to indicate rejection
        await supabase
            .from("properties")
            .update({ verification_status: "rejected" })
            .eq("id", propertyId);

        revalidatePath("/admin/verifications/biens");

        console.log(`⚠️ Property document rejected: ${propertyId}. Reason: ${reason}`);

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
 * Revoke property certification
 */
export async function revokePropertyCertification(propertyId: string, reason: string) {
    try {
        const supabase = await createClient();

        // Check permissions
        await requireAnyRole(["admin", "superadmin"]);

        console.log("🔄 Revoking certification for property:", propertyId);

        // 1. Update property: remove verification
        const { error: propertyError } = await supabase
            .from("properties")
            .update({ verification_status: null })
            .eq("id", propertyId);

        if (propertyError) {
            console.error("❌ Error revoking property certification:", propertyError);
            return {
                success: false,
                error: `Erreur lors de la révocation: ${propertyError.message}`
            };
        }

        console.log("✅ Property certification revoked");

        // 2. Find and uncertify the associated document
        const { data: property } = await supabase
            .from("properties")
            .select("proof_document_url")
            .eq("id", propertyId)
            .single();

        if (property?.proof_document_url) {
            // Try to find document by ID if it's a UUID
            if (isUUID(property.proof_document_url)) {
                await supabase
                    .from("user_documents")
                    .update({
                        is_certified: false,
                        rejection_reason: reason
                    })
                    .eq("id", property.proof_document_url);
                console.log("✅ Document uncertified with reason");
            }
        }

        revalidatePath("/admin/verifications/biens");
        revalidatePath("/");

        console.log(`⚠️ Property certification revoked for ${propertyId}. Reason: ${reason}`);

        return {
            success: true,
            message: "Certification révoquée avec succès"
        };
    } catch (error) {
        console.error("❌ revokePropertyCertification error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Une erreur est survenue"
        };
    }
}

/**
 * Get ALL property documents for verification (pending, verified, rejected)
 */
export async function getPendingPropertyDocuments() {
    try {
        const supabase = await createClient();

        // Check permissions
        await requireAnyRole(["admin", "superadmin"]);

        // Fetch ALL properties with documents (not just pending)
        const { data: properties, error: propsError } = await supabase
            .from("properties")
            .select("id, title, price, location, images, verification_status, created_at, proof_document_url, owner_id")
            .not("proof_document_url", "is", null)
            .order("created_at", { ascending: false });

        if (propsError) {
            console.error("❌ Error fetching properties:", propsError);
            return {
                success: false,
                error: propsError.message,
                data: []
            };
        }

        if (!properties || properties.length === 0) {
            return {
                success: true,
                data: []
            };
        }

        // Fetch profiles for owners
        const uniqueOwnerIds = [...new Set(properties.map(p => p.owner_id).filter(Boolean))];
        const { data: profiles, error: profilesError } = await supabase
            .from("profiles")
            .select("id, full_name, phone, is_identity_verified")
            .in("id", uniqueOwnerIds);

        const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

        // For each property, try to find the document
        const propertiesWithDocs = await Promise.all(
            properties.map(async (property) => {
                if (!property.proof_document_url) return null;

                let docData = null;
                const docId = property.proof_document_url;

                // Case 1: proof_document_url is a UUID (new system)
                if (isUUID(docId)) {
                    const { data } = await supabase
                        .from("user_documents")
                        .select("id, file_name, file_path, file_type, created_at")
                        .eq("id", docId)
                        .single();
                    docData = data;
                }
                // Case 2: proof_document_url is a file path/URL (legacy system)
                else {
                    // Try to find document by file_path
                    const { data } = await supabase
                        .from("user_documents")
                        .select("id, file_name, file_path, file_type, created_at")
                        .eq("file_path", docId)
                        .single();

                    docData = data;

                    // If still not found, create a pseudo-document from the URL
                    if (!docData) {
                        // Extract filename from URL/path
                        const parts = docId.split('/');
                        const fileName = parts[parts.length - 1] || 'document';

                        docData = {
                            id: property.id, // Use property ID as doc ID for approval/rejection
                            file_name: fileName,
                            file_path: docId,
                            file_type: 'titre_propriete',
                            created_at: property.created_at
                        };
                    }
                }

                // TypeScript guard: docData should never be null at this point
                if (!docData) {
                    console.error(`❌ No document data found for property ${property.id}`);
                    return null;
                }

                return {
                    id: property.id,
                    title: property.title,
                    price: property.price,
                    location: property.location,
                    images: property.images,
                    verification_status: property.verification_status,
                    created_at: property.created_at,
                    proof_document_url: property.proof_document_url,
                    owner_id: property.owner_id,
                    profiles: profilesMap.get(property.owner_id) || {
                        id: property.owner_id,
                        full_name: "Propriétaire inconnu",
                        phone: undefined
                    },
                    document: {
                        id: docData.id,
                        file_name: docData.file_name,
                        file_type: docData.file_type,
                        file_url: docData.file_path,
                        uploaded_at: docData.created_at
                    }
                };
            })
        );

        // Filter out nulls
        const validProperties = propertiesWithDocs.filter(p => p !== null);

        console.log(`✅ Found ${validProperties.length} properties with documents to verify`);

        return {
            success: true,
            data: validProperties
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
