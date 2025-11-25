"use server";

import { createClient } from "@/utils/supabase/server";
import { requireAnyRole } from "@/lib/permissions";

export type DashboardStats = {
  propertiesApproved: number;
  propertiesPending: number;
  leadsLast30Days: number;
  totalUsers: number;
};

export type RecentActivity = {
  id: string;
  type: "property" | "lead" | "user";
  message: string;
  date: Date;
};

export type ChartDataPoint = {
  month: string;
  visites: number;
  leads: number;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  await requireAnyRole();
  const supabase = await createClient();

  try {
    // Biens approuvés
    const { count: approvedCount } = await supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("validation_status", "approved");

    // Biens en attente
    const { count: pendingCount } = await supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("validation_status", "pending");

    // Leads des 30 derniers jours
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { count: leadsCount } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo.toISOString());

    // Total utilisateurs - Utiliser la fonction RPC si disponible, sinon fallback
    let usersCount = 0;
    try {
      // Méthode 1: Essayer d'utiliser la fonction RPC get_total_users (recommandé)
      const { data: rpcCount, error: rpcError } = await supabase.rpc("get_total_users");

      if (!rpcError && typeof rpcCount === "number") {
        usersCount = rpcCount;
      } else {
        // Méthode 2: Compter depuis la table users si elle existe
        const { count: usersTableCount, error: usersTableError } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true });

        if (!usersTableError && usersTableCount !== null) {
          usersCount = usersTableCount;
        } else {
          // Méthode 3: Compter les utilisateurs uniques qui ont créé des propriétés ou des leads
          // Récupérer tous les user_id distincts depuis properties
          const { data: propertyUsers } = await supabase
            .from("properties")
            .select("user_id");

          // Récupérer tous les user_id distincts depuis user_roles
          const { data: roleUsers } = await supabase
            .from("user_roles")
            .select("user_id");

          // Combiner tous les user_id et compter les uniques
          const allUserIds = new Set<string>();
          
          if (propertyUsers) {
            propertyUsers.forEach((p: any) => {
              if (p.user_id) allUserIds.add(p.user_id);
            });
          }
          
          if (roleUsers) {
            roleUsers.forEach((r: any) => {
              if (r.user_id) allUserIds.add(r.user_id);
            });
          }

          usersCount = allUserIds.size;
        }
      }
    } catch (error) {
      console.error("Error counting users:", error);
      // Fallback: Compter uniquement depuis user_roles
      try {
        const { data: userRoles } = await supabase
          .from("user_roles")
          .select("user_id");
        
        if (userRoles) {
          const uniqueUserIds = new Set(userRoles.map((ur: any) => ur.user_id));
          usersCount = uniqueUserIds.size;
        }
      } catch (fallbackError) {
        console.error("Error in fallback user count:", fallbackError);
        usersCount = 0;
      }
    }

    return {
      propertiesApproved: approvedCount ?? 0,
      propertiesPending: pendingCount ?? 0,
      leadsLast30Days: leadsCount ?? 0,
      totalUsers: usersCount,
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return {
      propertiesApproved: 0,
      propertiesPending: 0,
      leadsLast30Days: 0,
      totalUsers: 0,
    };
  }
}

export async function getRecentProperties(limit: number = 5) {
  await requireAnyRole();
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("properties")
      .select("id, title, price, status, images, created_at, validation_status")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("❌ Error in getRecentProperties:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        fullError: JSON.stringify(error, null, 2)
      });
      throw error;
    }

    return (
      data?.map((p) => ({
        id: p.id,
        title: p.title,
        price: p.price,
        status: p.status ?? "disponible",
        image: Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null,
        createdAt: new Date(p.created_at),
        validationStatus: p.validation_status,
      })) ?? []
    );
  } catch (error) {
    console.error("❌ Unexpected error in getRecentProperties:", {
      error,
      message: error instanceof Error ? error.message : String(error),
      code: (error as any)?.code,
      details: (error as any)?.details,
      hint: (error as any)?.hint,
      fullError: error ? JSON.stringify(error, null, 2) : null
    });
    return [];
  }
}

export async function getRecentActivity(limit: number = 5): Promise<RecentActivity[]> {
  await requireAnyRole();
  const supabase = await createClient();

  try {
    const activities: RecentActivity[] = [];

    // Récupérer les biens récents
    const { data: recentProperties } = await supabase
      .from("properties")
      .select("id, title, created_at, validation_status")
      .order("created_at", { ascending: false })
      .limit(3);

    if (recentProperties) {
      recentProperties.forEach((p) => {
        activities.push({
          id: p.id,
          type: "property",
          message:
            p.validation_status === "pending"
              ? `Nouveau bien en attente: ${p.title}`
              : `Bien approuvé: ${p.title}`,
          date: new Date(p.created_at),
        });
      });
    }

    // Récupérer les leads récents
    const { data: recentLeads } = await supabase
      .from("leads")
      .select("id, full_name, created_at")
      .order("created_at", { ascending: false })
      .limit(2);

    if (recentLeads) {
      recentLeads.forEach((lead) => {
        activities.push({
          id: lead.id,
          type: "lead",
          message: `Nouveau message de ${lead.full_name}`,
          date: new Date(lead.created_at),
        });
      });
    }

    // Trier par date et limiter
    return activities
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, limit);
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    return [];
  }
}

/**
 * Récupère les données pour le graphique (leads par mois sur les 6 derniers mois)
 */
export async function getChartData(): Promise<ChartDataPoint[]> {
  await requireAnyRole();
  const supabase = await createClient();

  try {
    // Récupérer les leads des 6 derniers mois
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const { data: leads, error: leadsError } = await supabase
      .from("leads")
      .select("created_at")
      .gte("created_at", sixMonthsAgo.toISOString());

    if (leadsError) {
      console.error("❌ Error fetching leads for chart:", {
        error: leadsError,
        message: leadsError.message,
        code: leadsError.code,
        details: leadsError.details,
        hint: leadsError.hint,
        fullError: JSON.stringify(leadsError, null, 2)
      });
      return getDefaultChartData();
    }

    // Récupérer les propriétés approuvées des 6 derniers mois (pour les "visites")
    const { data: properties, error: propertiesError } = await supabase
      .from("properties")
      .select("created_at")
      .eq("validation_status", "approved")
      .gte("created_at", sixMonthsAgo.toISOString());

    if (propertiesError) {
      console.error("Error fetching properties for chart:", {
        error: propertiesError,
        message: propertiesError.message,
        code: propertiesError.code,
        details: propertiesError.details,
        hint: propertiesError.hint,
      });
    }

    // Grouper par mois
    const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"];
    const chartData: ChartDataPoint[] = [];
    
    // Créer un objet pour chaque mois des 6 derniers mois
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const monthName = monthNames[date.getMonth()];
      
      // Compter les leads de ce mois
      const leadsCount = (leads || []).filter((lead) => {
        const leadDate = new Date(lead.created_at);
        return leadDate.getFullYear() === date.getFullYear() && 
               leadDate.getMonth() === date.getMonth();
      }).length;

      // Compter les propriétés approuvées de ce mois (utilisé comme proxy pour les visites)
      const propertiesCount = (properties || []).filter((prop) => {
        const propDate = new Date(prop.created_at);
        return propDate.getFullYear() === date.getFullYear() && 
               propDate.getMonth() === date.getMonth();
      }).length;

      // Multiplier les propriétés par un facteur pour simuler les visites
      // (car on n'a pas de table de visites réelle)
      const visitesCount = propertiesCount * 10; // Approximation

      chartData.push({
        month: monthName,
        visites: visitesCount,
        leads: leadsCount,
      });
    }

    return chartData;
  } catch (error) {
    console.error("Error in getChartData:", {
      error,
      message: error instanceof Error ? error.message : String(error),
      code: (error as any)?.code,
      details: (error as any)?.details,
      hint: (error as any)?.hint,
    });
    return getDefaultChartData();
  }
}

/**
 * Retourne des données par défaut si la récupération échoue
 */
function getDefaultChartData(): ChartDataPoint[] {
  return [
    { month: "Jan", visites: 0, leads: 0 },
    { month: "Fév", visites: 0, leads: 0 },
    { month: "Mar", visites: 0, leads: 0 },
    { month: "Avr", visites: 0, leads: 0 },
    { month: "Mai", visites: 0, leads: 0 },
    { month: "Juin", visites: 0, leads: 0 },
  ];
}


