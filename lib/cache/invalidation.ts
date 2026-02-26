/**
 * Helpers d'invalidation de cache pour Dousel
 *
 * À utiliser dans toutes les Server Actions qui modifient des données
 *
 * @see REDIS_CACHE_STRATEGY.md
 */

import { invalidateCacheBatch } from "./cache-aside";
import { revalidatePath } from "next/cache";

/**
 * 🏠 Invalider tous les caches liés aux propriétés
 *
 * À appeler après : create, update, delete, approve
 */
export async function invalidatePropertyCaches(
  propertyId: string,
  city?: string,
  options: {
    invalidateHomepage?: boolean;
    invalidateSearch?: boolean;
    invalidateDetail?: boolean;
    invalidateOwner?: boolean;
    ownerId?: string;
  } = {}
) {
  const {
    invalidateHomepage = true,
    invalidateSearch = true,
    invalidateDetail = true,
    invalidateOwner = false,
    ownerId,
  } = options;

  const homepageKeys: string[] = [];
  const propertyKeys: string[] = [];

  // Homepage globale
  if (invalidateHomepage) {
    homepageKeys.push(
      "all_sections", // Sections homepage
      "popular_locations_8",
      "properties_for_sale_8",
      "land_for_sale_8"
    );
  }

  // Recherche par ville
  if (invalidateSearch && city) {
    homepageKeys.push(`city:${city}`);
    propertyKeys.push(`city:${city}:limit:20`);
  }

  // Détail du bien
  if (invalidateDetail) {
    propertyKeys.push(`detail:${propertyId}`);
  }

  // Biens du propriétaire
  if (invalidateOwner && ownerId) {
    propertyKeys.push(`owner:${ownerId}`);
    propertyKeys.push(`owner_stats:${ownerId}`);
  }

  // Invalider featured et latest
  propertyKeys.push(
    "featured:limit:8",
    "latest:limit:6",
    "approved_ids:20"
  );

  // Invalider en parallèle
  await Promise.all([
    homepageKeys.length > 0
      ? invalidateCacheBatch(homepageKeys, "homepage")
      : Promise.resolve(),
    propertyKeys.length > 0
      ? invalidateCacheBatch(propertyKeys, "properties")
      : Promise.resolve(),
  ]);

  // Revalider les chemins Next.js (ISR)
  revalidatePath("/");
  revalidatePath("/recherche");
  if (propertyId) {
    revalidatePath(`/biens/${propertyId}`);
  }
}

/**
 * 📋 Invalider tous les caches liés à la gestion locative
 *
 * À appeler après : create/update/delete lease, payment
 */
export async function invalidateRentalCaches(
  ownerId: string,
  leaseId?: string,
  options: {
    invalidateLeases?: boolean;
    invalidateTransactions?: boolean;
    invalidateStats?: boolean;
    invalidateMessages?: boolean;
  } = {}
) {
  const {
    invalidateLeases = true,
    invalidateTransactions = true,
    invalidateStats = true,
    invalidateMessages = false,
  } = options;

  const rentalKeys: string[] = [];

  if (invalidateLeases) {
    rentalKeys.push(
      `leases:${ownerId}:active`,
      `leases:${ownerId}:terminated`,
      `leases:${ownerId}:all`
    );
  }

  if (invalidateTransactions) {
    // Clé précise qui matche la nouvelle stratégie de cache par bail
    if (leaseId) {
      rentalKeys.push(`rental_transactions:${leaseId}`);
    }
    // Clé globale par équipe (utilisée par le dashboard pour la performance)
    rentalKeys.push(`rental_transactions:team:${ownerId}`);
  }

  if (invalidateStats) {
    rentalKeys.push(
      `rental_stats:${ownerId}`,
      `late_payments:${ownerId}`
    );
  }

  if (invalidateMessages && leaseId) {
    rentalKeys.push(`lease_messages:${leaseId}`);
  }

  if (leaseId) {
    rentalKeys.push(`lease_detail:${leaseId}`);
  }

  rentalKeys.push(`owner_profile:${ownerId}`);

  // Invalider
  if (rentalKeys.length > 0) {
    await invalidateCacheBatch(rentalKeys, "rentals");
  }

  // Revalider pages
  revalidatePath("/gestion"); // Dashboard principal (et non /gestion-locative qui est l'ancien path)
  if (leaseId) {
    revalidatePath(`/gestion/locataires/${leaseId}`);
  }
}

/**
 * 🗑️ Invalidation complète (à utiliser avec précaution)
 *
 * Vide tout le cache Redis. Utile en dev ou après migration DB
 */
export async function invalidateAllCaches() {
  console.warn("⚠️ Invalidating ALL caches - use sparingly!");

  await Promise.all([
    invalidateCacheBatch(["*"], "homepage"),
    invalidateCacheBatch(["*"], "properties"),
    invalidateCacheBatch(["*"], "rentals"),
  ]);

  // Revalider toutes les pages principales
  revalidatePath("/");
  revalidatePath("/recherche");
  revalidatePath("/compte");
  revalidatePath("/compte/gestion-locative");
}
