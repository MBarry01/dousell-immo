'use server';

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

export async function getLeasesByTeam(
  teamId: string,
  status: "active" | "terminated" | "all" = "active"
) {
  return getOrSetCache(
    `leases:${teamId}:${status}`,
    async () => {
      const supabase = await createClient();

      // Requête simple filtrée par team_id
      let query = supabase
        .from("leases")
        .select(`
          id, tenant_name, tenant_phone, tenant_email, property_address, monthly_amount, 
          billing_day, start_date, end_date, status, created_at, lease_pdf_url, team_id, owner_id, property_id,
          properties:property_id(id, title, images)
        `)
        .eq("team_id", teamId)
        .order("created_at", { ascending: false });

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
 * TTL : 5 minutes
 * Cache key : `rental_transactions:team:{teamId}` (si teamId fourni)
 * ou `rental_transactions:bulk:{leaseIds hash}` (fallback)
 */
export async function getRentalTransactions(leaseIds: string[], teamId?: string) {
  if (leaseIds.length === 0) {
    return [];
  }

  // OPTIMISATION : Si teamId est fourni, on cache par ÉQUIPE
  // Cela permet une invalidation simple et efficace lors des paiements
  if (teamId) {
    return getOrSetCache(
      `rental_transactions:team:${teamId}`,
      async () => {
        const supabase = await createClient();

        // On récupère TOUTES les transactions de l'équipe (plus efficace pour le dashboard global)
        // La filtration par leaseIds se fera en mémoire si nécessaire, mais pour le dashboard
        // on affiche généralement tout.
        const { data, error } = await supabase
          .from("rental_transactions")
          .select(
            "id, lease_id, period_month, period_year, status, amount_due, paid_at, period_start, period_end, payment_method, payment_ref"
          )
          .eq("team_id", teamId)
          .order("period_year", { ascending: false })
          .order("period_month", { ascending: false });

        if (error) throw error;
        return data || [];
      },
      {
        ttl: 300,
        namespace: "rentals",
        debug: true,
      }
    ).then(allTransactions => {
      // Filtrer pour ne retourner que ceux demandés (sécurité/cohérence)
      if (!allTransactions) return [];
      const leaseIdSet = new Set(leaseIds);
      return allTransactions.filter(t => leaseIdSet.has(t.lease_id));
    });
  }

  // FALLBACK : Ancien comportement (cache par liste d'IDs)
  return getOrSetCache(
    `rental_transactions:bulk:${leaseIds.sort().join('_')}`,
    async () => {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("rental_transactions")
        .select(
          "id, lease_id, period_month, period_year, status, amount_due, paid_at, period_start, period_end, payment_method, payment_ref"
        )
        .in("lease_id", leaseIds)
        .order("period_year", { ascending: false })
        .order("period_month", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    {
      ttl: 300,
      namespace: "rentals",
      debug: true,
    }
  );
}

/**
 * 📊 Récupérer les statistiques de gestion locative (avec cache)
 *
 * TTL : 10 minutes (calculs coûteux, acceptable avec lag)
 * Cache key : `rental_stats:{ownerId}`
 */
export async function getRentalStatsByTeam(teamId: string) {
  return getOrSetCache(
    `rental_stats:${teamId}`,
    async () => {
      const supabase = await createClient();

      // Récupérer tous les baux actifs de l'équipe
      const { data: leases } = await supabase
        .from("leases")
        .select("id, monthly_amount")
        .eq("team_id", teamId)
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
export async function getLatePaymentsByTeam(teamId: string) {
  return getOrSetCache(
    `late_payments:${teamId}`,
    async () => {
      const supabase = await createClient();

      // 1. Récupérer les baux actifs de l'équipe
      const { data: leases } = await supabase
        .from("leases")
        .select("id, tenant_name, property_address")
        .eq("team_id", teamId)
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

      // 1. Récupérer le profil utilisateur (base)
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select(
          "company_name, company_address, company_email, company_ninea, signature_url, logo_url, full_name"
        )
        .eq("id", ownerId)
        .maybeSingle();

      if (profileError) throw profileError;

      // 2. Chercher l'équipe (Agence)
      // Priorité à l'équipe où l'utilisateur est membre
      const { data: member } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", ownerId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      let teamData = null;
      if (member) {
        const { data: team } = await supabase
          .from("teams")
          .select("*")
          .eq("id", member.team_id)
          .single();
        teamData = team;
      } else {
        // Fallback: Chercher via ownership direct
        const { data: team } = await supabase
          .from("teams")
          .select("*")
          .eq("created_by", ownerId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        teamData = team;
      }

      // 3. Fusionner les données (Priorité Team > Profil)
      return {
        ...(profile || {}),
        company_name: teamData?.name || profile?.company_name,
        company_address: teamData?.company_address || profile?.company_address,
        company_email: teamData?.company_email || profile?.company_email,
        company_ninea: teamData?.company_ninea || profile?.company_ninea,
        company_phone: teamData?.company_phone || null, // Ajout si dispo dans teams
        logo_url: teamData?.logo_url || profile?.logo_url,
        signature_url: teamData?.signature_url || profile?.signature_url,
      };
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

export async function getExpensesByTeam(teamId: string) {
  return getOrSetCache(
    `expenses:${teamId}`,
    async () => {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("expenses")
        .select("id, amount, expense_date, category, description, lease_id, team_id, owner_id")
        .eq("team_id", teamId)
        .order("expense_date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    { ttl: 300, namespace: "rentals" }
  );
}


