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

export type RecentProperty = {
  id: string;
  title: string;
  price: number;
  status: string;
  image: string | null;
  createdAt: Date;
  validationStatus: string;
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
      .from("visit_requests")
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
      .from("visit_requests")
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
      .from("visit_requests")
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

export type PerformanceStats = {
  totals: {
    views: number;
    clicks: number;
    whatsappCount: number;
    phoneCount: number;
  };
  chart: {
    date: string;
    views: number;
    clicks: number;
  }[];
  topProperties: {
    id: string;
    title: string;
    image: string | null;
    price: number;
    views: number;
    clicks: number;
  }[];
};

export type DashboardChartDataPoint = {
  date: string;
  views: number;
  clicks: number;
};

/**
 * Récupère les statistiques de performance
 * @param days - Nombre de jours à récupérer (par défaut 30)
 */
export async function getPerformanceStats(days: number = 30): Promise<PerformanceStats | null> {
  await requireAnyRole();
  const supabase = await createClient();

  try {
    // 1. Calculer les vues totales depuis la colonne view_count (optimisé)
    const { data: properties, error: propertiesError } = await supabase
      .from("properties")
      .select("view_count")
      .eq("validation_status", "approved");

    if (propertiesError) {
      console.error("Error fetching properties view_count:", propertiesError);
      return null;
    }

    const totalViews = properties.reduce((sum, p) => sum + (p.view_count || 0), 0);

    // 2. Récupérer les clics selon la période demandée (historique complet conservé)
    const clicksPeriodStart = new Date();
    clicksPeriodStart.setDate(clicksPeriodStart.getDate() - days);

    const { data: stats, error: statsError } = await supabase
      .from("property_stats")
      .select("property_id, action_type, created_at")
      .in("action_type", ["whatsapp_click", "phone_click"])
      .gte("created_at", clicksPeriodStart.toISOString());

    if (statsError) {
      console.error("Error fetching performance stats:", statsError);
      return null;
    }

    // 3. Calculer les totaux de clics avec détail par type
    const whatsappCount = stats.filter((s) => s.action_type === "whatsapp_click").length;
    const phoneCount = stats.filter((s) => s.action_type === "phone_click").length;
    const totalClicks = stats.length;

    // 4. Récupérer les données réelles du graphique groupées par jour
    // Récupérer directement depuis property_stats pour avoir les vraies données
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - days);
    periodStart.setHours(0, 0, 0, 0);

    const { data: allStats, error: allStatsError } = await supabase
      .from("property_stats")
      .select("action_type, created_at")
      .gte("created_at", periodStart.toISOString())
      .order("created_at", { ascending: true });

    if (allStatsError) {
      console.error("Error fetching all stats for chart:", allStatsError);
    }

    // Grouper par jour (ou par semaine si days > 30)
    const isWeekly = days > 30;
    const groupedStats = new Map<string, { views: number; clicks: number }>();

    // Initialiser tous les jours/semaines de la période
    if (isWeekly) {
      const weeks = Math.ceil(days / 7);
      for (let i = weeks - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - (i * 7));
        date.setHours(0, 0, 0, 0);
        // Calculer le début de la semaine (lundi)
        const dayOfWeek = date.getDay();
        const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        date.setDate(diff);
        const weekKey = date.toISOString().split("T")[0];
        groupedStats.set(weekKey, { views: 0, clicks: 0 });
      }
    } else {
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const dateKey = date.toISOString().split("T")[0];
        groupedStats.set(dateKey, { views: 0, clicks: 0 });
      }
    }

    // Compter les vues et clics
    if (allStats) {
      allStats.forEach((stat) => {
        const statDate = new Date(stat.created_at);
        statDate.setHours(0, 0, 0, 0);
        
        let groupKey: string;
        if (isWeekly) {
          // Calculer le début de la semaine
          const dayOfWeek = statDate.getDay();
          const diff = statDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
          const weekStart = new Date(statDate);
          weekStart.setDate(diff);
          groupKey = weekStart.toISOString().split("T")[0];
        } else {
          groupKey = statDate.toISOString().split("T")[0];
        }

        if (groupedStats.has(groupKey)) {
          const groupData = groupedStats.get(groupKey)!;
          if (stat.action_type === "view") {
            groupData.views += 1;
          } else if (
            stat.action_type === "whatsapp_click" ||
            stat.action_type === "phone_click"
          ) {
            groupData.clicks += 1;
          }
          groupedStats.set(groupKey, groupData);
        }
      });
    }

    // Convertir en tableau et formater
    const chartData: { date: string; views: number; clicks: number }[] = Array.from(
      groupedStats.entries()
    )
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([dateKey, data]) => {
        const date = new Date(dateKey + "T00:00:00");
        let formattedDate: string;

        if (isWeekly) {
          const weekEnd = new Date(date);
          weekEnd.setDate(weekEnd.getDate() + 6);
          formattedDate = `${date.toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
          })} - ${weekEnd.toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
          })}`;
        } else {
          formattedDate = date.toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
          });
        }

        return {
          date: formattedDate,
          views: data.views,
          clicks: data.clicks,
        };
      });

    // 5. Top Propriétés (utilise view_count pour les vues, property_stats pour les clics)
    const propertyClicks = new Map<string, number>();

    // Compter les clics par propriété
    stats.forEach((s) => {
      const current = propertyClicks.get(s.property_id) || 0;
      propertyClicks.set(s.property_id, current + 1);
    });

    // Récupérer toutes les propriétés approuvées avec leur view_count
    const { data: allProperties, error: allPropertiesError } = await supabase
      .from("properties")
      .select("id, title, images, price, view_count")
      .eq("validation_status", "approved")
      .gt("view_count", 0) // Seulement celles qui ont des vues
      .order("view_count", { ascending: false })
      .limit(20); // Prendre un peu plus pour filtrer ensuite

    if (allPropertiesError) {
      console.error("Error fetching properties for top list:", allPropertiesError);
    }

    // Combiner les vues (depuis view_count) et les clics (depuis property_stats)
    const combinedStats = (allProperties || []).map((prop) => {
      const clicks = propertyClicks.get(prop.id) || 0;
      const views = prop.view_count || 0;
      return {
        id: prop.id,
        views,
        clicks,
        total: views + clicks,
        title: prop.title || "Propriété inconnue",
        image:
          Array.isArray(prop.images) && prop.images.length > 0
            ? prop.images[0]
            : null,
        price: prop.price || 0,
      };
    });

    // Trier par total (vues + clics) et prendre le top 5
    const topPropertiesWithDetails = combinedStats
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return {
      totals: {
        views: totalViews,
        clicks: totalClicks,
        whatsappCount,
        phoneCount,
      },
      chart: chartData,
      topProperties: topPropertiesWithDetails,
    };
  } catch (error) {
    console.error("Error in getPerformanceStats:", error);
    return null;
  }
}

/**
 * Récupère les données réelles du graphique groupées par jour
 * @param days - Nombre de jours à récupérer (par défaut 30)
 * @returns Tableau de données groupées par jour avec vues et contacts
 */
export async function getDashboardChartData(
  days: number = 30
): Promise<DashboardChartDataPoint[]> {
  await requireAnyRole();
  const supabase = await createClient();

  try {
    // Calculer la date de début de la période
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - days);
    periodStart.setHours(0, 0, 0, 0); // Début de la journée

    // Récupérer toutes les entrées de property_stats des 30 derniers jours
    const { data: stats, error: statsError } = await supabase
      .from("property_stats")
      .select("action_type, created_at")
      .gte("created_at", periodStart.toISOString())
      .order("created_at", { ascending: true });

    if (statsError) {
      console.error("Error fetching dashboard chart data:", statsError);
      return [];
    }

    // Créer un Map pour grouper par jour
    // Clé : date au format YYYY-MM-DD, Valeur : { views: number, clicks: number }
    const dailyStats = new Map<string, { views: number; clicks: number }>();

    // Initialiser tous les jours de la période avec 0
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dateKey = date.toISOString().split("T")[0]; // Format YYYY-MM-DD
      dailyStats.set(dateKey, { views: 0, clicks: 0 });
    }

    // Compter les vues et contacts par jour
    if (stats) {
      stats.forEach((stat) => {
        const statDate = new Date(stat.created_at);
        statDate.setHours(0, 0, 0, 0);
        const dateKey = statDate.toISOString().split("T")[0];

        // Si la date est dans notre période, incrémenter les compteurs
        if (dailyStats.has(dateKey)) {
          const dayData = dailyStats.get(dateKey)!;

          if (stat.action_type === "view") {
            dayData.views += 1;
          } else if (
            stat.action_type === "whatsapp_click" ||
            stat.action_type === "phone_click"
          ) {
            dayData.clicks += 1;
          }

          dailyStats.set(dateKey, dayData);
        }
      });
    }

    // Convertir le Map en tableau et formater les dates pour Recharts
    const chartData: DashboardChartDataPoint[] = Array.from(dailyStats.entries())
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB)) // Trier par date croissante
      .map(([dateKey, data]) => {
        const date = new Date(dateKey + "T00:00:00"); // Ajouter l'heure pour éviter les problèmes de timezone
        const formattedDate = date.toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
        });

        return {
          date: formattedDate,
          views: data.views,
          clicks: data.clicks,
        };
      });

    return chartData;
  } catch (error) {
    console.error("Error in getDashboardChartData:", error);
    return [];
  }
}

