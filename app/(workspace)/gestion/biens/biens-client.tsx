"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Building2, Search, Filter, Grid, List, Eye, EyeOff, Clock } from "lucide-react";
import { TeamPropertyCard } from "@/components/gestion/TeamPropertyCard";
import { AssociateTenantDialog } from "@/components/gestion/AssociateTenantDialog";
import { BiensTour } from "@/components/gestion/tours/BiensTour";
import { togglePropertyPublication, deleteTeamProperty } from "./actions";
import { useRouter } from "next/navigation";
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
  tenant?: {
    id: string;
    full_name: string;
    avatar_url?: string;
    payment_status: "up_to_date" | "late";
  };
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
  const [properties, setProperties] = useState(initialProperties);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "vente" | "location">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft" | "scheduled">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isLoading, setIsLoading] = useState(false);

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
      const query = searchQuery.toLowerCase();
      const matchesTitle = property.title.toLowerCase().includes(query);
      const matchesCity = property.location.city.toLowerCase().includes(query);
      const matchesDistrict = property.location.district?.toLowerCase().includes(query);
      const matchesTenant = property.tenant?.full_name.toLowerCase().includes(query);

      if (!matchesTitle && !matchesCity && !matchesDistrict && !matchesTenant) return false;
    }

    // Filtre catégorie
    if (categoryFilter !== "all" && property.category !== categoryFilter) return false;

    // Filtre statut publication
    if (statusFilter === "published") {
      // Un bien n'est réellement "en ligne" que s'il est approuvé ET non loué
      if (property.validation_status !== "approved" || property.status === "loué") return false;
    }
    if (statusFilter === "draft" && property.validation_status !== "pending") return false;
    if (statusFilter === "scheduled" && property.validation_status !== "scheduled") return false;

    return true;
  });

  // Stats
  const stats = {
    total: properties.length,
    published: properties.filter((p) => p.validation_status === "approved" && p.status !== "loué").length,
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
        <BiensTour canCreate={canCreate} />
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
              <Eye className="w-5 h-5 text-[#F4C430]" />
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
        <div id="tour-biens-search-filters" className="flex flex-col md:flex-row gap-4 mb-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              (document.activeElement as HTMLElement)?.blur();
            }}
            className="relative flex-1"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="search"
              enterKeyHint="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un bien..."
              className="w-full bg-card border border-border rounded-lg pl-10 pr-4 h-11 placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors text-base"
            />
          </form>

          {/* GROUPE 1 : Segmented Control pour le Type */}
          <div className="bg-muted p-1 rounded-lg inline-flex">
            <button
              onClick={() => setCategoryFilter("all")}
              className={`px-4 h-11 flex items-center justify-center rounded-md text-sm font-medium transition-all active:scale-95 ${categoryFilter === "all"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`}
            >
              Tous
            </button>
            <button
              onClick={() => setCategoryFilter("vente")}
              className={`px-4 h-11 flex items-center justify-center rounded-md text-sm font-medium transition-all active:scale-95 ${categoryFilter === "vente"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`}
            >
              Vente
            </button>
            <button
              onClick={() => setCategoryFilter("location")}
              className={`px-4 h-11 flex items-center justify-center rounded-md text-sm font-medium transition-all active:scale-95 ${categoryFilter === "location"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`}
            >
              Location
            </button>
          </div>

          {/* SÉPARATEUR */}
          <div className="hidden md:block h-6 w-px bg-border mx-2"></div>

          {/* GROUPE 2 : Statuts (Style Badges cliquables) */}
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter("published")}
              className={`flex items-center gap-2 px-3 h-11 rounded-full text-xs font-medium transition-all active:scale-95 ${statusFilter === "published"
                ? "bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/50"
                : "border border-border hover:border-muted-foreground text-muted-foreground"
                }`}
            >
              <Eye className="w-4 h-4" /> En ligne
            </button>
            <button
              onClick={() => setStatusFilter("draft")}
              className={`flex items-center gap-2 px-3 h-11 rounded-full text-xs font-medium transition-all active:scale-95 ${statusFilter === "draft"
                ? "bg-muted text-foreground border border-muted-foreground/50"
                : "border border-border hover:border-muted-foreground text-muted-foreground"
                }`}
            >
              <EyeOff className="w-4 h-4" /> Brouillon
            </button>
            <button
              onClick={() => setStatusFilter("scheduled")}
              className={`flex items-center gap-2 px-3 h-11 rounded-full text-xs font-medium transition-all active:scale-95 ${statusFilter === "scheduled"
                ? "bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/50"
                : "border border-border hover:border-muted-foreground text-muted-foreground"
                }`}
            >
              <Clock className="w-4 h-4" /> Programmé
            </button>
          </div>

          {/* View Toggle */}
          <div className="flex gap-1 bg-muted border border-border rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`h-11 w-11 flex items-center justify-center rounded-md transition-all active:scale-95 ${viewMode === "grid" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`h-11 w-11 flex items-center justify-center rounded-md transition-all active:scale-95 ${viewMode === "list" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Properties Grid */}
        {filteredProperties.length === 0 ? (
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
            {filteredProperties.map((property) => (
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
