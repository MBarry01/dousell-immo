"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

type DocumentType =
  | "titre_propriete"
  | "bail"
  | "cni"
  | "passport"
  | "facture"
  | "attestation"
  | "autre";

export interface UserDocument {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  mime_type: string;
  source: string;
  certification_scope: string | null;
  property_id: string | null;
  lease_id: string | null;
  category: string | null;
  created_at: string;
  updated_at: string;
  is_certified?: boolean;
  description?: string;
  entity_type?: string;
  entity_id?: string;
}

export interface GEDDocument extends UserDocument {
  name: string;
  url: string;
  property_title: string;
  tenant_name: string | null;
  uploaded_at: string | null;
  is_virtual?: boolean;
  virtual_type?: string;
  virtual_data?: Record<string, any>;
}

/**
 * Upload un document dans le coffre-fort personnel de l'utilisateur
 */
export async function uploadDocument(formData: FormData) {
  const supabase = await createClient();

  console.log("🔍 [uploadDocument] Début de l'upload");

  // Vérifier l'authentification
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  console.log("🔍 [uploadDocument] User:", user?.id, "Auth Error:", authError?.message);

  if (authError || !user) {
    console.error("❌ [uploadDocument] Non authentifié:", authError);
    return { success: false, error: "Non authentifié" };
  }

  try {
    const file = formData.get("file") as File;
    const type = formData.get("type") as DocumentType;

    console.log("🔍 [uploadDocument] File:", file?.name, "Type:", type, "Size:", file?.size);

    if (!file || !type) {
      console.error("❌ [uploadDocument] Fichier ou type manquant");
      return { success: false, error: "Fichier ou type manquant" };
    }

    // Valider la taille (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      console.error("❌ [uploadDocument] Fichier trop volumineux:", file.size);
      return { success: false, error: "Le fichier ne doit pas dépasser 10 MB" };
    }

    // Valider le type de fichier
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      console.error("❌ [uploadDocument] Type non autorisé:", file.type);
      return { success: false, error: "Type de fichier non autorisé (PDF, JPG, PNG uniquement)" };
    }

    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-z0-9.]/gi, "_").toLowerCase();
    const fileName = `${user.id}/${type}/${timestamp}_${sanitizedFileName}`;

    console.log("🔍 [uploadDocument] fileName généré:", fileName);

    // Upload vers Supabase Storage
    console.log("📤 [uploadDocument] Upload vers Storage bucket verification-docs...");
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("verification-docs")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("❌ [uploadDocument] Upload Storage error:", uploadError);
      return { success: false, error: `Erreur Storage: ${uploadError.message}` };
    }

    console.log("✅ [uploadDocument] Upload Storage réussi:", uploadData?.path);

    // Obtenir l'URL publique signée (valide 1 an)
    const { data: urlData } = await supabase.storage
      .from("verification-docs")
      .createSignedUrl(fileName, 31536000); // 1 an en secondes

    console.log("🔍 [uploadDocument] URL signée générée:", urlData?.signedUrl ? "OK" : "KO");

    // Enregistrer les métadonnées en base de données
    console.log("💾 [uploadDocument] Insertion dans user_documents...");
    // Déterminer le scope de certification selon le type de document
    const certificationScope = (type === 'cni' || type === 'passport') ? 'global' : 'specific';

    const insertData = {
      user_id: user.id,
      file_name: file.name,
      file_path: fileName,
      file_type: type,
      file_size: file.size,
      mime_type: file.type,
      source: "manual",
      certification_scope: certificationScope,
      property_id: formData.get("propertyId") ? String(formData.get("propertyId")) : null,
      lease_id: formData.get("leaseId") ? String(formData.get("leaseId")) : null,
      category: formData.get("category") ? String(formData.get("category")) : null,
    };
    console.log("🔍 [uploadDocument] Data à insérer:", insertData);

    const { error: dbError } = await supabase.from("user_documents").insert(insertData);

    if (dbError) {
      console.error("❌ [uploadDocument] Database error:", dbError);
      console.error("❌ [uploadDocument] Error details:", {
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint,
        code: dbError.code,
      });
      // Supprimer le fichier uploadé si l'insertion DB échoue
      await supabase.storage.from("verification-docs").remove([fileName]);
      return { success: false, error: `Erreur DB: ${dbError.message}` };
    }

    console.log("✅ [uploadDocument] Insertion DB réussie");

    revalidatePath("/compte/mes-documents");

    // Notifier l'admin si c'est un document d'identité (CNI/Passeport)
    if (type === 'cni' || type === 'passport') {
      const { notifyAdmin } = await import("@/lib/notifications");
      await notifyAdmin({
        type: "info",
        title: "Vérification d'identité",
        message: `Nouveau document d'identité (${type}) téléchargé par ${user.email}`,
        resourcePath: `/admin/verifications/identites?highlight=${user.id}`
      });
    }

    console.log("🎉 [uploadDocument] Upload terminé avec succès!");

    return {
      success: true,
      data: {
        fileName,
        url: urlData?.signedUrl,
      },
    };
  } catch (error) {
    console.error("❌ [uploadDocument] Exception:", error);
    return { success: false, error: `Erreur interne: ${error}` };
  }
}

/**
 * Récupérer les documents manuels de l'utilisateur
 */
export async function getMyDocuments() {
  const supabase = await createClient();

  console.log("🔍 [getMyDocuments] Début");

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  console.log("🔍 [getMyDocuments] User:", user?.id);

  if (authError || !user) {
    console.error("❌ [getMyDocuments] Non authentifié");
    return { success: false, error: "Non authentifié" };
  }

  try {
    const { data: documents, error } = await supabase
      .from("user_documents")
      .select("*")
      .eq("user_id", user.id)
      .eq("source", "manual")
      .order("created_at", { ascending: false });

    console.log("🔍 [getMyDocuments] Documents trouvés:", documents?.length || 0);
    console.log("🔍 [getMyDocuments] Error:", error);

    if (error) {
      console.error("❌ [getMyDocuments] DB error:", error);
      return { success: false, error: "Erreur lors de la récupération" };
    }

    // Générer les URLs signées pour chaque document
    const documentsWithUrls = await Promise.all(
      (documents || []).map(async (doc) => {
        const { data: urlData } = await supabase.storage
          .from("verification-docs")
          .createSignedUrl(doc.file_path, 604800); // 7 jours

        return {
          id: doc.id,
          name: doc.file_name,
          type: doc.file_type,
          size: doc.file_size,
          url: urlData?.signedUrl || "",
          uploaded_at: doc.created_at,
          source: "manual" as const,
          certification_scope: doc.certification_scope || "specific",
          is_certified: doc.is_certified || false,
        };
      })
    );

    console.log("✅ [getMyDocuments] Retour:", documentsWithUrls.length, "documents");

    return { success: true, data: documentsWithUrls };
  } catch (error) {
    console.error("❌ [getMyDocuments] Exception:", error);
    return { success: false, error: "Erreur interne" };
  }
}

/**
 * Récupérer les documents de certification (annonces certifiées)
 */
export async function getVerificationDocuments() {
  const supabase = await createClient();

  console.log("🔍 [getVerificationDocuments] Début");

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  console.log("🔍 [getVerificationDocuments] User:", user?.id);

  if (authError || !user) {
    console.error("❌ [getVerificationDocuments] Non authentifié");
    return { success: false, error: "Non authentifié" };
  }

  try {
    // 1. Récupérer les documents d'identité certifiés (global scope)
    const { data: identityDocs, error: identityError } = await supabase
      .from("user_documents")
      .select("*")
      .eq("user_id", user.id)
      .eq("certification_scope", "global")
      .eq("is_certified", true)
      .order("created_at", { ascending: false });

    console.log("🔍 [getVerificationDocuments] Identity docs trouvés:", identityDocs?.length || 0);

    if (identityError) {
      console.error("❌ [getVerificationDocuments] Identity docs error:", identityError);
    }

    // 2. Récupérer les annonces de l'utilisateur qui sont certifiées et ont un document de preuve
    const { data: properties, error: propertiesError } = await supabase
      .from("properties")
      .select("id, title, proof_document_url, verification_requested_at")
      .eq("owner_id", user.id)
      .eq("verification_status", "verified")
      .not("proof_document_url", "is", null);

    console.log("🔍 [getVerificationDocuments] Properties trouvées:", properties?.length || 0);

    if (propertiesError) {
      console.error("❌ [getVerificationDocuments] DB error:", propertiesError);
      return { success: false, error: "Erreur lors de la récupération" };
    }

    // Générer les URLs signées pour chaque document d'identité certifié
    const identityDocsWithUrls = await Promise.all(
      (identityDocs || []).map(async (doc) => {
        const { data: urlData } = await supabase.storage
          .from("verification-docs")
          .createSignedUrl(doc.file_path, 604800); // 7 jours

        return {
          id: doc.id,
          name: doc.file_name,
          type: doc.file_type,
          size: doc.file_size,
          url: urlData?.signedUrl || "",
          uploaded_at: doc.created_at,
          source: "verification" as const,
          certification_scope: "global", // Documents d'identité
          is_certified: true,
        };
      })
    );

    // Générer les URLs signées pour chaque document de certification de propriété
    const propertyDocsWithUrls = await Promise.all(
      (properties || []).map(async (property) => {
        // Extraire le chemin du fichier depuis l'URL du document
        const documentPath = property.proof_document_url;

        console.log("🔍 [getVerificationDocuments] Processing property:", property.title, "Path:", documentPath);

        if (!documentPath) {
          console.warn("⚠️ [getVerificationDocuments] Pas de document path pour:", property.title);
          return null;
        }

        let finalUrl = "";

        // Vérifier si documentPath est déjà une URL complète (commence par http)
        if (documentPath.startsWith("http://") || documentPath.startsWith("https://")) {
          console.log("🔍 [getVerificationDocuments] documentPath est déjà une URL complète");
          finalUrl = documentPath;
        } else {
          // C'est un chemin relatif, générer l'URL signée (7 jours)
          console.log("🔍 [getVerificationDocuments] Génération d'URL signée pour:", documentPath);
          const { data: urlData, error: urlError } = await supabase.storage
            .from("verification-docs")
            .createSignedUrl(documentPath, 604800); // 7 jours

          if (urlError) {
            console.error("❌ [getVerificationDocuments] URL error:", urlError, "for:", documentPath);
            console.warn("⚠️ [getVerificationDocuments] Le fichier n'existe peut-être pas dans le storage");
          } else {
            finalUrl = urlData?.signedUrl || "";
            console.log("🔍 [getVerificationDocuments] URL générée:", finalUrl ? "OK" : "KO");
          }
        }

        return {
          id: property.id,
          name: `Certification - ${property.title}`,
          type: "certification",
          size: 0, // Pas de taille stockée
          url: finalUrl,
          uploaded_at: property.verification_requested_at || new Date().toISOString(),
          source: "verification" as const,
          certification_scope: "specific", // Documents de certification de biens
          is_certified: true, // Déjà certifiés
        };
      })
    );

    // Combiner tous les documents (identité + propriétés)
    const allDocuments = [...identityDocsWithUrls, ...propertyDocsWithUrls];

    // Filtrer les documents null ET ceux avec des URLs vides (fichiers manquants)
    const validDocuments = allDocuments.filter((doc) => {
      if (doc === null) return false;
      if (!doc.url || doc.url === "") {
        console.warn("⚠️ [getVerificationDocuments] Document ignoré car URL vide:", doc.name);
        console.warn("   Le fichier de certification est probablement manquant dans le storage");
        return false;
      }
      return true;
    });

    console.log("✅ [getVerificationDocuments] Documents valides:", validDocuments.length);
    console.log("   - Documents d'identité:", identityDocsWithUrls.length);
    console.log("   - Documents de propriétés:", propertyDocsWithUrls.filter(d => d !== null && d.url).length);

    return { success: true, data: validDocuments };
  } catch (error) {
    console.error("❌ [getVerificationDocuments] Exception:", error);
    return { success: false, error: "Erreur interne" };
  }
}

/**
 * Régénérer l'URL signée pour un document (en cas d'expiration)
 */
export async function refreshDocumentUrl(documentId: string, source: "manual" | "verification") {
  const supabase = await createClient();

  console.log("🔄 [refreshDocumentUrl] Début - documentId:", documentId, "source:", source);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("❌ [refreshDocumentUrl] Non authentifié");
    return { success: false, error: "Non authentifié" };
  }

  try {
    let filePath: string | null = null;

    if (source === "manual") {
      // Récupérer le document manuel
      const { data: document, error: getError } = await supabase
        .from("user_documents")
        .select("file_path")
        .eq("id", documentId)
        .eq("user_id", user.id)
        .eq("source", "manual")
        .single();

      if (getError || !document) {
        console.error("❌ [refreshDocumentUrl] Document non trouvé:", getError);
        return { success: false, error: "Document non trouvé" };
      }

      filePath = document.file_path;
    } else {
      // Récupérer le document de certification depuis la table properties
      const { data: property, error: getError } = await supabase
        .from("properties")
        .select("proof_document_url, owner_id")
        .eq("id", documentId)
        .eq("verification_status", "verified")
        .single();

      if (getError || !property) {
        console.error("❌ [refreshDocumentUrl] Property non trouvée:", getError);
        return { success: false, error: "Document non trouvé" };
      }

      // Vérifier que l'utilisateur possède la propriété
      if (property.owner_id !== user.id) {
        console.error("❌ [refreshDocumentUrl] Accès refusé - utilisateur ne possède pas la propriété");
        return { success: false, error: "Accès refusé" };
      }

      filePath = property.proof_document_url;
    }

    if (!filePath) {
      return { success: false, error: "Chemin du fichier introuvable" };
    }

    // Générer une nouvelle URL signée (7 jours)
    const { data: urlData, error: urlError } = await supabase.storage
      .from("verification-docs")
      .createSignedUrl(filePath, 604800); // 7 jours

    if (urlError || !urlData?.signedUrl) {
      console.error("❌ [refreshDocumentUrl] Erreur génération URL:", urlError);
      return { success: false, error: "Erreur lors de la génération de l'URL" };
    }

    console.log("✅ [refreshDocumentUrl] URL régénérée avec succès");

    return {
      success: true,
      data: {
        url: urlData.signedUrl,
      },
    };
  } catch (error) {
    console.error("❌ [refreshDocumentUrl] Exception:", error);
    return { success: false, error: "Erreur interne" };
  }
}

/**
 * Supprimer un document manuel
 */
export async function deleteDocument(documentId: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Non authentifié" };
  }

  try {
    // Récupérer le document pour vérifier la propriété et obtenir le chemin
    const { data: document, error: getError } = await supabase
      .from("user_documents")
      .select("*")
      .eq("id", documentId)
      .eq("user_id", user.id)
      .eq("source", "manual") // On ne peut supprimer que les documents manuels
      .single();

    if (getError || !document) {
      return { success: false, error: "Document non trouvé" };
    }

    // Supprimer le fichier du storage
    const { error: storageError } = await supabase.storage
      .from("verification-docs")
      .remove([document.file_path]);

    if (storageError) {
      console.error("Storage delete error:", storageError);
      // Continue quand même pour supprimer l'entrée DB
    }

    // Supprimer l'entrée de la base de données
    const { error: dbError } = await supabase
      .from("user_documents")
      .delete()
      .eq("id", documentId);

    if (dbError) {
      console.error("Database delete error:", dbError);
      return { success: false, error: "Erreur lors de la suppression" };
    }

    revalidatePath("/compte/mes-documents");

    return { success: true };
  } catch (error) {
    console.error("Delete document error:", error);
    return { success: false, error: "Erreur interne" };
  }
}

/**
 * Récupérer les documents de gestion locative (GED)
 */
/**
 * Récupérer les documents de gestion locative (GED)
 * Agrège:
 * 1. Documents uploadés manuellement (user_documents)
 * 2. Quittances de loyer (rental_transactions 'paid')
 * 3. États des lieux (inventory_reports)
 */
/**
 * Récupérer les documents de gestion locative (GED)
 * Agrège:
 * 1. Documents uploadés manuellement (user_documents)
 * 2. Quittances de loyer (rental_transactions 'paid')
 * 3. États des lieux (inventory_reports)
 * 4. Contrats de bail (leases)
 * 5. Devis/Factures d'intervention (maintenance_requests)
 *
 * NOTE: Utilise team_id pour le mode équipe (SaaS)
 */
export async function getRentalDocuments(filters?: { propertyId?: string; leaseId?: string }) {
  const supabase = await createClient();

  // Utiliser le contexte d'équipe pour supporter le mode SaaS
  const { getUserTeamContext } = await import("@/lib/team-context");
  const { teamId, user } = await getUserTeamContext();

  if (!user || !teamId) return { success: false, error: "Non autorisé" };

  try {
    // 1. Documents manuels (Uploadés par owner OU locataire sur un bail du owner)
    // On veut: created by user OR linked to a lease owned by user.
    // La jointure !inner sur leases permet de filtrer ceux dont le bail appartient au user.
    // Mais attention aux docs "sans bail" (titre propriété) uploadés par le user lui-même.
    // Donc on fait 2 requêtes ou on utilise un OR complexe.
    // Stratégie: 
    // A. Docs du User (qu'il a uploadé lui-même, lié à un bail ou non)
    // B. Docs liés aux baux du User (uploadés par n'importe qui, ex: locataire)

    // Simplification: On récupère tout ce qui touche aux baux du owner + ce que le owner a uploadé.
    // Supabase : .or(`user_id.eq.${user.id},leases.owner_id.eq.${user.id}`) ne marche pas direct avec des joins imbriqués facilement.
    // On va faire 2 appels manuels si besoin, mais essayons la jointure.

    const _manualsQuery = supabase
      .from("user_documents")
      .select(`
        *,
        properties (title),
        leases (tenant_name, owner_id)
      `)
      // On retire le filtre strict user_id pour permettre de voir ceux des locataires
      // Mais on doit sécuriser pour ne pas voir ceux des autres owners.
      // On filtre: soit user_id = me, soit leases.owner_id = me.
      // Sauf que si user_id = me, le lease peut être null.
      // Si lease.owner_id = me, c'est bon.
      // Post-filtre en JS plus sûr et simple pour ce cas mixte.
      .not("file_path", "is", null);

    // Note: Pour la sécu, on devrait compter sur RLS. 
    // Si RLS dit "user can see doc if user_id=uid OR lease.owner_id=uid", alors on peut juste faire select.
    // On va assumer que RLS fait son job ou filtrer nous même.
    // Faisons un filtre JS pour être sûr :

    // On charge un peu large (basé sur leases ou user) et on filtre.
    // LIMITATION: Si bcp de docs, inefficace. Mieux vaut 2 queries.

    // Query A: Mes uploads
    const _qA = supabase.from("user_documents").select('id').eq("user_id", user.id);

    // Query B: Uploads liés à mes baux
    const _qB = supabase.from("user_documents").select('id, leases!inner(owner_id)').eq("leases.owner_id", user.id);

    // On va fusionner dans la query principale en utilisant 'or' si possible, ou une logique de filtre post-fetch si le volume est faible.
    // Vu la complexité de OR avec relation inner/outer, on va utiliser le filtre "user_documents" général et filter cote serveur (ou modifier la query pour utiliser des IDs).

    // Alternative Robuste : Fetch by Lease IDs if filter exist, or just owner's docs.
    // Si pas de filtre, on veut TOUT.
    // Utilisons user_id = user.id (owner uploads)
    // Et une 2eme query pour les docs liées aux baux du owner mais PAS uploadés par lui (tenant uploads).

    // APPROCHE ROBUSTE EN 2 ÉTAPES:
    // 1. Récupérer les lease_ids de l'équipe
    // 2. Récupérer les documents liés à ces leases OU uploadés par l'utilisateur

    // Étape 1: Récupérer tous les lease_ids de l'équipe
    const { data: teamLeases } = await supabase
      .from("leases")
      .select("id")
      .eq("team_id", teamId);

    const teamLeaseIds = (teamLeases || []).map(l => l.id);
    console.log("[GED] Team lease IDs:", teamLeaseIds.length, "for team:", teamId);

    // Étape 2: Récupérer les documents - 2 queries parallèles
    // A. Documents uploadés par l'utilisateur actuel
    let queryUserDocs = supabase
      .from("user_documents")
      .select(`*`)
      .eq("user_id", user.id);

    // B. Documents liés aux baux de l'équipe (peu importe qui les a uploadés)
    let queryTeamDocs = teamLeaseIds.length > 0
      ? supabase
        .from("user_documents")
        .select(`*`)
        .in("lease_id", teamLeaseIds)
      : Promise.resolve({ data: [], error: null });

    if (filters?.propertyId) {
      queryUserDocs = queryUserDocs.eq("property_id", filters.propertyId);
    }
    if (filters?.leaseId) {
      queryUserDocs = queryUserDocs.eq("lease_id", filters.leaseId);
      // Pour queryTeamDocs, on filtre aussi par leaseId si spécifié
      if (teamLeaseIds.length > 0) {
        queryTeamDocs = supabase
          .from("user_documents")
          .select(`*`)
          .eq("lease_id", filters.leaseId);
      }
    }

    const [userDocsRes, teamDocsRes] = await Promise.all([
      queryUserDocs.order("created_at", { ascending: false }),
      queryTeamDocs
    ]);

    // Fusionner et dédupliquer les résultats
    const allUserDocs = [...(userDocsRes.data || []), ...((teamDocsRes as { data: UserDocument[] | null; error: any }).data || [])];
    const manualsOwnerRes = {
      data: Array.from(new Map(allUserDocs.map(d => [d.id, d])).values()),
      error: userDocsRes.error || (teamDocsRes as { data: any; error: any }).error
    };
    console.log("[GED] Total documents found:", manualsOwnerRes.data?.length || 0);

    // Placeholder pour compatibilité
    const manualsTenantRes = { data: [], error: null };

    // 2. Quittances (Transactions payées) - filtrées par team_id
    let receiptsQuery = supabase
      .from("rental_transactions")
      .select(`
        id,
        period_month,
        period_year,
        paid_at,
        amount_due,
        leases!inner (
          id,
          tenant_name,
          property_address,
          team_id
        )
      `)
      .eq("status", "paid")
      .eq("leases.team_id", teamId);

    if (filters?.leaseId) receiptsQuery = receiptsQuery.eq("lease_id", filters.leaseId);

    // 3. États des lieux - filtrés par team_id
    let inventoryQuery = supabase
      .from("inventory_reports")
      .select(`
        id,
        report_type,
        date,
        status,
        updated_at,
        leases!inner (
          id,
          tenant_name,
          property_address,
          team_id
        )
      `)
      .eq("leases.team_id", teamId);

    if (filters?.leaseId) inventoryQuery = inventoryQuery.eq("lease_id", filters.leaseId);

    // 4. Contrats (Baux) - filtrés par team_id
    let leasesQuery = supabase
      .from("leases")
      .select(`
        id,
        start_date,
        end_date,
        status,
        created_at,
        tenant_name,
        property_address,
        team_id
      `)
      .eq("team_id", teamId);

    if (filters?.leaseId) leasesQuery = leasesQuery.eq("id", filters.leaseId);

    // 5. Interventions (Maintenance) - filtrées par team_id
    let maintenanceQuery = supabase
      .from("maintenance_requests")
      .select(`
        id,
        description,
        status,
        created_at,
        quoted_price,
        quote_url,
        leases!inner (
          id,
          tenant_name,
          property_address,
          team_id
        )
      `)
      .eq("leases.team_id", teamId);

    if (filters?.leaseId) maintenanceQuery = maintenanceQuery.eq("lease_id", filters.leaseId);


    // Exécuter les requêtes restantes en parallèle
    const [receiptsRes, inventoryRes, leasesRes, maintenanceRes] = await Promise.all([
      receiptsQuery.order("paid_at", { ascending: false }),
      inventoryQuery.order("date", { ascending: false }),
      leasesQuery.order("created_at", { ascending: false }),
      maintenanceQuery.order("created_at", { ascending: false })
    ]);



    const allManualsData = [...(manualsOwnerRes.data || []), ...(manualsTenantRes.data || [])];
    // Dédoublonnage au cas où (par sécurité, bien que les queries soient disjointe par user_id)
    const uniqueManuals = Array.from(new Map(allManualsData.map(item => [item.id, item])).values());

    // --- Traitement de TOUS les documents pour obtenir les URLs signées ---
    const docsWithUrls = await Promise.all(
      uniqueManuals.map(async (doc) => {
        // Déterminer le bon bucket selon le type ou la catégorie
        let bucketName: 'verification-docs' | 'lease-contracts' | 'receipts' | 'properties' = 'verification-docs';
        if (doc.category === 'lease_contract' || doc.entity_type === 'lease' || doc.file_type === 'bail') {
          bucketName = 'lease-contracts';
        } else if (doc.entity_type === 'payment' || doc.entity_type === 'quittance' || doc.file_type === 'quittance') {
          bucketName = 'receipts';
        } else if (doc.file_type === 'maintenance' || doc.file_path?.includes('maintenance/')) {
          bucketName = 'properties';
        }

        const { data } = await supabase.storage
          .from(bucketName)
          .createSignedUrl(doc.file_path, 604800);

        let signedUrl = data?.signedUrl || "";
        if (signedUrl) {
          // Force inline display instead of download
          signedUrl += (signedUrl.includes('?') ? '&' : '?') + 'response-content-disposition=inline';
        }

        // Since we removed joins, construct property_title from description or file_name
        const propertyTitle = doc.description || doc.file_name || "Document";

        // Extract tenant name from description if available
        let tenantName = null;
        if (doc.description && doc.description.includes(' - ')) {
          tenantName = doc.description.split(' - ')[1];
        }

        return {
          ...doc,
          name: doc.description || doc.file_name || "Document sans nom",
          url: data?.signedUrl || "",
          property_title: propertyTitle,
          tenant_name: tenantName,
          uploaded_at: doc.created_at || doc.updated_at || null
        };
      })
    );

    // --- Indexation des documents GED pour lookup rapide ---
    // Maintenant docsWithUrls contient les URLs signées
    const gedIndex = new Map<string, GEDDocument>(); // Key: "type:id" -> Document
    docsWithUrls.forEach(doc => {
      if (doc.entity_type && doc.entity_id) {
        gedIndex.set(`${doc.entity_type}:${doc.entity_id}`, doc);
      }
      // Support legacy/fallback: parfois on n'a que lease_id
      if (doc.file_type === 'bail' && doc.lease_id) {
        gedIndex.set(`lease:${doc.lease_id}`, doc);
      }
    });

    // --- Traitement Documents Manuels ---
    const manualDocs = docsWithUrls.filter(doc => {
      // Exclure les documents qui sont déjà traités dans les sections spécifiques (Baux, Quittances)
      const isHandledElsewhere =
        (doc.entity_type === 'lease' || doc.file_type === 'bail') ||
        (doc.entity_type === 'payment' || doc.entity_type === 'quittance' || doc.file_type === 'quittance') ||
        (doc.entity_type === 'maintenance_request' || doc.file_type === 'maintenance');

      return !isHandledElsewhere;
    });

    // --- Traitement Quittances ---
    const validReceipts = (receiptsRes.data || []).filter(_r => true);

    const receiptDocs = validReceipts.map(r => {
      const lease = r.leases as unknown as { id: string; tenant_name: string; property_address: string };
      const dateStr = new Date(r.period_year, r.period_month - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

      // Chercher un document GED existant pour cette transaction
      const existingDoc = gedIndex.get(`payment:${r.id}`) || gedIndex.get(`quittance:${r.id}`);

      // L'URL est soit celle du doc stocké (si présent), soit l'API dynamique
      const docUrl = existingDoc?.url || `/api/documents/receipt/${r.id}`;

      return {
        id: `receipt-${r.id}`,
        name: existingDoc?.name || `Quittance - ${dateStr}`,
        type: "quittance",
        category: "quittance",
        file_size: existingDoc?.file_size || 0,
        url: docUrl, // Priorité au document stocké
        uploaded_at: r.paid_at || new Date().toISOString(),
        property_id: null,
        lease_id: lease?.id,
        property_title: lease?.property_address || "Propriété sans titre",
        tenant_name: lease?.tenant_name,
        is_virtual: !existingDoc, // N'est plus virtuel si on a un doc physique
        virtual_type: 'receipt',
        virtual_data: {
          transactionId: r.id,
          amount: r.amount_due,
          period: dateStr
        }
      };
    });

    // --- Traitement États des Lieux ---
    const inventoryDocs = (inventoryRes.data || []).map(r => {
      const lease = r.leases as unknown as { id: string; tenant_name: string; property_address: string };
      // TODO: Vérifier si un EDL stocké existe (entity_type='inventory'?)
      return {
        id: `inventory-${r.id}`,
        name: `État des lieux (${r.report_type === 'entry' ? 'Entrée' : 'Sortie'})`,
        type: "etat_lieux",
        category: "etat_lieux",
        file_size: 0,
        url: `/gestion/etats-lieux/${r.id}/pdf`,
        uploaded_at: r.updated_at || r.date,
        property_id: null,
        lease_id: lease?.id,
        property_title: lease?.property_address || "Propriété sans titre",
        tenant_name: lease?.tenant_name,
        is_virtual: true,
        virtual_type: 'inventory'
      };
    });

    // --- Traitement Contrats (Baux) ---
    const leaseDocs = (leasesRes.data || []).map(l => {
      // Chercher un document GED existant pour ce bail
      const existingDoc = gedIndex.get(`lease:${l.id}`);

      const docUrl = existingDoc?.url || `/api/documents/lease/${l.id}`;

      return {
        id: `lease-${l.id}`,
        name: existingDoc?.name || `Contrat de Bail - ${l.tenant_name}`,
        type: "bail",
        category: "bail",
        file_size: existingDoc?.file_size || 0,
        url: docUrl,
        uploaded_at: l.created_at,
        property_id: null,
        lease_id: l.id,
        property_title: l.property_address || "Propriété sans titre",
        tenant_name: l.tenant_name,
        is_virtual: !existingDoc,
        virtual_type: 'lease'
      };
    });

    // --- Traitement Interventions ---
    // On ne garde que celles qui ont une URL de devis/facture valide
    const maintenanceDocs = await Promise.all((maintenanceRes.data || [])
      .filter(m => !!m.quote_url)
      .map(async (m) => {
        const lease = m.leases as unknown as { id: string; tenant_name: string; property_address: string };
        const isCompleted = m.status === 'completed';

        let finalUrl = m.quote_url || `/gestion`;

        // Si on a un quote_url qui est une URL Supabase, on essaie de la signer pour être sûr de l'accès
        if (m.quote_url && (m.quote_url.includes('storage/v1/object/public/properties/') || m.quote_url.includes('storage/v1/object/sign/properties/'))) {
          try {
            // Extraire le path relatif (après /properties/)
            const filePath = m.quote_url.split('/properties/')[1].split('?')[0];
            const { data: signedData } = await supabase.storage
              .from('properties')
              .createSignedUrl(filePath, 604800);
            if (signedData?.signedUrl) {
              finalUrl = signedData.signedUrl + (signedData.signedUrl.includes('?') ? '&' : '?') + 'response-content-disposition=inline';
            }
          } catch (e) {
            console.warn("Erreur signature URL maintenance:", e);
          }
        }

        return {
          id: `maintenance-${m.id}`,
          name: isCompleted ? `Facture: ${m.description.substring(0, 30)}...` : `Devis: ${m.description.substring(0, 30)}...`,
          type: isCompleted ? "facture_travaux" : "devis",
          category: isCompleted ? "facture_travaux" : "devis",
          file_size: 0,
          url: finalUrl,
          uploaded_at: m.created_at,
          property_id: null,
          lease_id: lease?.id,
          property_title: lease?.property_address || "Propriété sans titre",
          tenant_name: lease?.tenant_name,
          is_virtual: true,
          virtual_type: 'maintenance',
          virtual_data: {
            status: m.status,
            price: m.quoted_price
          }
        };
      }));


    // Fusionner et trier par date décroissante
    // On inclut les documents manuels/générés ET les documents virtuels (quittances, etc.)
    const allDocs = [
      ...manualDocs,
      ...receiptDocs,
      ...inventoryDocs,
      ...leaseDocs,
      ...maintenanceDocs
    ].sort((a, b) => {
      const dateA = a.uploaded_at ? new Date(a.uploaded_at).getTime() : 0;
      const dateB = b.uploaded_at ? new Date(b.uploaded_at).getTime() : 0;
      return dateB - dateA;
    });


    return { success: true, data: allDocs };

  } catch (error) {
    console.error("Erreur récupération GED:", error);
    return { success: false, error: "Erreur technique" };
  }
}
