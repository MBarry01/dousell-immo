"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  Eye,
  Calendar,
  CreditCard,
  Loader2,
  ExternalLink,
  FileText,
  Shield,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

type PropertyModerationCardProps = {
  property: {
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
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => void;
  isApproving?: boolean;
  isRejecting?: boolean;
};

export function PropertyModerationCard({
  property,
  onApprove,
  onReject,
  isApproving = false,
  isRejecting = false,
}: PropertyModerationCardProps) {
  const [imageError, setImageError] = useState(false);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Date inconnue";
    try {
      return new Date(dateString).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Date invalide";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition-all hover:border-white/20 hover:bg-white/10"
    >
      <div className="grid gap-4 p-6 md:grid-cols-[180px_1fr_auto] lg:grid-cols-[200px_1fr_auto]">
        {/* Image */}
        <div className="relative h-40 w-full overflow-hidden rounded-xl md:h-full md:min-h-[180px]">
          {property.images?.[0] && !imageError ? (
            <Image
              src={property.images[0]}
              alt={property.title}
              fill
              sizes="(max-width: 768px) 100vw, 180px"
              className="object-cover transition-transform group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-white/5">
              <Eye className="h-8 w-8 text-white/20" />
            </div>
          )}
          {property.images && property.images.length > 1 && (
            <div className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1 text-xs text-white">
              +{property.images.length - 1}
            </div>
          )}
        </div>

        {/* Informations principales */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-white line-clamp-2 group-hover:text-amber-400 transition-colors">
                {property.title}
              </h3>
              <p className="mt-1 text-sm text-white/60 flex items-center gap-1">
                <span>{property.location.city}</span>
                {property.location.district && (
                  <>
                    <span>•</span>
                    <span>{property.location.district}</span>
                  </>
                )}
              </p>
              <p className="mt-2 text-xl font-bold text-amber-400">
                {formatCurrency(property.price)} FCFA
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${property.validation_status === "payment_pending"
                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                }`}
            >
              {property.validation_status === "payment_pending"
                ? "Paiement en attente"
                : "En attente"}
            </span>
          </div>

          {/* Métadonnées */}
          <div className="flex flex-wrap gap-4 text-sm text-white/70">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-white/40" />
              <span>{formatDate(property.created_at)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CreditCard className="h-4 w-4 text-white/40" />
              <span>
                {property.service_type === "mandat_confort"
                  ? "Mandat Agence"
                  : "Diffusion Simple"}
              </span>
            </div>
            {property.payment_ref && (
              <div className="flex items-center gap-1.5 text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-mono text-xs">{property.payment_ref}</span>
              </div>
            )}
          </div>

          {/* Actions rapides */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 rounded-full text-xs"
              asChild
            >
              <Link
                href={`/biens/${property.id}`}
                target="_blank"
                className="flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                Voir l&apos;annonce
              </Link>
            </Button>

            {/* Document preview button */}
            {property.proof_document_url && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 rounded-full text-xs text-blue-400 hover:bg-blue-500/10"
                onClick={() => window.open(property.proof_document_url!, '_blank')}
              >
                <FileText className="h-3 w-3 mr-1" />
                <Shield className="h-3 w-3 mr-1" />
                Voir document
              </Button>
            )}
          </div>
        </div>

        {/* Actions de modération */}
        <div className="flex flex-col gap-2 min-w-[140px]">
          <Button
            onClick={() => onApprove(property.id)}
            disabled={isApproving || isRejecting}
            className="w-full rounded-full bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50"
          >
            {isApproving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Validation...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Valider
              </>
            )}
          </Button>
          <Button
            onClick={() => onReject(property.id)}
            disabled={isApproving || isRejecting}
            variant="secondary"
            className="w-full rounded-full border-red-500/20 text-red-300 hover:bg-red-500/10 disabled:opacity-50"
          >
            {isRejecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Traitement...
              </>
            ) : (
              <>
                <XCircle className="mr-2 h-4 w-4" />
                Refuser
              </>
            )}
          </Button>
          {property.payment_ref && (
            <Button
              variant="outline"
              size="sm"
              className="w-full rounded-full text-xs"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(property.payment_ref || "");
                  toast.success("Référence copiée", {
                    description: property.payment_ref,
                  });
                } catch (error) {
                  toast.error("Erreur lors de la copie");
                }
              }}
            >
              Copier réf. paiement
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

