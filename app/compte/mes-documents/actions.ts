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
