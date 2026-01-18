"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/utils/supabase/client";
import { VerificationUploadForm } from "@/components/dashboard/verification-upload-form";
import { VerificationStatusBadge } from "@/components/dashboard/verification-status-badge";
import type { Property } from "@/types/property";

type PropertyWithVerification = Property & {
  verification_status: "pending" | "verified" | "rejected" | null;
  proof_document_url?: string | null;
  verification_rejection_reason?: string | null;
  verification_requested_at?: string | null;
};

export default function PropertyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id as string;
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [property, setProperty] = useState<PropertyWithVerification | null>(null);

  const loadProperty = async () => {
    if (!user || !propertyId) return;

    const supabase = createClient();
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("id", propertyId)
      .eq("owner_id", user.id)
      .single();

    if (error || !data) {
      toast.error("Bien introuvable ou accès non autorisé");
      router.push("/compte/mes-biens");
      return;
    }

    setProperty(data as PropertyWithVerification);
    setLoading(false);
  };

  useEffect(() => {
    if (user && !authLoading) {
      loadProperty();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, propertyId]);

  // Recharger la page après une soumission réussie
  // On utilise un listener pour détecter les changements de route
  useEffect(() => {
    const handleFocus = () => {
      // Recharger les données quand la fenêtre redevient active
      // (utile après une redirection ou un refresh)
      if (user && !authLoading) {
        loadProperty();
      }
    };
    
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-white/70">Chargement...</div>
      </div>
    );
  }

  if (!property) {
    return null;
  }

  const verificationStatus = property.verification_status || null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR", {
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header avec bouton retour */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/compte/mes-biens")}
          className="text-white/70 hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à mes biens
        </Button>
        <Link href={`/compte/biens/edit/${propertyId}`}>
          <Button variant="secondary" size="sm">
            Modifier
          </Button>
        </Link>
      </div>

      {/* Titre du bien */}
      <div>
        <h1 className="text-3xl font-semibold text-white">{property.title}</h1>
        <p className="mt-2 text-lg text-white/70">
          {formatPrice(property.price)} FCFA
        </p>
      </div>

      {/* Image principale */}
      {property.images && property.images[0] && (
        <div className="relative h-[400px] w-full overflow-hidden rounded-2xl">
          <Image
            src={property.images[0]}
            alt={property.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
            priority
          />
        </div>
      )}

      {/* Informations principales */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">Informations principales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-white/60">Type</p>
              <p className="text-white">{property.details?.type || "Non spécifié"}</p>
            </div>
            <div>
              <p className="text-sm text-white/60">Surface</p>
              <p className="text-white">{property.specs?.surface} m²</p>
            </div>
            <div>
              <p className="text-sm text-white/60">Pièces</p>
              <p className="text-white">
                {property.specs?.rooms} pièce{property.specs?.rooms && property.specs.rooms > 1 ? "s" : ""}
                {property.specs?.bedrooms && ` • ${property.specs.bedrooms} chambre${property.specs.bedrooms > 1 ? "s" : ""}`}
              </p>
            </div>
            <div>
              <p className="text-sm text-white/60">Localisation</p>
              <p className="text-white">
                {property.location.city}
                {property.location.address && `, ${property.location.address}`}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">Statut de publication</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-white/60">Statut</p>
              <p className="text-white capitalize">
                {property.status || "disponible"}
              </p>
            </div>
            <div>
              <p className="text-sm text-white/60">Transaction</p>
              <p className="text-white capitalize">{property.transaction}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section Vérification du Bien */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Vérification du bien</CardTitle>
                <CardDescription className="text-white/60">
                  Certifiez votre bien pour plus de visibilité
                </CardDescription>
              </div>
              {verificationStatus && (
                <VerificationStatusBadge status={verificationStatus} />
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Statut: verified */}
            {verificationStatus === "verified" && (
              <div className="flex items-start gap-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-emerald-300">
                    Votre bien est vérifié et certifié
                  </p>
                  <p className="mt-1 text-sm text-emerald-200/80">
                    Votre bien est certifié et mis en avant sur la plateforme. Les utilisateurs
                    peuvent faire confiance à votre annonce.
                  </p>
                </div>
              </div>
            )}

            {/* Statut: pending */}
            {verificationStatus === "pending" && (
              <div className="flex items-start gap-3 rounded-lg bg-amber-500/10 border border-amber-500/20 p-4">
                <Clock className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-amber-300">
                    Vérification en cours
                  </p>
                  <p className="mt-1 text-sm text-amber-200/80">
                    Nos équipes analysent votre document. Vous serez notifié dès que la vérification
                    sera terminée.
                  </p>
                  {property.verification_requested_at && (
                    <p className="mt-2 text-xs text-amber-200/60">
                      Demande soumise le{" "}
                      {new Date(property.verification_requested_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Statut: rejected */}
            {verificationStatus === "rejected" && (
              <div className="flex items-start gap-3 rounded-lg bg-red-500/10 border border-red-500/20 p-4">
                <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-red-300">
                    Vérification refusée
                  </p>
                  {property.verification_rejection_reason && (
                    <p className="mt-2 text-sm text-red-200/90 bg-red-500/10 rounded-lg p-3 border border-red-500/20">
                      <span className="font-medium">Raison :</span> {property.verification_rejection_reason}
                    </p>
                  )}
                  <p className="mt-2 text-sm text-red-200/80">
                    Vous pouvez soumettre un nouveau document pour relancer la vérification.
                  </p>
                </div>
              </div>
            )}

            {/* Statut: null (aucune vérification) */}
            {verificationStatus === null && (
              <div className="rounded-lg bg-white/5 border border-white/10 p-4">
                <p className="text-sm text-white/70">
                  Soumettez un document de preuve de propriété pour certifier votre bien. Les biens
                  vérifiés bénéficient d&apos;une meilleure visibilité et de la confiance des utilisateurs.
                </p>
              </div>
            )}

            {/* Formulaire d'upload - Affiché uniquement si verified, rejected ou null */}
            {(verificationStatus === null || verificationStatus === "rejected") && (
              <div className="mt-4">
                <VerificationUploadForm
                  propertyId={property.id}
                  currentStatus={verificationStatus}
                  proofDocumentUrl={property.proof_document_url}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Description */}
      {property.description && (
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white/80 whitespace-pre-line">{property.description}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
