"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Filter,
  SortAsc,
  SortDesc,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { moderateProperty, certifyAdAndDocument } from "./actions";
import { ModerationNotification } from "@/app/admin/moderation/notification";
import { RejectDialog } from "./reject-dialog";
import { PropertyModerationCard } from "./property-card";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useUserRoles } from "@/hooks/use-user-roles";

type PropertyToModerate = {
  id: string;
  title: string;
  price: number;
  images: string[];
  location: { city: string; district: string };
  validation_status: string;
  service_type: string;
  payment_ref: string | null;
  owner_id: string;
  created_at?: string;
  proof_document_url?: string | null;
};

type SortOption = "date_asc" | "date_desc" | "price_asc" | "price_desc";
type FilterStatus = "all" | "pending" | "payment_pending";
type FilterService = "all" | "mandat_confort" | "boost_visibilite";

export default function ModerationPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { roles: userRoles, loading: loadingRoles } = useUserRoles(user?.id || null);
  const [properties, setProperties] = useState<PropertyToModerate[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  // Vérifier que l'utilisateur a le droit d'accéder à la modération
  const isMainAdmin = user?.email?.toLowerCase() === "barrymohamadou98@gmail.com".toLowerCase();
  const canModerate = isMainAdmin || userRoles.some((role) => ["admin", "moderateur", "superadmin"].includes(role));

  // Le layout admin vérifie déjà l'accès côté serveur avec requireAnyRole()
  // On ne fait qu'une vérification côté client pour l'UX (afficher un message si pas de droits)
  // mais on ne redirige pas car le serveur a déjà autorisé l'accès
  useEffect(() => {
    // Attendre que les rôles soient chargés
    if (authLoading || loadingRoles) {
      return;
    }

    if (!user) {
      return; // Le layout gère déjà la redirection
    }

    // Vérifier l'accès pour l'UX (affichage conditionnel)
    const currentCanModerate = isMainAdmin || userRoles.some((role) => ["admin", "moderateur", "superadmin"].includes(role));

    if (currentCanModerate) {
      // Accès autorisé
    } else {
      // Si le serveur a autorisé mais que côté client on n'a pas de rôles,
      // c'est probablement un problème de timing. On attend un peu.
      console.warn("⚠️ Modération - Rôles non chargés côté client, mais serveur a autorisé", {
        email: user.email,
        roles: userRoles,
        loadingRoles,
      });
    }
  }, [user, authLoading, loadingRoles, userRoles, isMainAdmin]);

  // États pour les actions en cours
  const [approvingIds, setApprovingIds] = useState<Set<string>>(new Set());
  const [rejectingIds, setRejectingIds] = useState<Set<string>>(new Set());

  // États pour filtres et tri
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterService, setFilterService] = useState<FilterService>("all");
  const [sortBy, setSortBy] = useState<SortOption>("date_asc");

  const loadProperties = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("is_agency_listing", false)
        .in("validation_status", ["pending", "payment_pending"])
        .order("created_at", { ascending: true });

      if (error) {
        console.error("❌ Error loading properties for moderation:", {
          errorObject: error,
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          stringified: JSON.stringify(error, null, 2)
        });
        toast.error(`Erreur: ${error.message || "Impossible de charger les annonces"}`);
        setLoading(false);
        return;
      }

      const propertiesWithLocation = (data || []).map((p) => ({
        ...p,
        location: p.location as { city: string; district: string },
        images: (p.images as string[]) || [],
      }));

      setProperties(propertiesWithLocation);
      setLoading(false);
    } catch (err) {
      console.error("❌ Unexpected error loading properties:", {
        error: err,
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined
      });
      toast.error("Erreur inattendue lors du chargement");
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Attendre que l'authentification et les rôles soient chargés avant de charger les propriétés
    if (user && !authLoading && !loadingRoles && canModerate) {
      loadProperties();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, loadingRoles, canModerate]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/admin/moderation");
    }
  }, [user, authLoading, router]);

  // Filtrage et tri des propriétés
  const filteredAndSortedProperties = useMemo(() => {
    let filtered = [...properties];

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.location.city.toLowerCase().includes(query) ||
          p.location.district?.toLowerCase().includes(query) ||
          p.payment_ref?.toLowerCase().includes(query)
      );
    }

    // Filtre par statut
    if (filterStatus !== "all") {
      filtered = filtered.filter(
        (p) => p.validation_status === filterStatus
      );
    }

    // Filtre par service
    if (filterService !== "all") {
      filtered = filtered.filter((p) => p.service_type === filterService);
    }

    // Tri
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date_asc":
          return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        case "date_desc":
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        case "price_asc":
          return a.price - b.price;
        case "price_desc":
          return b.price - a.price;
        default:
          return 0;
      }
    });

    return filtered;
  }, [properties, searchQuery, filterStatus, filterService, sortBy]);

  const handleApprove = async (propertyId: string) => {
    if (!confirm("Confirmez-vous la validation de cette annonce ?")) {
      return;
    }

    setApprovingIds((prev) => new Set(prev).add(propertyId));
    try {
      // Find the property to get its document ID
      const property = properties.find(p => p.id === propertyId);
      const documentId = property?.proof_document_url || null;

      // Use certifyAdAndDocument if there's a document, otherwise use moderateProperty
      const result = documentId
        ? await certifyAdAndDocument(propertyId, documentId)
        : await moderateProperty(propertyId, "approved");

      if (result.error) {
        toast.error("Erreur", { description: result.error });
      } else {
        toast.success("Annonce validée !", {
          description: documentId
            ? "L'annonce et le document ont été certifiés ✅"
            : "L'annonce est maintenant en ligne.",
        });
        await loadProperties();
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la validation");
    } finally {
      setApprovingIds((prev) => {
        const next = new Set(prev);
        next.delete(propertyId);
        return next;
      });
    }
  };

  const handleRejectClick = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    setRejectDialogOpen(true);
  };

  const handleRejectSuccess = () => {
    loadProperties();
    setRejectDialogOpen(false);
    setSelectedPropertyId(null);
  };

  // Statistiques
  const stats = useMemo(() => {
    const total = properties.length;
    const pending = properties.filter((p) => p.validation_status === "pending").length;
    const paymentPending = properties.filter(
      (p) => p.validation_status === "payment_pending"
    ).length;
    return { total, pending, paymentPending };
  }, [properties]);

  // Le layout admin vérifie déjà l'accès côté serveur avec requireAnyRole()
  // On affiche le contenu même si les rôles ne sont pas encore chargés côté client
  // pour éviter un flash de contenu vide
  if (authLoading || loadingRoles || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-white/70">Chargement...</div>
      </div>
    );
  }

  // Si l'utilisateur n'est pas connecté, le layout gère déjà la redirection
  if (!user) {
    return null;
  }

  // Si les rôles sont chargés et que l'utilisateur n'a pas les droits,
  // on affiche un message (mais normalement le serveur aurait déjà bloqué)
  if (!loadingRoles && !canModerate) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-white/70">Accès non autorisé</p>
          <p className="mt-2 text-sm text-white/50">
            Vous n&apos;avez pas les permissions nécessaires pour accéder à cette page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6">
      <ModerationNotification />

      {/* Header avec statistiques */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">
            Admin · Modération
          </p>
          <h1 className="text-3xl font-semibold text-white">
            Modération des annonces
          </h1>
        </div>
        <Button variant="secondary" className="rounded-full" asChild>
          <Link href="/admin/dashboard">Retour au dashboard</Link>
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/20 p-2">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-white/60">Total en attente</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-500/20 p-2">
              <CheckCircle2 className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-white/60">En attente</p>
              <p className="text-2xl font-bold text-white">{stats.pending}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-emerald-500/20 p-2">
              <XCircle className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-white/60">Paiement en attente</p>
              <p className="text-2xl font-bold text-white">{stats.paymentPending}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4">
        {/* Recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <Input
            placeholder="Rechercher par titre, ville, quartier ou référence..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
        </div>

        {/* Filtres et tri */}
        <div className="flex flex-wrap gap-2">
          {/* Filtre statut */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-white/40" />
            <span className="text-sm text-white/60">Statut:</span>
            <div className="flex gap-1">
              {(["all", "pending", "payment_pending"] as FilterStatus[]).map((status) => (
                <Button
                  key={status}
                  variant={filterStatus === status ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setFilterStatus(status)}
                  className={`rounded-full text-xs ${filterStatus === status
                    ? "bg-primary text-black"
                    : "text-white/70 hover:text-white"
                    }`}
                >
                  {status === "all"
                    ? "Tous"
                    : status === "pending"
                      ? "En attente"
                      : "Paiement"}
                </Button>
              ))}
            </div>
          </div>

          {/* Filtre service */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/60">Service:</span>
            <div className="flex gap-1">
              {(["all", "mandat_confort", "boost_visibilite"] as FilterService[]).map(
                (service) => (
                  <Button
                    key={service}
                    variant={filterService === service ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setFilterService(service)}
                    className={`rounded-full text-xs ${filterService === service
                      ? "bg-primary text-black"
                      : "text-white/70 hover:text-white"
                      }`}
                  >
                    {service === "all"
                      ? "Tous"
                      : service === "mandat_confort"
                        ? "Mandat"
                        : "Diffusion"}
                  </Button>
                )
              )}
            </div>
          </div>

          {/* Tri */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-white/60">Trier:</span>
            <div className="flex gap-1">
              {(["date_asc", "date_desc", "price_asc", "price_desc"] as SortOption[]).map(
                (sort) => (
                  <Button
                    key={sort}
                    variant={sortBy === sort ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setSortBy(sort)}
                    className={`rounded-full text-xs ${sortBy === sort
                      ? "bg-primary text-black"
                      : "text-white/70 hover:text-white"
                      }`}
                  >
                    {sort === "date_asc" ? (
                      <SortAsc className="h-3 w-3" />
                    ) : sort === "date_desc" ? (
                      <SortDesc className="h-3 w-3" />
                    ) : sort === "price_asc" ? (
                      "Prix ↑"
                    ) : (
                      "Prix ↓"
                    )}
                  </Button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Résultats */}
        <p className="text-sm text-white/60">
          {filteredAndSortedProperties.length} annonce
          {filteredAndSortedProperties.length > 1 ? "s" : ""} trouvée
          {filteredAndSortedProperties.length > 1 ? "s" : ""}
        </p>
      </div>

      {/* Liste des annonces */}
      {filteredAndSortedProperties.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
          <p className="text-lg text-white/70">
            {properties.length === 0
              ? "Aucune annonce en attente de modération"
              : "Aucune annonce ne correspond aux filtres"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredAndSortedProperties.map((property) => (
              <PropertyModerationCard
                key={property.id}
                property={property}
                onApprove={handleApprove}
                onReject={handleRejectClick}
                isApproving={approvingIds.has(property.id)}
                isRejecting={rejectingIds.has(property.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Dialog de refus */}
      {selectedPropertyId && (
        <RejectDialog
          propertyId={selectedPropertyId}
          open={rejectDialogOpen}
          onOpenChange={setRejectDialogOpen}
          onSuccess={handleRejectSuccess}
        />
      )}
    </div>
  );
}
