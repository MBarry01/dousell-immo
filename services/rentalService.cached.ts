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
  // Si pas de baux ET pas d'équipe, on ne peut rien faire
  if (leaseIds.length === 0 && !teamId) {
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
        const { data, error } = await supabase
          .from("rental_transactions")
          .select(
            "id, lease_id, period_month, period_year, status, amount_due, amount_paid, paid_at, period_start, period_end, payment_method, payment_ref"
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
      if (!allTransactions) return [];

      // Si aucun ID spécifié, on retourne TOUTES les transactions de l'équipe
      if (leaseIds.length === 0) return allTransactions;

      // Sinon on filtre
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
          "id, lease_id, period_month, period_year, status, amount_due, amount_paid, paid_at, period_start, period_end, payment_method, payment_ref"
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

      // Joindre avec les infos du bail (Map lookup O(1) au lieu de .find() O(n))
      const leaseMap = new Map(
        (leases || []).map((l) => [l.id, l])
      );
      const latePayments = (lateTransactions || []).map((transaction) => {
        const lease = leaseMap.get(transaction.lease_id);
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

      // 1+2. Profil ET team_member EN PARALLÈLE (au lieu de séquentiel)
      const [
        { data: profile, error: profileError },
        { data: member },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "company_name, company_address, company_email, company_ninea, signature_url, logo_url, full_name, phone"
          )
          .eq("id", ownerId)
          .maybeSingle(),
        supabase
          .from("team_members")
          .select("team_id")
          .eq("user_id", ownerId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (profileError) throw profileError;

      // 3. Team lookup (dépend du résultat de member)
      let teamData = null;
      if (member) {
        const { data: team } = await supabase
          .from("teams")
          .select("*")
          .eq("id", member.team_id)
          .single();
        teamData = team;
      } else {
        const { data: team } = await supabase
          .from("teams")
          .select("*")
          .eq("created_by", ownerId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        teamData = team;
      }

      // Fusionner les données (Priorité Team > Profil)
      return {
        ...(profile || {}),
        company_name: teamData?.name || profile?.company_name || null,
        company_address: teamData?.company_address || profile?.company_address || null,
        company_email: teamData?.company_email || profile?.company_email || null,
        company_ninea: teamData?.company_ninea || profile?.company_ninea || null,
        company_phone: teamData?.company_phone || profile?.phone || null,
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

      // TOUTES les requêtes en PARALLÈLE (au lieu de 3 séquentielles)
      const [
        { data: lease },
        { count: propertyCount },
        { data: profile },
      ] = await Promise.all([
        // 1. Vérifier si c'est un locataire
        supabase
          .from("leases")
          .select("id")
          .eq("tenant_email", email)
          .eq("status", "active")
          .maybeSingle(),
        // 2. Vérifier si c'est un propriétaire
        supabase
          .from("properties")
          .select("id", { count: "exact", head: true })
          .eq("owner_id", userId),
        // 3. Profil pour statut gestion locative
        supabase
          .from("profiles")
          .select("gestion_locative_status, gestion_locative_enabled")
          .eq("id", userId)
          .maybeSingle(),
      ]);

      return {
        isTenant: !!lease,
        isOwner: (propertyCount || 0) > 0,
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

/**
 * 📊 KPIs Avancés du Dashboard (avec cache)
 *
 * TTL : 10 minutes (calculs coûteux, acceptable avec lag)
 * Cache key : `advanced_stats:{teamId}`
 */
export async function getAdvancedStatsCached(teamId: string) {
  return getOrSetCache(
    `advanced_stats:${teamId}`,
    async () => {
      const supabase = await createClient();

      // TOUTES les requêtes en PARALLÈLE (au lieu de 5 séquentielles)
      const [
        { count: totalProperties },
        { data: activeLeases },
        { data: paidTransactions },
        { count: totalTransCount },
        { count: failedCount },
      ] = await Promise.all([
        // 1. Nombre total de biens
        supabase
          .from("properties")
          .select("*", { count: "exact", head: true })
          .eq("team_id", teamId),
        // 2. Baux actifs
        supabase
          .from("leases")
          .select("id, monthly_amount, billing_day, property_address")
          .eq("team_id", teamId)
          .eq("status", "active"),
        // 3. Dernières transactions payées (délai moyen)
        supabase
          .from("rental_transactions")
          .select("lease_id, paid_at, period_month, period_year")
          .eq("team_id", teamId)
          .eq("status", "paid")
          .not("paid_at", "is", null)
          .order("paid_at", { ascending: false })
          .limit(50),
        // 4. Total transactions (COUNT)
        supabase
          .from("rental_transactions")
          .select("*", { count: "exact", head: true })
          .eq("team_id", teamId),
        // 5. Transactions échouées (COUNT)
        supabase
          .from("rental_transactions")
          .select("*", { count: "exact", head: true })
          .eq("team_id", teamId)
          .in("status", ["failed", "rejected"]),
      ]);

      const activeLeasesCount = activeLeases?.length || 0;

      // Taux d'occupation
      let occupancyBase = totalProperties || 0;
      if (occupancyBase === 0 && activeLeasesCount > 0) {
        const uniqueAddresses = new Set(
          (activeLeases || []).map((l) =>
            l.property_address?.toLowerCase().trim()
          )
        );
        occupancyBase = uniqueAddresses.size;
      }

      const rawOccupancyRate =
        occupancyBase > 0
          ? Math.round((activeLeasesCount / occupancyBase) * 100)
          : activeLeasesCount > 0
            ? 100
            : 0;

      const occupancyRate = Math.min(rawOccupancyRate, 100);

      // Délai moyen de paiement (lookup par Map au lieu de .find())
      const leaseMap = new Map(
        (activeLeases || []).map((l) => [l.id, l])
      );

      let totalDelay = 0;
      let delayCount = 0;

      paidTransactions?.forEach((t) => {
        const lease = leaseMap.get(t.lease_id);
        if (lease && t.paid_at && t.period_month && t.period_year) {
          const billingDay = lease.billing_day || 5;
          const expectedDate = new Date(
            t.period_year,
            t.period_month - 1,
            billingDay
          );
          const paidDate = new Date(t.paid_at);
          const diffDays = Math.floor(
            (paidDate.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (diffDays >= 0) {
            totalDelay += diffDays;
            delayCount++;
          }
        }
      });

      const avgPaymentDelay =
        delayCount > 0 ? Math.round(totalDelay / delayCount) : 0;

      // Taux d'impayés
      const unpaidRate =
        totalTransCount && totalTransCount > 0
          ? Math.round(((failedCount || 0) / totalTransCount) * 100)
          : 0;

      // Revenu moyen par bien loué
      const totalMonthlyRevenue =
        activeLeases?.reduce((acc, l) => acc + Number(l.monthly_amount), 0) || 0;
      const avgRevenuePerProperty =
        activeLeasesCount > 0
          ? Math.round(totalMonthlyRevenue / activeLeasesCount)
          : 0;

      return {
        occupancyRate,
        avgPaymentDelay,
        unpaidRate,
        avgRevenuePerProperty,
        totalProperties: totalProperties || 0,
        activeLeases: activeLeasesCount,
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
 * 📈 Historique des Revenus (avec cache)
 *
 * TTL : 10 minutes (calculs coûteux, acceptable avec lag)
 * Cache key : `revenue_history:{teamId}:{months}`
 */
export async function getRevenueHistoryCached(
  teamId: string,
  months: number = 12
) {
  return getOrSetCache(
    `revenue_history:${teamId}:${months}`,
    async () => {
      const supabase = await createClient();

      const today = new Date();
      const history: {
        month: string;
        year: number;
        monthNum: number;
        collected: number;
        expected: number;
      }[] = [];

      // Calculer la fenêtre de temps
      const pastDate = new Date(today.getFullYear(), today.getMonth() - months, 1);
      const minYear = pastDate.getFullYear();

      // Récupérer TOUTES les transactions pertinentes en UNE SEULE requête
      const { data: transactions } = await supabase
        .from("rental_transactions")
        .select("amount_due, status, period_month, period_year")
        .eq("team_id", teamId)
        .gte("period_year", minYear);

      // Pré-indexer les transactions par clé "year-month" (O(n) au lieu de O(n*m))
      const txByMonth = new Map<string, { collected: number; expected: number }>();
      for (const t of transactions || []) {
        const key = `${t.period_year}-${t.period_month}`;
        const entry = txByMonth.get(key) || { collected: 0, expected: 0 };
        const amount = Number(t.amount_due || 0);
        entry.expected += amount;
        if (t.status === "paid") entry.collected += amount;
        txByMonth.set(key, entry);
      }

      // Construire l'historique avec lookup O(1) par mois
      for (let i = months - 1; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthNum = date.getMonth() + 1;
        const year = date.getFullYear();
        const monthName = date.toLocaleDateString("fr-FR", { month: "short" });

        const entry = txByMonth.get(`${year}-${monthNum}`) || { collected: 0, expected: 0 };

        history.push({
          month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
          year,
          monthNum,
          collected: entry.collected,
          expected: entry.expected,
        });
      }

      return history;
    },
    {
      ttl: 600, // 10 minutes
      namespace: "rentals",
      debug: true,
    }
  );
}


