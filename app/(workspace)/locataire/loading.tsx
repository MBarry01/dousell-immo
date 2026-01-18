import { Skeleton } from "@/components/ui/skeleton";

export default function TenantPortalLoading() {
    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Informations Locataire Skeleton */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 sm:p-6">
                <div className="flex items-start gap-3 sm:gap-4 mb-4">
                    <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-slate-800" />
                    <div className="flex-1 min-w-0">
                        <Skeleton className="h-5 sm:h-6 w-32 sm:w-40 mb-1.5 rounded bg-slate-800" />
                        <Skeleton className="h-3 sm:h-4 w-20 rounded bg-slate-800/70" />
                    </div>
                </div>
                <Skeleton className="h-16 rounded-lg bg-slate-800/50" />
            </div>

            {/* Dates de Bail Skeleton */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 sm:p-6">
                <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-3">
                    <div className="p-3 rounded-lg bg-slate-800 border border-slate-700">
                        <Skeleton className="w-4 h-4 mx-auto mb-1.5 rounded bg-slate-700" />
                        <Skeleton className="h-2 w-12 mx-auto mb-1 rounded bg-slate-700" />
                        <Skeleton className="h-4 w-20 mx-auto rounded bg-slate-700" />
                    </div>
                    <div className="p-3 rounded-lg bg-slate-800 border border-slate-700">
                        <Skeleton className="w-4 h-4 mx-auto mb-1.5 rounded bg-slate-700" />
                        <Skeleton className="h-2 w-12 mx-auto mb-1 rounded bg-slate-700" />
                        <Skeleton className="h-4 w-20 mx-auto rounded bg-slate-700" />
                    </div>
                </div>
                <div className="pt-3 border-t border-slate-800 text-center">
                    <Skeleton className="h-3 w-32 mx-auto rounded bg-slate-800" />
                </div>
            </div>

            {/* Pièces justificatives Skeleton */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                <div className="flex items-center gap-2.5">
                    <Skeleton className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30" />
                    <div>
                        <Skeleton className="h-4 w-36 mb-1 rounded bg-slate-800" />
                        <Skeleton className="h-3 w-48 rounded bg-slate-800/70" />
                    </div>
                </div>
            </div>

            {/* Section Paiement Skeleton */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Skeleton className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/30" />
                    <div className="flex-1 min-w-0">
                        <Skeleton className="h-5 sm:h-6 w-40 mb-1 rounded bg-slate-800" />
                        <Skeleton className="h-3 w-48 rounded bg-slate-800/70" />
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <Skeleton className="h-4 w-32 mb-2 rounded bg-slate-800" />
                        <Skeleton className="h-12 sm:h-14 rounded-lg mb-3 bg-slate-800" />

                        {/* Boutons rapides */}
                        <div className="grid grid-cols-3 gap-2">
                            <div className="p-2 rounded-lg bg-slate-800 border border-slate-700">
                                <Skeleton className="h-2 w-12 mx-auto mb-1 rounded bg-slate-700" />
                                <Skeleton className="h-3 w-16 mx-auto rounded bg-slate-700" />
                            </div>
                            <div className="p-2 rounded-lg bg-slate-800 border border-slate-700">
                                <Skeleton className="h-2 w-12 mx-auto mb-1 rounded bg-slate-700" />
                                <Skeleton className="h-3 w-16 mx-auto rounded bg-slate-700" />
                            </div>
                            <div className="p-2 rounded-lg bg-slate-800 border border-slate-700">
                                <Skeleton className="h-2 w-12 mx-auto mb-1 rounded bg-slate-700" />
                                <Skeleton className="h-3 w-16 mx-auto rounded bg-slate-700" />
                            </div>
                        </div>
                    </div>

                    {/* Bouton CTA */}
                    <Skeleton className="h-12 sm:h-14 w-full rounded bg-orange-600/50" />

                    <Skeleton className="h-3 w-40 mx-auto rounded bg-slate-800/70" />
                </div>
            </div>

            {/* Historique Skeleton */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                    <Skeleton className="h-4 w-40 rounded bg-slate-800" />
                    <Skeleton className="w-4 h-4 rounded bg-slate-800" />
                </div>

                <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                    <Skeleton className="w-8 h-8 rounded-lg bg-slate-700" />
                                    <div className="flex-1 min-w-0">
                                        <Skeleton className="h-3 w-32 mb-1 rounded bg-slate-700" />
                                        <Skeleton className="h-2 w-24 rounded bg-slate-700/70" />
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <Skeleton className="h-4 w-16 mb-1 rounded bg-slate-700" />
                                    <Skeleton className="h-2 w-12 rounded bg-slate-700/70" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Mes Documents Skeleton */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 flex-1">
                        <Skeleton className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700" />
                        <div>
                            <Skeleton className="h-4 w-28 mb-1 rounded bg-slate-800" />
                            <Skeleton className="h-3 w-36 rounded bg-slate-800/70" />
                        </div>
                    </div>
                    <Skeleton className="w-4 h-4 rounded bg-slate-700" />
                </div>
            </div>
        </div>
    );
}
