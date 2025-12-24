"use client";

import { useEffect, useState, useTransition } from "react";
import { CheckCircle2, XCircle, FileText, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { VerificationStatusBadge } from "@/components/dashboard/verification-status-badge";
import { getPendingVerifications, reviewVerification } from "@/app/_actions/admin-verification";
import type { VerificationRequest } from "@/app/_actions/admin-verification";

export function VerificationQueue() {
  const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVerification, setSelectedVerification] = useState<VerificationRequest | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadVerifications = async () => {
    setLoading(true);
    const result = await getPendingVerifications();
    if (result.success && result.data) {
      setVerifications(result.data);
    } else {
      toast.error("Erreur", {
        description: result.error || "Impossible de charger les demandes.",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadVerifications();
  }, []);

  const handleReview = (verification: VerificationRequest, action: "approve" | "reject") => {
    setSelectedVerification(verification);
    setReviewAction(action);
    setReviewDialogOpen(true);
  };

  const confirmReview = () => {
    if (!selectedVerification || !reviewAction) return;

    startTransition(async () => {
      const result = await reviewVerification(
        selectedVerification.propertyId,
        reviewAction === "approve" ? "verified" : "rejected"
      );

      if (result.success) {
        toast.success(
          reviewAction === "approve" ? "Vérification approuvée" : "Vérification refusée"
        );
        setReviewDialogOpen(false);
        setSelectedVerification(null);
        setReviewAction(null);
        await loadVerifications();
      } else {
        toast.error("Erreur", {
          description: result.error || "Une erreur est survenue.",
        });
      }
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR", {
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-white/60" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Vérifications en attente</h2>
          <p className="mt-1 text-sm text-white/60">
            {verifications.length} demande{verifications.length > 1 ? "s" : ""} à traiter
          </p>
        </div>
        {verifications.length > 0 && (
          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
            {verifications.length} en attente
          </Badge>
        )}
      </div>

      {verifications.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-white/40 mb-4" />
          <p className="text-lg text-white/70">Aucune vérification en attente</p>
          <p className="mt-2 text-sm text-white/50">
            Toutes les demandes ont été traitées.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead className="text-white/70">Bien</TableHead>
                <TableHead className="text-white/70">Propriétaire</TableHead>
                <TableHead className="text-white/70">Document</TableHead>
                <TableHead className="text-white/70">Date</TableHead>
                <TableHead className="text-white/70 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {verifications.map((verification) => (
                <TableRow key={verification.id} className="border-white/10">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {verification.propertyImages && verification.propertyImages[0] && (
                        <div className="relative h-12 w-12 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={verification.propertyImages[0]}
                            alt={verification.propertyTitle}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-white">{verification.propertyTitle}</p>
                        <p className="text-sm text-white/60">
                          {formatPrice(verification.propertyPrice)} FCFA
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-white">{verification.ownerName}</p>
                      <p className="text-sm text-white/60">{verification.ownerEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {verification.proofDocumentUrl ? (
                      <a
                        href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/certifications/${verification.proofDocumentUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
                      >
                        <FileText className="h-4 w-4" />
                        Voir le document
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-white/40 text-sm">Aucun document</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-white/70 text-sm">
                      {formatDate(verification.verificationRequestedAt)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReview(verification, "approve")}
                        className="text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Approuver
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReview(verification, "reject")}
                        className="text-red-400 border-red-500/30 hover:bg-red-500/10"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Refuser
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialog de confirmation */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="border-white/10 bg-[#05080c] text-white">
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "approve" ? "Approuver la vérification" : "Refuser la vérification"}
            </DialogTitle>
            <DialogDescription className="text-white/60">
              {reviewAction === "approve" ? (
                <>
                  Confirmez-vous l&apos;approbation de la vérification pour{" "}
                  <strong>{selectedVerification?.propertyTitle}</strong> ?
                </>
              ) : (
                <>
                  Confirmez-vous le refus de la vérification pour{" "}
                  <strong>{selectedVerification?.propertyTitle}</strong> ?
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReviewDialogOpen(false);
                setSelectedVerification(null);
                setReviewAction(null);
              }}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button
              variant={reviewAction === "approve" ? "default" : "outline"}
              onClick={confirmReview}
              disabled={isPending}
              className={reviewAction === "reject" ? "border-red-500/30 text-red-400 hover:bg-red-500/10" : ""}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Traitement...
                </>
              ) : reviewAction === "approve" ? (
                "Approuver"
              ) : (
                "Refuser"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
