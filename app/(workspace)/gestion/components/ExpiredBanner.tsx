"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Warning, ArrowRight, X } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { UpgradeModal } from "@/components/gestion/UpgradeModal";

interface ExpiredBannerProps {
  proStatus: string | null;
  propertiesCount?: number;
  leasesCount?: number;
}

/**
 * Banner shown to users with expired subscription
 *
 * Per WORKFLOW_PROPOSAL.md section 11.1:
 * - Shows a persistent banner at the top
 * - Can show blocking modal if ?upgrade=required in URL
 * - Users can still access data in read-only mode
 */
export function ExpiredBanner({
  proStatus,
  propertiesCount = 0,
  leasesCount = 0,
}: ExpiredBannerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showModal, setShowModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const isExpired = proStatus === "past_due" || proStatus === "canceled" || proStatus === "unpaid" || proStatus === "incomplete";
  const upgradeRequired = searchParams.get("upgrade") === "required";

  // Show modal if ?upgrade=required
  useEffect(() => {
    if (upgradeRequired && isExpired) {
      setShowModal(true);
    }
  }, [upgradeRequired, isExpired]);

  if (!isExpired || dismissed) {
    return null;
  }

  return (
    <>
      {/* Persistent banner */}
      <div className="mb-6 bg-gradient-to-r from-amber-500/10 to-red-500/10 border border-amber-500/30 rounded-xl p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Warning size={20} className="text-amber-500" />
            </div>
            <div>
              <p className="text-white font-medium">
                {proStatus === "canceled" ? "Votre abonnement a été résilié" :
                 proStatus === "unpaid" || proStatus === "incomplete" ? "Paiement en attente" :
                 "Votre essai a expiré"}
              </p>
              <p className="text-white/60 text-sm">
                Accès en lecture seule. Réactivez pour modifier vos données.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => router.push("/gestion/abonnement")}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Réactiver
              <ArrowRight size={16} className="ml-1" />
            </Button>
            <button
              onClick={() => setDismissed(true)}
              className="p-2 text-white/40 hover:text-white/60 transition-colors"
              aria-label="Fermer"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal (shown when ?upgrade=required) */}
      <UpgradeModal
        open={showModal}
        onOpenChange={setShowModal}
        blocking={upgradeRequired}
        propertiesCount={propertiesCount}
        leasesCount={leasesCount}
        proStatus={proStatus}
      />
    </>
  );
}
