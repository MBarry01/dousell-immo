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
}

/**
 * Upgrade Modal - Shown to users with expired subscription
 *
 * Per WORKFLOW_PROPOSAL.md section 11.1:
 * - Users with pro_status: "expired" see this modal
 * - They can access /gestion in READ-ONLY mode
 * - This modal prompts them to reactivate
 */
export function UpgradeModal({
  open,
  onOpenChange,
  blocking = false,
  propertiesCount = 0,
  leasesCount = 0,
}: UpgradeModalProps) {
  const router = useRouter();

  const handleUpgrade = () => {
    router.push("/gestion/subscription");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={blocking ? undefined : onOpenChange}
    >
      <DialogContent
        className="sm:max-w-md bg-zinc-900 border-zinc-800"
        onPointerDownOutside={blocking ? (e) => e.preventDefault() : undefined}
        onEscapeKeyDown={blocking ? (e) => e.preventDefault() : undefined}
      >
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
            <Warning size={32} className="text-amber-500" />
          </div>
          <DialogTitle className="text-xl text-white">
            Votre essai a expiré
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Réactivez votre abonnement pour retrouver l&apos;accès complet à la gestion locative.
          </DialogDescription>
        </DialogHeader>

        {/* Data preservation notice */}
        {(propertiesCount > 0 || leasesCount > 0) && (
          <div className="my-4 p-4 bg-white/5 border border-white/10 rounded-xl">
            <div className="flex items-start gap-3">
              <Buildings size={20} className="text-[#F4C430] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-medium text-sm">Vos données sont préservées</p>
                <p className="text-white/50 text-xs mt-1">
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
              <span className="text-white/70">{benefit}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Button
          onClick={handleUpgrade}
          className="w-full bg-[#F4C430] text-black hover:bg-[#F4C430]/90 h-11"
        >
          <CreditCard size={18} className="mr-2" />
          Réactiver mon abonnement
        </Button>

        {/* Read-only access note */}
        {!blocking && (
          <p className="text-center text-white/40 text-xs mt-2">
            Vous pouvez consulter vos données en lecture seule.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
