"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import { notifyAdmin } from "@/lib/notifications";

/**
 * Upload un document de vérification pour un bien
 * @param formData FormData contenant le fichier et le propertyId
 */
export async function uploadVerificationDoc(formData: FormData) {
  const supabase = await createClient();

  // Rate limiting basique ou vérification de session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Vous devez être connecté pour effectuer cette action." };
  }

  const file = formData.get("file") as File;
  const propertyId = formData.get("propertyId") as string;

  if (!file || !propertyId) {
    return { error: "Fichier ou bien manquant." };
  }

  // Validation du fichier (Zero Trust)
  // Max 5MB
  if (file.size > 5 * 1024 * 1024) {
    return { error: "Le fichier est trop volumineux (max 5MB)." };
  }

  // Types acceptés : PDF, JPEG, PNG
  const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return { error: "Format de fichier non accepté. Utilisez PDF, JPG ou PNG." };
  }

  // Vérifier que le bien appartient à l'utilisateur
  // Ici on utilise supabase standard (RLS) pour vérifier la propriété légitime
  const { data: property, error: fetchError } = await supabase
    .from("properties")
    .select("owner_id, category, team_id")
    .eq("id", propertyId)
    .single();

  if (fetchError || !property) {
    return { error: "Bien introuvable." };
  }

  if (property.owner_id !== user.id) {
    return { error: "Vous n'êtes pas propriétaire de ce bien." };
  }

  // Générer un nom de fichier sécurisé
  const fileExt = file.name.split(".").pop();
  const timestamp = Date.now();
  // Structure: uploaderId/propertyId/timestamp.ext
  const filePath = `${user.id}/${propertyId}/${timestamp}.${fileExt}`;

  // Upload sécurisé dans le bucket 'verification-docs'
  // Le bucket doit être privé
  const { error: uploadError } = await supabase.storage
    .from("verification-docs")
    .upload(filePath, file, {
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    return { error: "Erreur lors de l'envoi du document. Vérifiez que la migration du bucket a bien été appliquée." };
  }

  // Obtenir l'URL signée (ou simplement le path)
  const documentPath = filePath;

  // Mise à jour du statut du bien via ADMIN CLIENT (pour contourner RLS sur status)
  const supabaseAdmin = createAdminClient();

  const { error: updateError } = await supabaseAdmin
    .from("properties")
    .update({
      verification_status: "pending",
      proof_document_url: documentPath, // On stocke le chemin
      verification_requested_at: new Date().toISOString(),
    })
    .eq("id", propertyId);

  if (updateError) {
    console.error("Update property error:", updateError);
    return { error: "Document envoyé mais erreur lors de la mise à jour du statut (DB Update)." };
  }

  revalidatePath("/compte/mes-biens");

  // Notifier l'admin
  await notifyAdmin({
    type: "info",
    title: "Demande de vérification",
    message: `Une nouvelle demande de vérification a été soumise par ${user.email}.`,
    resourcePath: `/admin/verifications/biens?highlight=${propertyId}`,
  });

  return {
    success: true,
    message: "Document envoyé avec succès ! Votre demande de vérification est en cours d'examen."
  };
}

/**
 * Marquer un bien comme vendu ou loué
 */
export async function markPropertyAsSold(propertyId: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Utilisateur non authentifié." };
  }

  // Vérifier que le bien appartient à l'utilisateur
  const { data: property, error: fetchError } = await supabase
    .from("properties")
    .select("owner_id, category, team_id")
    .eq("id", propertyId)
    .single();

  if (fetchError || !property) {
    return { error: "Bien introuvable." };
  }

  if (property.owner_id !== user.id) {
    return { error: "Vous n'êtes pas autorisé à modifier ce bien." };
  }

  const newStatus = property.category === "location" ? "loué" : "vendu";

  const { error } = await supabase
    .from("properties")
    .update({
      status: newStatus,
      validation_status: "pending" // Retirer de la vitrine publique
    })
    .eq("id", propertyId);

  if (error) {
    console.error(`Error marking property as ${newStatus}:`, error);
    return { error: "Erreur lors de la mise à jour." };
  }

  revalidatePath("/compte/mes-biens");
  if (property.team_id) {
    revalidatePath("/gestion/biens");
    revalidatePath("/gestion");
  }
  return { success: true };
}

/**
 * Supprimer un bien
 */
export async function deleteUserProperty(propertyId: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Utilisateur non authentifié." };
  }

  // Vérifier que le bien appartient à l'utilisateur
  const { data: property, error: fetchError } = await supabase
    .from("properties")
    .select("owner_id, team_id")
    .eq("id", propertyId)
    .single();

  if (fetchError || !property) {
    return { error: "Bien introuvable." };
  }

  if (property.owner_id !== user.id) {
    return { error: "Vous n'êtes pas autorisé à supprimer ce bien." };
  }

  const { error } = await supabase.from("properties").delete().eq("id", propertyId);

  if (error) {
    console.error("Error deleting property:", error);
    return { error: "Erreur lors de la suppression." };
  }

  revalidatePath("/compte/mes-biens");
  return { success: true };
}
