"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Building2, Search, Filter, Grid, List, Eye, EyeOff, Clock } from "lucide-react";
import { TeamPropertyCard } from "@/components/gestion/TeamPropertyCard";
import { AssociateTenantDialog } from "@/components/gestion/AssociateTenantDialog";

import { togglePropertyPublication, deleteTeamProperty } from "./actions";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect } from "react";
import type { TeamRole } from "@/types/team";

type Property = {
  id: string;
  title: string;
  price: number;
  category: "vente" | "location";
  status: string;
  validation_status: string;
  verification_status: string | null;
  scheduled_publish_at?: string;
  images: string[];
  location: {
    city: string;
    district?: string;
    address?: string;
  };
  specs: {
    surface: number;
    bedrooms: number;
    bathrooms: number;
  };
  details: {
    type: string;
  };
  owner?: {
    id: string;
    full_name?: string;
    phone?: string;
  };
  view_count?: number;
  is_full_rental?: boolean;
  tenants?: Array<{
    id: string;
    full_name: string;
    avatar_url?: string;
    payment_status: "up_to_date" | "late";
  }>;
};

type BiensClientProps = {
  teamId: string;
  teamName: string;
  userRole: TeamRole;
  initialProperties: Property[];
  error?: string;
};

export function BiensClient({
  teamId,
  teamName,
  userRole,
  initialProperties,
  error,
}: BiensClientProps) {
  const _router = useRouter();
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState(initialProperties);
  const [searchQuery, setSearchQuery] = useState(searchParams?.get("q") || "");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "vente" | "location">((searchParams?.get("category") as any) || "all");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft" | "scheduled">((searchParams?.get("status") as any) || "all");
  const [occupancyFilter, setOccupancyFilter] = useState<"all" | "vacant" | "rented">((searchParams?.get("occupancy") as any) || "all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const q = searchParams?.get("q") || "";
    const category = searchParams?.get("category") || "all";
    const status = searchParams?.get("status") || "all";
    const occupancy = searchParams?.get("occupancy") || "all";

    setSearchQuery(q);
    setCategoryFilter(category as any);
    setStatusFilter(status as any);
    setOccupancyFilter(occupancy as any);
  }, [searchParams]);

  const pathname = usePathname();

  // Update URL when filters change (Debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams?.toString());

      // Sync State to Params
      if (searchQuery) params.set('q', searchQuery); else params.delete('q');
      if (categoryFilter !== "all") params.set('category', categoryFilter); else params.delete('category');
      if (statusFilter !== "all") params.set('status', statusFilter); else params.delete('status');
      if (occupancyFilter !== "all") params.set('occupancy', occupancyFilter); else params.delete('occupancy');

      const newSearch = params.toString();
      const currentSearch = searchParams?.toString() || "";

      if (newSearch !== currentSearch) {
        _router.replace(`${pathname}?${newSearch}`, { scroll: false });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, categoryFilter, statusFilter, occupancyFilter, searchParams, pathname, _router]);

  // State pour la modale d'association
  const [propertyToAssociate, setPropertyToAssociate] = useState<{
    id: string;
    title: string;
    address?: string;
    price?: number;
    ownerId: string;
  } | null>(null);

  const canCreate = userRole === "owner" || userRole === "manager";
  const canDelete = userRole === "owner";

  // Filtrer les propriétés
  const filteredProperties = properties.filter((property) => {
    // Recherche textuelle
    if (searchQuery) {
      const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
      const query = normalize(searchQuery);
      const terms = query.split(/[\s,]+/).filter(t => t.length > 0);

      const title = normalize(property.title);
      const city = normalize(property.location.city);
      const district = normalize(property.location.district || "");
      const address = normalize(property.location.address || "");
      const tenantsStr = normalize(property.tenants?.map(t => t.full_name).join(" ") || "");

      // Matcher direct si titre identique (pour les clics depuis suggestion)
      if (title === query) return true;

      // On vérifie que chaque terme de la recherche est présent
      const matchesSearch = terms.every(term => {
        // Si le terme est purement numérique, on cherche une correspondance de mot entier
        // Pour éviter que la recherche "1" ne remonte tous les "10", "11", etc. au milieu des titres
        if (/^\d+$/.test(term)) {
          return new RegExp(`\\b${term}\\b`, 'i').test(title) ||
            title.includes(term) ||
            city.includes(term);
        }

        return title.includes(term) ||
          city.includes(term) ||
          district.includes(term) ||
          address.includes(term) ||
          tenantsStr.includes(term);
      });

      if (!matchesSearch) return false;
    }

    // Filtre d'occupation
    if (occupancyFilter === "vacant" && property.status === "loué") return false;
    if (occupancyFilter === "rented" && property.status !== "loué") return false;

    // Filtre catégorie
    if (categoryFilter !== "all" && property.category !== categoryFilter) return false;

    // Filtre statut publication
    if (statusFilter === "published") {
      if (property.validation_status !== "approved") return false;
      // On ne masque plus par défaut le "loué" si on est en mode gestion
      // Sauf si l'utilisateur demande explicitement les "Disponibles"
    }
    if (statusFilter === "draft" && property.validation_status !== "pending") return false;
    if (statusFilter === "scheduled" && property.validation_status !== "scheduled") return false;

    return true;
  });

  // Tri par pertinence si recherche active
  const sortedProperties = [...filteredProperties].sort((a, b) => {
    if (!searchQuery) return 0;

    const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    const query = normalize(searchQuery);
    const terms = query.split(/[\s,]+/).filter(t => t.length > 0);

    const getScore = (p: Property) => {
      const title = normalize(p.title);
      let score = 0;

      // 1. Match exact du titre (Poids colossal)
      if (title === query) return 100000;

      // 2. Match de mot entier exact (ex: "Appartement 1")
      // On utilise une regex pour vérifier les frontières de mots
      const exactWordMatch = new RegExp(`(?<=^|\\s)${query}(?=$|\\s)`, 'i').test(title);
      if (exactWordMatch) score += 50000;

      // 3. Commence par la requête
      if (title.startsWith(query)) score += 10000;

      // 4. Score par terme individuel
      terms.forEach(term => {
        // Mot entier
        if (new RegExp(`(?<=^|\\s)${term}(?=$|\\s)`, 'i').test(title)) score += 1000;
        // Contient simplement
        else if (title.includes(term)) score += 100;

        // Bonus pour la ville/quartier
        if (normalize(p.location.city).includes(term)) score += 50;
        if (normalize(p.location.district || "").includes(term)) score += 30;
      });

      return score;
    };

    const scoreA = getScore(a);
    const scoreB = getScore(b);

    if (scoreA !== scoreB) return scoreB - scoreA;

    return 0;
  });

  const stats = {
    total: properties.length,
    published: properties.filter((p) => p.validation_status === "approved").length, // Tout ce qui est approuvé est considéré "En ligne/Validé"
    draft: properties.filter((p) => p.validation_status === "pending").length,
    scheduled: properties.filter((p) => p.validation_status === "scheduled").length,
    vente: properties.filter((p) => p.category === "vente").length,
    location: properties.filter((p) => p.category === "location").length,
  };

  // Actions
  const handleTogglePublication = async (propertyId: string) => {
    setIsLoading(true);
    const result = await togglePropertyPublication(teamId, propertyId);
    setIsLoading(false);

    if (result.success) {
      setProperties((prev) =>
        prev.map((p) =>
          p.id === propertyId
            ? { ...p, validation_status: result.isPublished ? "approved" : "pending" }
            : p
        )
      );
    }
  };

  const handleDelete = async (propertyId: string) => {
    if (!canDelete) return;

    setIsLoading(true);
    const result = await deleteTeamProperty(teamId, propertyId);
    setIsLoading(false);

    if (result.success) {
      setProperties((prev) => prev.filter((p) => p.id !== propertyId));
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div id="tour-biens-header" className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8 text-left">
          <div className="flex flex-col items-start">
            <h1 className="text-2xl md:text-4xl font-black tracking-tighter">
              Biens de {teamName}
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-2">
              {stats.total} bien{stats.total > 1 ? "s" : ""} • {stats.published} en ligne
            </p>
          </div>

          {canCreate && (
            <div className="flex justify-start md:justify-end w-full md:w-auto">
              <Link
                href="/gestion/biens/nouveau"
                id="tour-biens-add-button"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-lg w-full md:w-auto text-base"
              >
                <Plus className="w-5 h-5" />
                <span className="text-[12px] font-black uppercase tracking-wider">Ajouter un bien</span>
              </Link>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div id="tour-biens-stats" className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Total biens</div>
            <div className="text-3xl font-black tracking-tighter">{(stats.total).toString().padStart(2, '0')}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-2">En ligne</div>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-black tracking-tighter">{(stats.published).toString().padStart(2, '0')}</span>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Ventes</div>
            <div className="text-3xl font-black tracking-tighter">{(stats.vente).toString().padStart(2, '0')}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Locations</div>
            <div className="text-3xl font-black tracking-tighter">{(stats.location).toString().padStart(2, '0')}</div>
          </div>
        </div>

        {/* Filters */}
        <div id="tour-biens-search-filters" className="flex flex-col gap-3 mb-6">
          {/* Search */}
          <div className="relative group">
            <div className="absolute left-4 inset-y-0 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un bien..."
              className="w-full bg-muted border border-border rounded-2xl pl-12 pr-4 h-12 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/40 transition-all"
            />
          </div>

          {/* Filter Row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* GROUPE 1 : Type */}
            <div className="bg-muted border border-border rounded-full p-1 inline-flex">
              {(["all", "vente", "location"] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 active:scale-95 ${categoryFilter === cat
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  {cat === "all" ? "Tous" : cat === "vente" ? "Vente" : "Location"}
                </button>
              ))}
            </div>

            {/* GROUPE 2 : Occupation */}
            <div className="bg-muted border border-border rounded-full p-1 inline-flex">
              {(["all", "vacant", "rented"] as const).map((occ) => (
                <button
                  key={occ}
                  onClick={() => setOccupancyFilter(occ)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 active:scale-95 ${occupancyFilter === occ
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  {occ === "all" ? "Tous" : occ === "vacant" ? "Dispos" : "Loués"}
                </button>
              ))}
            </div>

            {/* GROUPE 3 : Statuts */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setStatusFilter(statusFilter === "published" ? "all" : "published")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 active:scale-95 ${statusFilter === "published"
                    ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40"
                    : "border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
                  }`}
              >
                <Eye className="w-3.5 h-3.5" /> En ligne
              </button>
              <button
                onClick={() => setStatusFilter(statusFilter === "draft" ? "all" : "draft")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 active:scale-95 ${statusFilter === "draft"
                    ? "bg-muted-foreground/15 text-foreground border border-border"
                    : "border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
                  }`}
              >
                <EyeOff className="w-3.5 h-3.5" /> Brouillon
              </button>
              <button
                onClick={() => setStatusFilter(statusFilter === "scheduled" ? "all" : "scheduled")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 active:scale-95 ${statusFilter === "scheduled"
                    ? "bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-500/40"
                    : "border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
                  }`}
              >
                <Clock className="w-3.5 h-3.5" /> Programmé
              </button>
            </div>

            {/* View Toggle */}
            <div className="ml-auto flex gap-1 bg-muted border border-border rounded-xl p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`h-8 w-8 flex items-center justify-center rounded-lg transition-all duration-200 active:scale-95 ${viewMode === "grid"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`h-8 w-8 flex items-center justify-center rounded-lg transition-all duration-200 active:scale-95 ${viewMode === "list"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Properties Grid */}
        {sortedProperties.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {properties.length === 0 ? "Aucun bien" : "Aucun résultat"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {properties.length === 0
                ? "Commencez par ajouter votre premier bien immobilier"
                : "Aucun bien ne correspond à vos critères de recherche"}
            </p>
            {canCreate && properties.length === 0 && (
              <Link
                href="/gestion/biens/nouveau"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all shadow-md"
              >
                <Plus className="w-5 h-5" />
                Ajouter un bien
              </Link>
            )}
          </div>
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
            }
          >
            {sortedProperties.map((property) => (
              <TeamPropertyCard
                key={property.id}
                property={property}
                onTogglePublication={handleTogglePublication}
                onDelete={handleDelete}
                onAssociate={(id) => {
                  const p = properties.find(prop => prop.id === id);
                  if (p) setPropertyToAssociate({
                    id: p.id,
                    title: p.title,
                    address: p.location.address || `${p.location.district ? p.location.district + ', ' : ''}${p.location.city}`,
                    price: p.price,
                    ownerId: p.owner?.id || ""
                  });
                }}
                isLoading={isLoading}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modale d'association (Locataire existant) */}
      {propertyToAssociate && (
        <AssociateTenantDialog
          isOpen={!!propertyToAssociate}
          onClose={() => setPropertyToAssociate(null)}
          propertyId={propertyToAssociate.id}
          propertyTitle={propertyToAssociate.title}
          propertyAddress={propertyToAssociate.address}
          propertyPrice={propertyToAssociate.price}
          ownerId={propertyToAssociate.ownerId}
          teamId={teamId}
        />
      )}
    </div>
  );
}
