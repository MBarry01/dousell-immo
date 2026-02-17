"use client";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Warning, CreditCard, Buildings, Check } from "@phosphor-icons/react";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  /** If true, user cannot dismiss the modal */
  blocking?: boolean;
  /** Number of properties the user has */
  propertiesCount?: number;
  /** Number of active leases */
  leasesCount?: number;
  /** Subscription status for adaptive messaging */
  proStatus?: string | null;
}

/**
 * Upgrade Modal - Shown to users with expired/canceled/unpaid subscription
 *
 * Adapts its title and description based on the subscription status:
 * - past_due (trial expired) -> "Votre essai a expiré"
 * - canceled -> "Votre abonnement a été résilié"
 * - unpaid/incomplete -> "Paiement en attente"
 */
export function UpgradeModal({
  open,
  onOpenChange,
  blocking = false,
  propertiesCount = 0,
  leasesCount = 0,
  proStatus,
}: UpgradeModalProps) {
  const router = useRouter();

  const handleUpgrade = () => {
    router.push("/gestion/abonnement");
  };

  // Adaptive title based on subscription status
  const title = proStatus === "canceled"
    ? "Votre abonnement a été résilié"
    : proStatus === "unpaid" || proStatus === "incomplete"
      ? "Paiement en attente"
      : "Votre essai a expiré";

  const description = proStatus === "canceled"
    ? "Réactivez votre abonnement pour retrouver l'accès complet à la gestion locative."
    : proStatus === "unpaid" || proStatus === "incomplete"
      ? "Un paiement est en attente. Régularisez votre situation pour retrouver l'accès complet."
      : "Réactivez votre abonnement pour retrouver l'accès complet à la gestion locative.";

  return (
    <Dialog
      open={open}
      onOpenChange={blocking ? undefined : onOpenChange}
    >
      <DialogContent
        className="sm:max-w-md bg-card border-border"
        onPointerDownOutside={blocking ? (e) => e.preventDefault() : undefined}
        onEscapeKeyDown={blocking ? (e) => e.preventDefault() : undefined}
      >
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Warning size={32} className="text-primary" />
          </div>
          <DialogTitle className="text-xl text-foreground">
            {title}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>

        {/* Data preservation notice */}
        {(propertiesCount > 0 || leasesCount > 0) && (
          <div className="my-4 p-4 bg-muted border border-border rounded-xl">
            <div className="flex items-start gap-3">
              <Buildings size={20} className="text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-foreground font-medium text-sm">Vos données sont préservées</p>
                <p className="text-muted-foreground text-xs mt-1">
                  {propertiesCount} bien(s) et {leasesCount} bail(s) actif(s) vous attendent.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Benefits */}
        <div className="space-y-2 my-4">
          {[
            "Gestion complète de vos biens",
            "Génération de contrats et quittances",
            "Suivi des paiements en temps réel",
          ].map((benefit, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Check size={12} className="text-emerald-500" />
              </div>
              <span className="text-muted-foreground">{benefit}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Button
          onClick={handleUpgrade}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11"
        >
          <CreditCard size={18} className="mr-2" />
          Réactiver mon abonnement
        </Button>

        {/* Read-only access note */}
        {!blocking && (
          <p className="text-center text-muted-foreground text-[10px] mt-2">
            Vous pouvez consulter vos données en lecture seule.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
