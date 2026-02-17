"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Warning, ArrowRight, X } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { PLAN_FEATURES, SubscriptionTier } from "@/lib/subscription/features";

interface QuotaBannerProps {
    tier: string | null;
    propertiesCount: number;
    leasesCount: number;
}

/**
 * Banner shown when user exceeds their plan limits (e.g. after downgrade)
 */
export function QuotaBanner({
    tier,
    propertiesCount,
    leasesCount,
}: QuotaBannerProps) {
    const router = useRouter();
    const [dismissed, setDismissed] = useState(false);

    const normalizedTier = (tier?.toLowerCase() || 'starter') as SubscriptionTier;
    const features = PLAN_FEATURES[normalizedTier] || PLAN_FEATURES.starter;

    const isPropertyOverflow = propertiesCount > features.limits.maxProperties;
    const isLeaseOverflow = leasesCount > features.limits.maxLeases;

    const isOverflow = isPropertyOverflow || isLeaseOverflow;

    if (!isOverflow || dismissed) {
        return null;
    }

    return (
        <div className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                        <Warning size={20} className="text-amber-500" />
                    </div>
                    <div>
                        <p className="text-white font-medium">Limite de quota atteinte</p>
                        <p className="text-white/60 text-sm">
                            {isPropertyOverflow && `Vous utilisez ${propertiesCount}/${features.limits.maxProperties} biens. `}
                            {isLeaseOverflow && `Vous utilisez ${leasesCount}/${features.limits.maxLeases} baux. `}
                            Passez au plan supérieur pour continuer à ajouter des données.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => router.push("/gestion/config#subscription")}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                        size="sm"
                    >
                        Passer à Pro
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
    );
}
