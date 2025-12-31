"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import { motion } from "framer-motion";
import { Plus, Eye, Clock, CheckCircle, XCircle, AlertCircle, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/utils/supabase/client";
import type { Property } from "@/types/property";
import { PropertyCardActions } from "./property-card-actions";
import { VerificationUploadForm } from "@/components/dashboard/verification-upload-form";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { ShieldCheck, Timer } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type PropertyWithStatus = Property & {
  validation_status: "pending" | "payment_pending" | "approved" | "rejected";
  validation_rejection_reason?: string | null;
  verification_status?: "pending" | "verified" | "rejected";
  rejection_reason?: string | null;
  views_count?: number;
};

const statusConfig = {
  pending: {
    label: "Validation en cours",
    color: "bg-amber-500/20 text-amber-300",
    icon: Clock,
  },
  payment_pending: {
    label: "Paiement en attente",
    color: "bg-blue-500/20 text-blue-300",
    icon: Clock,
  },
  approved: {
    label: "En ligne",
    color: "bg-emerald-500/20 text-emerald-300",
    icon: CheckCircle,
  },
  rejected: {
    label: "Refusé",
    color: "bg-red-500/20 text-red-300",
    icon: XCircle,
  },
};

export default function MesBiensPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [properties, setProperties] = useState<PropertyWithStatus[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);

  const loadProperties = async () => {
    if (!user) return;

    const supabase = createClient();
    // Récupérer TOUTES les annonces de l'utilisateur sans limite
    // Supabase a une limite par défaut de 1000, mais on peut la contourner avec range()
    let allProperties: PropertyWithStatus[] = [];
    let from = 0;
    const pageSize = 1000; // Taille maximale par requête Supabase

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

      if (!data || data.length === 0) {
        break;
      }

      allProperties = [...allProperties, ...(data as PropertyWithStatus[])];

      // Si on a récupéré moins que la taille de page, c'est qu'on a tout récupéré
      if (data.length < pageSize) {
        break;
      }

      from += pageSize;
    }

    setProperties(allProperties);
    setLoadingProperties(false);
  };

  useEffect(() => {
    if (user) {
      loadProperties();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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
                <div className="flex justify-between">
                  <Skeleton className="h-6 w-2/3 bg-white/10" />
                  <Skeleton className="h-6 w-1/4 bg-white/10" />
                </div>
                <Skeleton className="h-8 w-1/3 bg-white/10" />
                <Skeleton className="h-4 w-1/2 bg-white/10" />
                <Skeleton className="h-10 w-full rounded-full bg-white/10" />
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
        <h1 className="text-2xl font-semibold text-white">
          Connexion requise
        </h1>
        <Button asChild>
          <Link href="/login">Se connecter</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6 text-white">
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

      {properties.length === 0 ? (
        <EmptyState
          title="Vous n'avez pas encore déposé d'annonce"
          description="Déposez votre premier bien et commencez à toucher des revenus. C'est simple, rapide et gratuit avec le mandat agence."
          actionLabel="Déposer mon bien"
          onAction={() => router.push("/compte/deposer")}
          icon={Package}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {properties.map((property) => {
            const status = statusConfig[property.validation_status || "pending"];
            const StatusIcon = status.icon;

            return (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-background/5 transition-all hover:border-white/20"
              >
                {property.images?.[0] && (
                  <div className="relative h-48 w-full overflow-hidden">
                    <Image
                      src={property.images[0]}
                      alt={property.title}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      quality={75}
                    />
                  </div>
                )}
                <div className="p-4">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="flex-1 font-semibold text-white line-clamp-2">
                      {property.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      {/* Status Certification */}
                      {property.verification_status === "verified" ? (
                        <VerifiedBadge size="sm" />
                      ) : property.verification_status === "pending" ? (
                        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/50">
                          <Timer className="h-3 w-3" />
                          <span>Vérif. en cours</span>
                        </div>
                      ) : (
                        // Afficher le bouton seulement si le bien a un statut de base "approved" ou "payment_pending"
                        // Pour éviter de certifier des brouillons ou des biens rejetés par la modération principale
                        (!property.verification_status || property.verification_status === "rejected") &&
                        (property.validation_status === "approved" || property.validation_status === "pending") && (
                          <VerificationUploadForm propertyId={property.id} />
                        )
                      )}

                      <span
                        className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${status.color}`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </span>
                      <PropertyCardActions
                        propertyId={property.id}
                        validationStatus={property.validation_status || "pending"}
                        status={property.status || "disponible"}
                      />
                    </div>
                  </div>

                  {/* Feedback de refus */}
                  {property.validation_status === "rejected" && property.rejection_reason && (
                    <div className="mb-3 rounded-lg border border-red-500/20 bg-red-500/10 p-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-red-300 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-red-300 mb-1">
                            Refusé
                          </p>
                          <p className="text-xs text-red-200/80">
                            {property.rejection_reason}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <p className="mb-3 text-lg font-bold text-amber-400">
                    {new Intl.NumberFormat("fr-SN", {
                      maximumFractionDigits: 0,
                    }).format(property.price)}{" "}
                    FCFA
                  </p>

                  <p className="mb-4 text-sm text-white/60">
                    {property.location.city}
                    {(property.location as { district?: string }).district &&
                      `, ${(property.location as { district?: string }).district}`
                    }
                  </p>

                  {property.validation_status === "approved" && (
                    <div className="flex items-center gap-2 text-sm text-white/50">
                      <Eye className="h-4 w-4" />
                      <span>
                        {property.views_count || 0} vue{(property.views_count || 0) > 1 ? "s" : ""}
                      </span>
                    </div>
                  )}

                  <Button
                    variant="secondary"
                    className="mt-4 w-full rounded-full bg-background/5 border border-white/10"
                    asChild
                  >
                    <Link href={`/biens/${property.id}`}>Voir l&apos;annonce</Link>
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

