"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Plus,
  Package,
  LayoutGrid,
  List,
  Home,
  Users,
  Wrench,
  Search,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/utils/supabase/client";
import type { Property } from "@/types/property";
import { PropertyCard } from "./PropertyCard";
import { Skeleton } from "@/components/ui/skeleton";

type PropertyWithStatus = Property & {
  validation_status: "pending" | "payment_pending" | "approved" | "rejected";
  validation_rejection_reason?: string | null;
  verification_status?: "pending" | "verified" | "rejected";
  rejection_reason?: string | null;
  views_count?: number;
  category?: "vente" | "location";
  owner_id?: string;
  // Occupation status (to be computed from leases)
  occupation_status?: "occupied" | "vacant" | "maintenance";
};

type OccupationFilter = "all" | "occupied" | "vacant" | "maintenance";
type ValidationFilter = "all" | "approved" | "pending" | "rejected";

const occupationFilters = [
  { value: "all" as const, label: "Tous", icon: Home },
  { value: "occupied" as const, label: "Occupés", icon: Users, color: "text-green-500" },
  { value: "vacant" as const, label: "Vacants", icon: Home, color: "text-orange-500" },
  { value: "maintenance" as const, label: "Travaux", icon: Wrench, color: "text-purple-500" },
];

export default function MesBiensPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [properties, setProperties] = useState<PropertyWithStatus[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [occupationFilter, setOccupationFilter] = useState<OccupationFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const loadProperties = async () => {
    if (!user) return;

    const supabase = createClient();

    // Load properties
    let allProperties: PropertyWithStatus[] = [];
    let from = 0;
    const pageSize = 1000;

    while (true) {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })
        .range(from, from + pageSize - 1);

      if (error) {
        console.error("Error loading properties:", error);
        break;
      }

      if (!data || data.length === 0) break;

      allProperties = [...allProperties, ...(data as PropertyWithStatus[])];

      if (data.length < pageSize) break;
      from += pageSize;
    }

    // Load leases to determine occupation status
    const { data: leases } = await supabase
      .from("leases")
      .select("property_id, status")
      .eq("owner_id", user.id)
      .eq("status", "active");

    const occupiedPropertyIds = new Set(leases?.map(l => l.property_id) || []);

    // Load maintenance requests to check for properties under maintenance
    const { data: maintenanceRequests } = await supabase
      .from("maintenance_requests")
      .select("property_id, status")
      .in("status", ["open", "in_progress", "approved"]);

    const maintenancePropertyIds = new Set(maintenanceRequests?.map(m => m.property_id).filter(Boolean) || []);

    // Assign occupation status
    const propertiesWithOccupation = allProperties.map(property => ({
      ...property,
      occupation_status: maintenancePropertyIds.has(property.id)
        ? "maintenance" as const
        : occupiedPropertyIds.has(property.id)
          ? "occupied" as const
          : "vacant" as const
    }));

    setProperties(propertiesWithOccupation);
    setLoadingProperties(false);
  };

  useEffect(() => {
    if (user) {
      loadProperties();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Filtered properties
  const filteredProperties = useMemo(() => {
    return properties.filter(property => {
      // Occupation filter
      if (occupationFilter !== "all" && property.occupation_status !== occupationFilter) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = property.title?.toLowerCase().includes(query);
        const matchesCity = property.location?.city?.toLowerCase().includes(query);
        const matchesDistrict = (property.location as { district?: string })?.district?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesCity && !matchesDistrict) {
          return false;
        }
      }

      return true;
    });
  }, [properties, occupationFilter, searchQuery]);

  // Stats
  const stats = useMemo(() => ({
    total: properties.length,
    occupied: properties.filter(p => p.occupation_status === "occupied").length,
    vacant: properties.filter(p => p.occupation_status === "vacant").length,
    maintenance: properties.filter(p => p.occupation_status === "maintenance").length,
  }), [properties]);

  if (loading || loadingProperties) {
    return (
      <div className="space-y-6 py-6 text-foreground">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="spacing-y-2">
            <Skeleton className="h-4 w-32 bg-white/10" />
            <Skeleton className="h-10 w-48 bg-white/10" />
          </div>
          <Skeleton className="h-10 w-40 rounded-full bg-primary/20" />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-border bg-card">
              <Skeleton className="h-48 w-full bg-muted" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-6 w-2/3 bg-muted" />
                <Skeleton className="h-8 w-1/3 bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6 py-6 text-center">
        <h1 className="text-2xl font-semibold text-foreground">Connexion requise</h1>
        <Button asChild>
          <Link href="/login">Se connecter</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-6 lg:px-8 space-y-6 py-6 text-foreground">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Espace Propriétaire
          </p>
          <h1 className="text-3xl font-semibold">Mes biens</h1>
        </div>
        <Button className="rounded-full bg-[#0F172A] text-white hover:bg-[#0F172A]/90 dark:!bg-[#F4C430] dark:!text-black dark:hover:!bg-[#F4C430]/90" asChild>
          <Link href="/compte/deposer">
            <Plus className="mr-2 h-4 w-4" />
            Déposer une annonce
          </Link>
        </Button>
      </div>

      {/* Stats Bar */}
      {properties.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-card border border-border">
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-xs text-slate-600 dark:text-muted-foreground">Total biens</p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.occupied}</p>
            <p className="text-xs text-slate-600 dark:text-muted-foreground">Occupés</p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.vacant}</p>
            <p className="text-xs text-slate-600 dark:text-muted-foreground">Vacants</p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.maintenance}</p>
            <p className="text-xs text-slate-600 dark:text-muted-foreground">En travaux</p>
          </div>
        </div>
      )}

      {/* Controls: Search + Filters + View Toggle */}
      {properties.length > 0 && (
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
          {/* Search */}
          <div className="flex-1 flex items-center gap-2 bg-background border border-border rounded-lg px-3 h-10 focus-within:border-primary/50 max-w-md w-full hover:border-primary/30 transition-colors">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="Rechercher un bien..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-sm outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Occupation Filters */}
            <div className="flex items-center gap-1 p-1 bg-background border border-border rounded-lg">
              {occupationFilters.map((filter) => {
                const Icon = filter.icon;
                const isActive = occupationFilter === filter.value;
                const count = filter.value === "all"
                  ? stats.total
                  : stats[filter.value as keyof typeof stats];

                return (
                  <button
                    key={filter.value}
                    onClick={() => setOccupationFilter(filter.value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${isActive
                      ? "bg-[#0F172A] text-white dark:!bg-accent dark:!text-accent-foreground"
                      : "text-slate-600 dark:text-muted-foreground hover:text-foreground hover:bg-accent/50"
                      }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? "" : filter.color || ""}`} />
                    <span className="hidden sm:inline">{filter.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? "bg-background/20" : "bg-muted"
                      }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* View Toggle */}
            <div className="flex items-center bg-background border border-border rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition-colors ${viewMode === "grid"
                  ? "bg-[#0F172A] text-white dark:!bg-accent dark:!text-accent-foreground"
                  : "text-slate-600 dark:text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}
                title="Vue grille"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md transition-colors ${viewMode === "list"
                  ? "bg-[#0F172A] text-white dark:!bg-accent dark:!text-accent-foreground"
                  : "text-slate-600 dark:text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}
                title="Vue liste"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Properties Display */}
      {properties.length === 0 ? (
        <EmptyState
          title="Vous n'avez pas encore déposé d'annonce"
          description="Déposez votre premier bien et commencez à toucher des revenus."
          actionLabel="Déposer mon bien"
          onAction={() => router.push("/compte/deposer")}
          icon={Package}
        />
      ) : filteredProperties.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-sm">Aucun bien ne correspond à vos filtres</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setOccupationFilter("all");
              setSearchQuery("");
            }}
            className="mt-2 text-blue-400 hover:text-blue-300"
          >
            Réinitialiser les filtres
          </Button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProperties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              viewMode="grid"
              onRefresh={loadProperties}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProperties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              viewMode="list"
              onRefresh={loadProperties}
            />
          ))}
        </div>
      )}
    </div>
  );
}
