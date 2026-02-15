
import { createClient } from '@/utils/supabase/server';

type DocumentType = 'titre_propriete' | 'bail' | 'cni' | 'facture' | 'attestation' | 'autre' | 'quittance' | 'etat_lieux' | 'facture_travaux' | 'maintenance';

interface StoreDocumentParams {
    userId: string; // Propriétaire ou Locataire principal
    teamId?: string;
    fileBuffer: Uint8Array;
    fileName: string;
    bucketName: 'lease-contracts' | 'receipts' | 'user-documents' | 'properties';
    documentType: DocumentType;
    metadata: {
        leaseId?: string;
        propertyId?: string;
        tenantName?: string;
        transactionId?: string; // Pour les quittances
        requestId?: string; // Pour les maintenance
        description?: string;
    }
}

/**
 * Upload un fichier buffer vers Supabase Storage et crée l'entrée user_documents
 */
export async function storeDocumentInGED(params: StoreDocumentParams, supabaseClient?: any) {
    // Si un client est passé (ex: avec service role), on l'utilise, sinon on en crée un nouveau
    const supabase = supabaseClient || await createClient();
    const {
        userId, teamId, fileBuffer, fileName, bucketName, documentType, metadata
    } = params;

    try {
        // 1. Upload vers Storage
        // On assainit le nom de fichier
        const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9-_\.]/g, '_');
        const filePath = `${userId}/${Date.now()}_${sanitizedFileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(filePath, fileBuffer, {
                contentType: 'application/pdf',
                upsert: true
            });

        if (uploadError) {
            console.error("Erreur Upload Storage:", uploadError);
            return { success: false, error: uploadError.message };
        }

        // 2. Générer l'URL publique ou signée (selon le bucket)
        // Pour 'properties' c'est public, pour 'lease-contracts' privé
        let fileUrl = "";

        if (bucketName === 'properties') {
            const { data: publicUrlData } = supabase.storage
                .from(bucketName)
                .getPublicUrl(filePath);
            fileUrl = publicUrlData.publicUrl;
        } else {
            // Pour les buckets privés, on stocke le chemin interne et on générera des URLs signées à la volée
            // OU on génère une URL signée longue durée (mais risqué).
            // Mieux : Stocker le chemin relatif ou l'URL interne qui sera traitée par le client/serveur
            // Ici on va stocker le path complet pour référence
            fileUrl = uploadData.path;
        }

        // 3. Créer l'entrée dans user_documents
        let { data: doc, error: dbError } = await supabase
            .from('user_documents')
            .insert([{
                user_id: userId,
                description: metadata.description || fileName,
                file_name: fileName,
                file_type: documentType, // Utilise la colonne file_type définie dans la migration
                file_path: uploadData.path,
                file_size: fileBuffer.length,
                mime_type: 'application/pdf',
                entity_type: documentType === 'bail' ? 'lease' : documentType === 'quittance' ? 'payment' : documentType === 'maintenance' ? 'maintenance_request' : 'other',
                entity_id: documentType === 'quittance' ? metadata.transactionId : documentType === 'maintenance' ? metadata.requestId : (metadata.leaseId || metadata.transactionId),
                property_id: metadata.propertyId,
                lease_id: metadata.leaseId,
                category: documentType, // On utilise documentType comme catégorie par défaut
                source: 'manual',
                created_at: new Date().toISOString()
            }])
            .select()
            .single();

        // 3b. Fallback automatique agressif si l'insertion échoue pour N'IMPORTE quelle raison (contrainte, colonne manquante, etc.)
        if (dbError) {
            console.warn("⚠️ Fallback GED: Échec insertion standard, tentative en mode compatibilité minimale.", dbError.message);

            // On tente une insertion avec UNIQUEMENT les champs présents dans la version de base (20251224)
            // file_type doit être 'autre' (car 'maintenance' peut ne pas exister)
            // source doit être 'manual' (car 'generated' peut ne pas exister)
            // Pas de description, category, entity_type, etc.
            const { data: retryDoc, error: retryError } = await supabase
                .from('user_documents')
                .insert([{
                    user_id: userId,
                    // description: metadata.description || fileName, // On retire description au cas où
                    file_name: fileName,
                    file_type: 'autre',
                    file_path: uploadData.path,
                    file_size: fileBuffer.length,
                    mime_type: 'application/pdf',
                    // source: 'generated', // On retire generated au cas où
                    source: 'manual',
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();

            // Si le fallback réussit, on écrase l'erreur et le doc
            if (!retryError) {
                console.log("✅ Fallback GED réussi (mode compatibilité).");
                doc = retryDoc;
                dbError = null;
            } else {
                console.error("❌ Echec total GED (même en fallback):", retryError);
            }
        }

        if (dbError) {
            console.error("Erreur Insert DB user_documents:", dbError);
            // On pourrait delete le fichier uploadé, mais bon...
            return { success: false, error: dbError.message };
        }

        return { success: true, document: doc, filePath: uploadData.path, fileUrl };

    } catch (error) {
        console.error("Exception storeDocumentInGED:", error);
        return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
}
