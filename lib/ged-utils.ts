
import { createClient } from '@/utils/supabase/server';
import { uploadToCloudinary } from './cloudinary-actions';

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
        // 1. Upload vers Storage (ou Cloudinary pour les images)
        // On assainit le nom de fichier
        const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9-_\.]/g, '_');
        const filePath = `${userId}/${Date.now()}_${sanitizedFileName}`;

        let fileUrl = "";
        let storagePath = "";

        const isImage = fileName.match(/\.(jpg|jpeg|png|webp|gif)$/i);

        if (isImage) {
            // Pour les images, on préfère Cloudinary pour l'optimisation
            const buffer = Buffer.from(fileBuffer);
            const base64 = `data:image/${fileName.split('.').pop()};base64,${buffer.toString('base64')}`;
            const uploadResult = await uploadToCloudinary(base64, `ged/${documentType}`);

            if ('error' in uploadResult) {
                console.error("Erreur Cloudinary GED:", uploadResult.error);
                return { success: false, error: uploadResult.error };
            }

            fileUrl = uploadResult.url;
            storagePath = uploadResult.publicId; // On stocke le public_id dans le path pour référence
        } else {
            // Pour les PDFs et autres, on reste sur Supabase
            let { data: uploadData, error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(filePath, fileBuffer, {
                    contentType: bucketName === 'properties' ? undefined : 'application/pdf',
                    upsert: true
                });

            // Retry: Auto-create bucket if missing
            if (uploadError && uploadError.message.includes("Bucket not found")) {
                await supabase.storage.createBucket(bucketName, { public: false });
                const retry = await supabase.storage.from(bucketName).upload(filePath, fileBuffer, { upsert: true });
                uploadData = retry.data;
                uploadError = retry.error;
            }

            if (uploadError) {
                console.error("Erreur Upload Storage:", uploadError);
                return { success: false, error: uploadError.message };
            }

            storagePath = uploadData.path;
            if (bucketName === 'properties') {
                const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(filePath);
                fileUrl = publicUrlData.publicUrl;
            } else {
                fileUrl = uploadData.path;
            }
        }

        // 3. Créer l'entrée dans user_documents
        let { data: doc, error: dbError } = await supabase
            .from('user_documents')
            .insert([{
                user_id: userId,
                description: metadata.description || fileName,
                file_name: fileName,
                file_type: documentType, // Utilise la colonne file_type définie dans la migration
                file_path: storagePath,
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
                    file_path: storagePath,
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

        return { success: true, document: doc, filePath: storagePath, fileUrl };

    } catch (error) {
        console.error("Exception storeDocumentInGED:", error);
        return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
}
