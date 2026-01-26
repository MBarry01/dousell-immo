/**
 * Version cachée de rentalService pour Gestion Locative
 *
 * Pattern utilisé : Cache-Aside avec TTL court (données changeantes)
 * - Baux : TTL 5 min (modifiés rarement, consultés souvent)
 * - Paiements : TTL 2 min (changent régulièrement)
 * - Stats : TTL 10 min (calculs coûteux, acceptable avec lag)
 *
 * @see REDIS_CACHE_STRATEGY.md
 */

import { getOrSetCache } from "@/lib/cache/cache-aside";
import { createClient } from "@/utils/supabase/server";

/**
 * 📋 Récupérer les baux d'un propriétaire (avec cache)
 *
 * TTL : 5 minutes
 * Cache key : `leases:{ownerId}:{status}`
 * 
 * Note: Récupère les baux où owner_id = ownerId OU team_id correspond à une équipe de l'utilisateur
 */
export async function getLeasesByOwner(
  ownerId: string,
  status: "active" | "terminated" | "all" = "active"
) {
  return getOrSetCache(
    `leases:${ownerId}:${status}`,
    async () => {
      const supabase = await createClient();

      // Récupérer les team_ids de l'utilisateur
      const { data: teamMemberships } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", ownerId);

      const userTeamIds = teamMemberships?.map(tm => tm.team_id) || [];

      // Construire la requête avec OR: owner_id OU team_id
      // Jointure avec properties pour avoir le titre du bien
      let query = supabase
        .from("leases")
        .select(`
          id, tenant_name, tenant_phone, tenant_email, property_address, monthly_amount, 
          billing_day, start_date, end_date, status, created_at, lease_pdf_url, team_id, owner_id, property_id,
          properties:property_id(id, title, images)
        `)
        .order("created_at", { ascending: false });

      // Filtre: owner_id = ownerId OU team_id dans les équipes de l'utilisateur
      if (userTeamIds.length > 0) {
        query = query.or(`owner_id.eq.${ownerId},team_id.in.(${userTeamIds.join(',')})`);
      } else {
        query = query.eq("owner_id", ownerId);
      }

      if (status !== "all") {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Transformer properties de array à objet simple (Supabase retourne un array)
      return (data || []).map(lease => ({
        ...lease,
        properties: Array.isArray(lease.properties)
          ? lease.properties[0] || null
          : lease.properties
      }));
    },
    {
      ttl: 300, // 5 minutes
      namespace: "rentals",
      debug: true,
    }
  );
}

/**
 * 💰 Récupérer les transactions de loyer pour des baux (avec cache)
 *
 * TTL : 2 minutes (paiements changent fréquemment)
 * Cache key : `rental_transactions:{leaseIds hash}`
 */
export async function getRentalTransactions(leaseIds: string[]) {
  if (leaseIds.length === 0) {
    return [];
  }

  // Stratégie : Cache par Bail (Granulaire)
  // Cela permet d'invalider facilement le cache d'un seul bail lors d'un paiement
  // Clé : rental_transactions:lease:{leaseId}

  const transactionsPromises = leaseIds.map(async (leaseId) => {
    return getOrSetCache(
      `rental_transactions:${leaseId}`, // Clé simple prédicible !
      async () => {
        const supabase = await createClient();
        const { data, error } = await supabase
          .from("rental_transactions")
          .select(
            "id, lease_id, period_month, period_year, status, amount_due, paid_at, period_start, period_end"
          )
          .eq("lease_id", leaseId)
          .order("period_year", { ascending: false })
          .order("period_month", { ascending: false });

        if (error) throw error;
        return data || [];
      },
      {
        ttl: 300, // 5 minutes
        namespace: "rentals",
        debug: true,
      }
    );
  });

  const results = await Promise.all(transactionsPromises);

  // Aplatir les résultats (tableau de tableaux -> tableau plat)
  return results.flat();
}

/**
 * 📊 Récupérer les statistiques de gestion locative (avec cache)
 *
 * TTL : 10 minutes (calculs coûteux, acceptable avec lag)
 * Cache key : `rental_stats:{ownerId}`
 */
export async function getRentalStatsByOwner(ownerId: string) {
  return getOrSetCache(
    `rental_stats:${ownerId}`,
    async () => {
      const supabase = await createClient();

      // Récupérer tous les baux actifs
      const { data: leases } = await supabase
        .from("leases")
        .select("id, monthly_amount")
        .eq("owner_id", ownerId)
        .eq("status", "active");

      if (!leases || leases.length === 0) {
        return {
          totalLeases: 0,
          activeLeases: 0,
          monthlyRevenue: 0,
          pendingPayments: 0,
          paidThisMonth: 0,
        };
      }

      const leaseIds = leases.map((l) => l.id);

      // Récupérer les transactions du mois en cours
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const { data: transactions } = await supabase
        .from("rental_transactions")
        .select("status, amount_due")
        .in("lease_id", leaseIds)
        .eq("period_month", currentMonth)
        .eq("period_year", currentYear);

      const pendingPayments =
        transactions?.filter((t) => t.status === "pending").length || 0;
      const paidThisMonth =
        transactions?.filter((t) => t.status === "paid").length || 0;

      const monthlyRevenue = leases.reduce(
        (sum, lease) => sum + (lease.monthly_amount || 0),
        0
      );

      return {
        totalLeases: leases.length,
        activeLeases: leases.length,
        monthlyRevenue,
        pendingPayments,
        paidThisMonth,
      };
    },
    {
      ttl: 600, // 10 minutes
      namespace: "rentals",
      debug: true,
    }
  );
}

/**
 * 🏠 Récupérer un bail par ID (avec cache)
 *
 * TTL : 10 minutes
 * Cache key : `lease_detail:{leaseId}`
 */
export async function getLeaseById(leaseId: string) {
  return getOrSetCache(
    `lease_detail:${leaseId}`,
    async () => {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from("leases")
        .select("*")
        .eq("id", leaseId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null;
        }
        throw error;
      }

      return data;
    },
    {
      ttl: 600, // 10 minutes
      namespace: "rentals",
      debug: true,
    }
  );
}

/**
 * 📅 Récupérer les paiements en retard (avec cache)
 *
 * TTL : 5 minutes
 * Cache key : `late_payments:{ownerId}`
 */
export async function getLatePaymentsByOwner(ownerId: string) {
  return getOrSetCache(
    `late_payments:${ownerId}`,
    async () => {
      const supabase = await createClient();

      // 1. Récupérer les baux actifs
      const { data: leases } = await supabase
        .from("leases")
        .select("id, tenant_name, property_address")
        .eq("owner_id", ownerId)
        .eq("status", "active");

      if (!leases || leases.length === 0) {
        return [];
      }

      const leaseIds = leases.map((l) => l.id);

      // 2. Récupérer les transactions en retard
      const today = new Date();
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();

      const { data: lateTransactions } = await supabase
        .from("rental_transactions")
        .select("id, lease_id, period_month, period_year, amount_due")
        .in("lease_id", leaseIds)
        .eq("status", "pending")
        .or(
          `period_year.lt.${currentYear},and(period_year.eq.${currentYear},period_month.lt.${currentMonth})`
        );

      // Joindre avec les infos du bail
      const latePayments = (lateTransactions || []).map((transaction) => {
        const lease = leases.find((l) => l.id === transaction.lease_id);
        return {
          ...transaction,
          tenant_name: lease?.tenant_name,
          property_address: lease?.property_address,
        };
      });

      return latePayments;
    },
    {
      ttl: 300, // 5 minutes
      namespace: "rentals",
      debug: true,
    }
  );
}

/**
 * 📄 Récupérer le profil propriétaire pour quittances (avec cache)
 *
 * TTL : 1 heure (change très rarement)
 * Cache key : `owner_profile:{ownerId}`
 */
export async function getOwnerProfileForReceipts(ownerId: string) {
  return getOrSetCache(
    `owner_profile:${ownerId}`,
    async () => {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from("profiles")
        .select(
          "company_name, company_address, company_email, company_ninea, signature_url, logo_url, full_name"
        )
        .eq("id", ownerId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    {
      ttl: 3600, // 1 heure
      namespace: "rentals",
      debug: true,
    }
  );
}

/**
 * 📨 Récupérer les messages d'un bail (avec cache)
 *
 * TTL : 1 minute (messages changent rapidement)
 * Cache key : `lease_messages:{leaseId}`
 */
export async function getLeaseMessages(leaseId: string) {
  return getOrSetCache(
    `lease_messages:${leaseId}`,
    async () => {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from("lease_messages")
        .select("*")
        .eq("lease_id", leaseId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    {
      ttl: 60, // 1 minute (messages temps réel)
      namespace: "rentals",
      debug: true,
    }
  );
}

/**
 * 🏠 Récupérer les informations du dashboard utilisateur (avec cache)
 *
 * TTL : 5 minutes
 * Cache key : `dashboard_info:{userId}`
 */
export async function getUserDashboardInfo(userId: string, email: string) {
  return getOrSetCache(
    `dashboard_info:${userId}`,
    async () => {
      const supabase = await createClient();

      // 1. Vérifier si c'est un locataire
      const { data: lease } = await supabase
        .from("leases")
        .select("id")
        .eq("tenant_email", email)
        .eq("status", "active")
        .maybeSingle();

      const isTenant = !!lease;

      // 2. Vérifier si c'est un propriétaire
      const { count: propertyCount } = await supabase
        .from("properties")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", userId);

      const isOwner = (propertyCount || 0) > 0;

      // 3. Récupérer le profil pour statut gestion locative
      const { data: profile } = await supabase
        .from("profiles")
        .select("gestion_locative_status, gestion_locative_enabled")
        .eq("id", userId)
        .single();

      return {
        isTenant,
        isOwner,
        gestionLocativeEnabled: profile?.gestion_locative_enabled || false,
        gestionLocativeStatus: profile?.gestion_locative_status || "inactive",
      };
    },
    {
      ttl: 300, // 5 minutes
      namespace: "rentals",
      debug: true,
    }
  );
}


