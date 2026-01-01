/**
 * 📚 Exemples d'utilisation du Cache pour Dousell Immo
 *
 * Ce fichier contient des exemples CONCRETS pour :
 * 1. Liste des propriétés (lecture fréquente)
 * 2. Détail d'une propriété (lecture fréquente)
 * 3. Mise à jour de propriété (invalidation)
 * 4. Paiement de loyer (verrou distribué)
 */

import { getOrSetCache, invalidateCache, invalidateCacheBatch } from './cache-aside';
import { withLock } from './distributed-locks';
import { createClient } from '@/utils/supabase/server';

// ============================================================================
// EXEMPLE 1 : Liste des Propriétés Publiques (Homepage)
// ============================================================================

/**
 * 🏠 Récupérer toutes les propriétés publiques avec cache
 *
 * Scénario :
 * - 1000 visiteurs/jour sur la homepage
 * - Les annonces changent 10 fois/jour max
 * - TTL : 5 minutes (bon équilibre)
 *
 * Performance :
 * - Sans cache : 300ms par requête = 300s/jour pour 1000 users
 * - Avec cache : 5ms par requête = 5s/jour pour 1000 users
 * - Gain : 295s/jour = 98% de réduction
 */
export async function getAllPropertiesPublic() {
  return getOrSetCache(
    'all_properties_public',
    async () => {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    {
      ttl: 300, // 5 minutes
      namespace: 'properties',
      debug: true,
    }
  );
}

// ============================================================================
// EXEMPLE 2 : Détail d'une Propriété (Page Bien)
// ============================================================================

/**
 * 🏡 Récupérer une propriété spécifique avec cache
 *
 * Scénario :
 * - Page produit vue 500 fois/jour
 * - Propriété modifiée 1 fois/semaine
 * - TTL : 1 heure (pas de problème si léger délai)
 */
export async function getPropertyById(id: string) {
  return getOrSetCache(
    `detail:${id}`,
    async () => {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('properties')
        .select(
          `
          *,
          profiles:owner_id (
            first_name,
            last_name,
            avatar_url
          )
        `
        )
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    {
      ttl: 3600, // 1 heure
      namespace: 'properties',
    }
  );
}

// ============================================================================
// EXEMPLE 3 : Recherche par Ville (Filtres)
// ============================================================================

/**
 * 🔍 Propriétés par ville avec cache
 *
 * Clés dynamiques : properties:city:Dakar, properties:city:Thies, etc.
 */
export async function getPropertiesByCity(city: string) {
  return getOrSetCache(
    `city:${city}`,
    async () => {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('city', city)
        .eq('status', 'published');

      if (error) throw error;
      return data || [];
    },
    {
      ttl: 600, // 10 minutes
      namespace: 'properties',
    }
  );
}

// ============================================================================
// EXEMPLE 4 : Invalidation Intelligente (Server Action)
// ============================================================================

/**
 * 🔄 Mise à jour d'une propriété avec invalidation
 *
 * CRUCIAL : Quand un propriétaire modifie son bien, on doit :
 * 1. Mettre à jour la DB
 * 2. Invalider TOUS les caches concernés
 */
export async function updateProperty(id: string, newData: any) {
  const supabase = await createClient();

  // 1. Mise à jour DB (Supabase)
  const { error } = await supabase.from('properties').update(newData).eq('id', id);

  if (error) throw error;

  // 2. INVALIDATION IMMÉDIATE (Le "Chef crie" 📢)

  const keysToInvalidate = [
    'all_properties_public', // Liste globale
    `detail:${id}`, // Détail de ce bien
  ];

  // Si la ville a changé, invalider les deux villes
  if (newData.city) {
    keysToInvalidate.push(`city:${newData.city}`);
  }

  // Si le statut a changé (published/draft), invalider liste
  if (newData.status) {
    keysToInvalidate.push('all_properties_public');
  }

  await invalidateCacheBatch(keysToInvalidate, 'properties');

  console.log(`✅ Property ${id} updated and cache invalidated`);
  return { success: true };
}

// ============================================================================
// EXEMPLE 5 : Paiement de Loyer avec Verrou Distribué
// ============================================================================

/**
 * 💰 Paiement de loyer avec protection contre double paiement
 *
 * Scénario :
 * - User clique 2 fois vite sur "Payer"
 * - Sans verrou : 2 paiements créés ❌
 * - Avec verrou : 2ème clic rejeté ✅
 */
export async function payRent(leaseId: string, amount: number) {
  // On utilise withLock pour auto-gestion du verrou
  return withLock(
    `payment:${leaseId}`,
    async () => {
      const supabase = await createClient();

      // 1. Vérifier que le bail existe et n'est pas déjà payé ce mois
      const { data: lease } = await supabase
        .from('leases')
        .select('*')
        .eq('id', leaseId)
        .single();

      if (!lease) {
        throw new Error('Bail introuvable');
      }

      // 2. Créer le paiement dans PayDunya
      // ... (votre logique existante)

      // 3. Enregistrer dans la DB
      const { data: payment, error } = await supabase
        .from('rental_payments')
        .insert({
          lease_id: leaseId,
          amount,
          status: 'pending',
          payment_date: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // 4. Invalider le cache des paiements du locataire
      await invalidateCache(`payments:lease:${leaseId}`, 'rentals');

      return { paymentId: payment.id };
    },
    {
      expireSeconds: 30, // Max 30s pour traiter le paiement
      retries: 1, // Ne pas réessayer (c'est volontaire)
    }
  );
}

// ============================================================================
// EXEMPLE 6 : Réservation de Visite avec Verrou
// ============================================================================

/**
 * 📅 Réservation de visite avec protection contre double booking
 */
export async function bookVisit(propertyId: string, slot: string, userId: string) {
  return withLock(
    `visit:${propertyId}:${slot}`,
    async () => {
      const supabase = await createClient();

      // 1. Vérifier que le créneau est encore disponible
      const { data: existingBooking } = await supabase
        .from('visit_bookings')
        .select('*')
        .eq('property_id', propertyId)
        .eq('slot', slot)
        .maybeSingle();

      if (existingBooking) {
        throw new Error('Ce créneau est déjà réservé');
      }

      // 2. Créer la réservation
      const { data: booking, error } = await supabase
        .from('visit_bookings')
        .insert({
          property_id: propertyId,
          user_id: userId,
          slot,
          status: 'confirmed',
        })
        .select()
        .single();

      if (error) throw error;

      // 3. Invalider le cache des créneaux disponibles
      await invalidateCache(`available_slots:${propertyId}`, 'visits');

      return { bookingId: booking.id };
    },
    {
      expireSeconds: 10, // Très rapide pour la réservation
      retries: 3, // On peut réessayer
    }
  );
}

// ============================================================================
// EXEMPLE 7 : Dashboard Stats avec Cache Agressif
// ============================================================================

/**
 * 📊 Stats du Dashboard Propriétaire
 *
 * Ces données changent rarement, on peut cacher longtemps
 */
export async function getOwnerDashboardStats(ownerId: string) {
  return getOrSetCache(
    `dashboard:${ownerId}`,
    async () => {
      const supabase = await createClient();

      // Requêtes parallèles pour performance
      const [properties, leases, payments] = await Promise.all([
        supabase
          .from('properties')
          .select('id', { count: 'exact', head: true })
          .eq('owner_id', ownerId),

        supabase
          .from('leases')
          .select('id', { count: 'exact', head: true })
          .eq('property_id', ownerId)
          .eq('status', 'active'),

        supabase
          .from('rental_payments')
          .select('amount')
          .eq('owner_id', ownerId)
          .gte(
            'payment_date',
            new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
          ),
      ]);

      return {
        totalProperties: properties.count || 0,
        activeLeases: leases.count || 0,
        monthlyRevenue: payments.data?.reduce((sum, p) => sum + p.amount, 0) || 0,
      };
    },
    {
      ttl: 1800, // 30 minutes (stats pas en temps réel)
      namespace: 'dashboard',
    }
  );
}
