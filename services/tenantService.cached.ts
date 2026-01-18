/**
 * Version cachée de tenantService pour Portail Locataire
 *
 * Pattern utilisé : Cache-Aside avec TTL court (données locataires)
 * - Dashboard : TTL 2 min (statut paiement change)
 * - Documents : TTL 10 min (changent rarement)
 * - Paiements : TTL 1 min (temps quasi-réel)
 *
 * @see REDIS_CACHE_STRATEGY.md
 */

import { getOrSetCache } from "@/lib/cache/cache-aside";
import { redirect } from "next/navigation";

/**
 * 🏠 Récupérer les données du dashboard locataire (avec cache)
 *
 * TTL : 2 minutes (statut paiement change fréquemment)
 * Cache key : `tenant_dashboard:{email}`
 */
export async function getTenantDashboardData(userEmail: string) {
  return getOrSetCache(
    `tenant_dashboard:${userEmail}`,
    async () => {
      // Import dynamique pour éviter les dépendances circulaires
      const { createClient } = await import("@supabase/supabase-js");

      // Utiliser Admin Client pour contourner RLS
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error(
          "🚨 CRITIQUE: SUPABASE_SERVICE_ROLE_KEY manquante !"
        );
        return { hasLease: false };
      }

      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );

      const { data: lease, error } = await supabaseAdmin
        .from("leases")
        .select(
          `
          *,
          property:properties(title, location),
          owner:profiles(full_name, phone),
          payments:rental_transactions(id, status, amount_due, period_start, period_end, paid_at)
        `
        )
        .eq("tenant_email", userEmail)
        .eq("status", "active")
        .maybeSingle();

      // Ne logger que les vraies erreurs (pas les résultats vides)
      if (error && error.code && error.code !== 'PGRST116') {
        console.error("Erreur récupération bail locataire:", error);
      }

      if (!lease) {
        return { hasLease: false };
      }

      // Calculs financiers
      const currentMonthStart = new Date();
      currentMonthStart.setDate(1);
      currentMonthStart.setHours(0, 0, 0, 0);

      const payments = lease.payments || [];
      payments.sort(
        (a: any, b: any) =>
          new Date(b.period_start).getTime() -
          new Date(a.period_start).getTime()
      );

      const lastPayment = payments[0];
      const isUpToDate = lastPayment?.status === "paid";

      return {
        hasLease: true,
        lease,
        isUpToDate,
        tenantName: lease.tenant_name,
      };
    },
    {
      ttl: 120, // 2 minutes
      namespace: "rentals",
      debug: true,
    }
  );
}

/**
 * 📄 Récupérer les documents d'un locataire (avec cache)
 *
 * TTL : 10 minutes
 * Cache key : `tenant_documents:{leaseId}`
 */
export async function getTenantDocuments(leaseId: string) {
  return getOrSetCache(
    `tenant_documents:${leaseId}`,
    async () => {
      const { createClient } = await import("@supabase/supabase-js");

      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );

      // Récupérer toutes les quittances pour ce bail
      const { data: receipts } = await supabaseAdmin
        .from("rental_transactions")
        .select("*")
        .eq("lease_id", leaseId)
        .eq("status", "paid")
        .order("period_start", { ascending: false });

      return {
        receipts: receipts || [],
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
 * 💰 Récupérer les paiements d'un locataire (avec cache)
 *
 * TTL : 1 minute (quasi temps-réel)
 * Cache key : `tenant_payments:{leaseId}`
 */
export async function getTenantPayments(leaseId: string) {
  return getOrSetCache(
    `tenant_payments:${leaseId}`,
    async () => {
      const { createClient } = await import("@supabase/supabase-js");

      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );

      const { data: payments } = await supabaseAdmin
        .from("rental_transactions")
        .select("*")
        .eq("lease_id", leaseId)
        .order("period_start", { ascending: false });

      return payments || [];
    },
    {
      ttl: 60, // 1 minute
      namespace: "rentals",
      debug: true,
    }
  );
}

/**
 * 🔧 Récupérer les demandes de maintenance d'un locataire (avec cache)
 *
 * TTL : 5 minutes
 * Cache key : `tenant_maintenance:{leaseId}`
 */
export async function getTenantMaintenanceRequests(leaseId: string) {
  return getOrSetCache(
    `tenant_maintenance:${leaseId}`,
    async () => {
      const { createClient } = await import("@supabase/supabase-js");

      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );

      const { data: requests } = await supabaseAdmin
        .from("maintenance_requests")
        .select("*")
        .eq("lease_id", leaseId)
        .order("created_at", { ascending: false });

      return requests || [];
    },
    {
      ttl: 300, // 5 minutes
      namespace: "rentals",
      debug: true,
    }
  );
}
