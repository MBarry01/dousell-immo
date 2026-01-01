/**
 * EXEMPLES DE SERVER ACTIONS AVEC INVALIDATION CACHE
 *
 * Ce fichier montre comment intégrer le cache Redis dans vos Server Actions existantes.
 * À adapter selon votre structure actuelle.
 *
 * @see REDIS_CACHE_STRATEGY.md
 * @see CACHE_ACTIVATION_GUIDE.md
 */

"use server";

import { createClient } from "@/utils/supabase/server";
import { invalidateCacheBatch } from "@/lib/cache/cache-aside";
import { revalidatePath } from "next/cache";

// ============================================================================
// EXEMPLE 1 : Création d'un nouveau bien
// ============================================================================

export async function createProperty(formData: FormData) {
  const supabase = await createClient();

  // 1. Récupérer l'utilisateur
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non authentifié" };
  }

  // 2. Extraire les données du formulaire
  const title = formData.get("title") as string;
  const city = formData.get("city") as string;
  const category = formData.get("category") as string;
  const type = formData.get("type") as string;
  // ... autres champs

  // 3. Créer le bien dans la DB
  const { data: property, error } = await supabase
    .from("properties")
    .insert({
      owner_id: user.id,
      title,
      city,
      category,
      details: { type },
      status: "pending", // En attente de validation admin
      // ... autres champs
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating property:", error);
    return { error: "Erreur lors de la création du bien" };
  }

  // 4. 📢 INVALIDER LE CACHE
  // Note : Comme status = 'pending', pas encore visible sur homepage
  // Mais on invalide quand même pour cohérence

  await invalidateCacheBatch(
    [
      "all_sections", // Homepage globale
      `city:${city}`, // Filtres par ville
      // Pas besoin d'invalider les sections individuelles car status != 'disponible'
    ],
    "homepage"
  );

  // Également invalider namespace properties
  await invalidateCacheBatch([`city:${city}`], "properties");

  // 5. Revalider les chemins Next.js (ISR)
  revalidatePath("/");
  revalidatePath("/recherche");

  return { success: true, propertyId: property.id };
}

// ============================================================================
// EXEMPLE 2 : Mise à jour d'un bien existant
// ============================================================================

export async function updateProperty(propertyId: string, updates: any) {
  const supabase = await createClient();

  // 1. Vérifier ownership
  const { data: property } = await supabase
    .from("properties")
    .select("owner_id, city, status")
    .eq("id", propertyId)
    .single();

  if (!property) {
    return { error: "Bien introuvable" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.id !== property.owner_id) {
    return { error: "Non autorisé" };
  }

  // 2. Update DB
  const { error } = await supabase
    .from("properties")
    .update(updates)
    .eq("id", propertyId);

  if (error) {
    console.error("Error updating property:", error);
    return { error: "Erreur lors de la mise à jour" };
  }

  // 3. 📢 INVALIDER CACHE (CRITIQUE !)
  const keysToInvalidate: string[] = [];

  // Toujours invalider :
  keysToInvalidate.push("all_sections"); // Homepage globale

  // Si ville a changé, invalider les 2 villes
  if (updates.city && updates.city !== property.city) {
    keysToInvalidate.push(`city:${property.city}`, `city:${updates.city}`);
  } else {
    keysToInvalidate.push(`city:${property.city}`);
  }

  // Si statut a changé, invalider les sections homepage
  if (updates.status && updates.status !== property.status) {
    keysToInvalidate.push(
      "popular_locations_8",
      "properties_for_sale_8",
      "land_for_sale_8"
    );
  }

  // Invalider namespace homepage
  await invalidateCacheBatch(keysToInvalidate, "homepage");

  // Invalider namespace properties
  await invalidateCacheBatch([`detail:${propertyId}`, `city:${property.city}`], "properties");

  // Si nouvelle ville, invalider aussi
  if (updates.city && updates.city !== property.city) {
    await invalidateCacheBatch([`city:${updates.city}`], "properties");
  }

  // 4. Revalider paths
  revalidatePath("/");
  revalidatePath(`/biens/${propertyId}`);
  revalidatePath("/recherche");

  return { success: true };
}

// ============================================================================
// EXEMPLE 3 : Suppression d'un bien
// ============================================================================

export async function deleteProperty(propertyId: string) {
  const supabase = await createClient();

  // 1. Récupérer info pour invalidation
  const { data: property } = await supabase
    .from("properties")
    .select("owner_id, city")
    .eq("id", propertyId)
    .single();

  if (!property) {
    return { error: "Bien introuvable" };
  }

  // 2. Vérifier ownership
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.id !== property.owner_id) {
    return { error: "Non autorisé" };
  }

  // 3. Supprimer de la DB
  const { error } = await supabase.from("properties").delete().eq("id", propertyId);

  if (error) {
    console.error("Error deleting property:", error);
    return { error: "Erreur lors de la suppression" };
  }

  // 4. 📢 INVALIDER CACHE
  await invalidateCacheBatch(
    [
      "all_sections",
      `city:${property.city}`,
      "popular_locations_8",
      "properties_for_sale_8",
      "land_for_sale_8",
    ],
    "homepage"
  );

  await invalidateCacheBatch([`detail:${propertyId}`, `city:${property.city}`], "properties");

  // 5. Revalider paths
  revalidatePath("/");
  revalidatePath("/recherche");

  return { success: true };
}

// ============================================================================
// EXEMPLE 4 : Validation admin (changement statut)
// ============================================================================

export async function approveProperty(propertyId: string) {
  const supabase = await createClient();

  // 1. Vérifier que c'est un admin
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non authentifié" };
  }

  // Vérifier rôle admin (à adapter selon votre système)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { error: "Accès refusé" };
  }

  // 2. Récupérer info propriété
  const { data: property } = await supabase
    .from("properties")
    .select("city, category, details")
    .eq("id", propertyId)
    .single();

  if (!property) {
    return { error: "Bien introuvable" };
  }

  // 3. Approuver le bien
  const { error } = await supabase
    .from("properties")
    .update({
      validation_status: "approved",
      status: "disponible", // Passe en disponible
    })
    .eq("id", propertyId);

  if (error) {
    console.error("Error approving property:", error);
    return { error: "Erreur lors de l'approbation" };
  }

  // 4. 📢 INVALIDER CACHE (IMPORTANT - Le bien devient visible !)
  await invalidateCacheBatch(
    [
      "all_sections", // Devient visible homepage
      `city:${property.city}`,
      "popular_locations_8", // Si location à Dakar
      "properties_for_sale_8", // Si vente
      "land_for_sale_8", // Si terrain
    ],
    "homepage"
  );

  await invalidateCacheBatch([`detail:${propertyId}`, `city:${property.city}`], "properties");

  // 5. Revalider paths
  revalidatePath("/");
  revalidatePath(`/biens/${propertyId}`);
  revalidatePath("/recherche");
  revalidatePath("/admin/verifications/biens");

  return { success: true };
}

// ============================================================================
// HELPER : Fonction utilitaire pour invalidation intelligente
// ============================================================================

/**
 * Invalide tous les caches liés à une propriété
 * À utiliser dans vos Server Actions existantes
 */
export async function invalidatePropertyCaches(
  propertyId: string,
  city: string,
  options: {
    invalidateHomepage?: boolean;
    invalidateSearch?: boolean;
    invalidateDetail?: boolean;
  } = {}
) {
  const { invalidateHomepage = true, invalidateSearch = true, invalidateDetail = true } = options;

  const homepageKeys: string[] = [];
  const propertyKeys: string[] = [];

  if (invalidateHomepage) {
    homepageKeys.push(
      "all_sections",
      "popular_locations_8",
      "properties_for_sale_8",
      "land_for_sale_8"
    );
  }

  if (invalidateSearch) {
    homepageKeys.push(`city:${city}`);
    propertyKeys.push(`city:${city}`);
  }

  if (invalidateDetail) {
    propertyKeys.push(`detail:${propertyId}`);
  }

  // Invalider en parallèle pour performance
  await Promise.all([
    homepageKeys.length > 0 ? invalidateCacheBatch(homepageKeys, "homepage") : Promise.resolve(),
    propertyKeys.length > 0
      ? invalidateCacheBatch(propertyKeys, "properties")
      : Promise.resolve(),
  ]);
}

// ============================================================================
// USAGE DANS VOS ACTIONS EXISTANTES
// ============================================================================

/**
 * Exemple d'intégration dans une action existante
 */
export async function myExistingAction(propertyId: string, data: any) {
  // ... votre logique DB existante ...
  const supabase = await createClient();

  const { error } = await supabase.from("properties").update(data).eq("id", propertyId);

  if (error) return { error: "..." };

  // ✅ AJOUTER JUSTE CES 2 LIGNES
  await invalidatePropertyCaches(propertyId, data.city);
  revalidatePath("/");

  return { success: true };
}
