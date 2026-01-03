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
  occupation_status?: "occupied" | "vacant" | "maintenance";
};

type OccupationFilter = "all" | "occupied" | "vacant" | "maintenance";
type ValidationFilter = "all" | "approved" | "pending" | "rejected";

const occupationFilters = [
  { value: "all" as const, label: "Tous", icon: Home },
  { value: "occupied" as const, label: "Occupés", icon: Users, color: "text-green-400" },
  { value: "vacant" as const, label: "Vacants", icon: Home, color: "text-orange-400" },
  { value: "maintenance" as const, label: "Travaux", icon: Wrench, color: "text-purple-400" },
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
      <div className="space-y-6 py-6 text-white">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="spacing-y-2">
            <Skeleton className="h-4 w-32 bg-white/10" />
            <Skeleton className="h-10 w-48 bg-white/10" />
          </div>
          <Skeleton className="h-10 w-40 rounded-full bg-primary/20" />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-white/10 bg-background/5">
              <Skeleton className="h-48 w-full bg-white/10" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-6 w-2/3 bg-white/10" />
                <Skeleton className="h-8 w-1/3 bg-white/10" />
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
        <h1 className="text-2xl font-semibold text-white">Connexion requise</h1>
        <Button asChild>
          <Link href="/login">Se connecter</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6 text-white">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">
            Espace Propriétaire
          </p>
          <h1 className="text-3xl font-semibold">Mes biens</h1>
        </div>
        <Button className="rounded-full bg-primary text-black" asChild>
          <Link href="/compte/deposer">
            <Plus className="mr-2 h-4 w-4" />
            Déposer une annonce
          </Link>
        </Button>
      </div>

      {/* Stats Bar */}
      {properties.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-xs text-slate-400">Total biens</p>
          </div>
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
            <p className="text-2xl font-bold text-green-400">{stats.occupied}</p>
            <p className="text-xs text-green-400/70">Occupés</p>
          </div>
          <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <p className="text-2xl font-bold text-orange-400">{stats.vacant}</p>
            <p className="text-xs text-orange-400/70">Vacants</p>
          </div>
          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <p className="text-2xl font-bold text-purple-400">{stats.maintenance}</p>
            <p className="text-xs text-purple-400/70">En travaux</p>
          </div>
        </div>
      )}

      {/* Controls: Search + Filters + View Toggle */}
      {properties.length > 0 && (
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
          {/* Search */}
          <div className="flex-1 flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 h-10 focus-within:border-slate-700 max-w-md w-full">
            <Search className="h-4 w-4 text-slate-500 shrink-0" />
            <input
              type="text"
              placeholder="Rechercher un bien..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-white placeholder:text-slate-600 text-sm outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Occupation Filters */}
            <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
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
                        ? "bg-blue-500/10 text-blue-400"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                      }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? "" : filter.color || ""}`} />
                    <span className="hidden sm:inline">{filter.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? "bg-blue-500/20" : "bg-slate-800"
                      }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* View Toggle */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition-colors ${viewMode === "grid"
                    ? "bg-blue-500/10 text-blue-400"
                    : "text-slate-500 hover:text-slate-300"
                  }`}
                title="Vue grille"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md transition-colors ${viewMode === "list"
                    ? "bg-blue-500/10 text-blue-400"
                    : "text-slate-500 hover:text-slate-300"
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
          <p className="text-slate-500 text-sm">Aucun bien ne correspond à vos filtres</p>
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
            />
          ))}
        </div>
      )}
    </div>
  );
}
