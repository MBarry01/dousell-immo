import { Skeleton } from "@/components/ui/skeleton";

export default function TenantPortalLoading() {
    return (
        <div className="space-y-4 sm:space-y-6 px-4 py-6 max-w-lg mx-auto">
            {/* Carte principale Skeleton - Style Banking (garde le thème sombre) */}
            <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <Skeleton className="h-4 w-16 mb-2 rounded bg-zinc-700" />
                        <Skeleton className="h-6 w-32 rounded bg-zinc-700" />
                    </div>
                    <Skeleton className="w-10 h-10 rounded-full bg-amber-500/30" />
                </div>
                <div className="mb-6">
                    <Skeleton className="h-3 w-24 mb-3 rounded bg-zinc-700" />
                    <Skeleton className="h-10 w-40 mb-2 rounded bg-zinc-700" />
                    <Skeleton className="h-4 w-28 rounded bg-zinc-700/50" />
                </div>
                <Skeleton className="h-12 w-full rounded-xl bg-white/20" />
                <Skeleton className="h-3 w-48 mx-auto mt-3 rounded bg-zinc-700/50" />
            </div>

            {/* Actions rapides Skeleton */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded-lg bg-slate-200" />
                        <div>
                            <Skeleton className="h-4 w-20 mb-1 rounded bg-slate-200" />
                            <Skeleton className="h-3 w-24 rounded bg-slate-100" />
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded-lg bg-slate-200" />
                        <div>
                            <Skeleton className="h-4 w-20 mb-1 rounded bg-slate-200" />
                            <Skeleton className="h-3 w-24 rounded bg-slate-100" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Historique Skeleton */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                    <Skeleton className="h-5 w-24 rounded bg-slate-200" />
                </div>
                <div className="divide-y divide-slate-100">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="px-4 py-3.5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Skeleton className="w-8 h-8 rounded-full bg-slate-200" />
                                <div>
                                    <Skeleton className="h-4 w-28 mb-1 rounded bg-slate-200" />
                                    <Skeleton className="h-3 w-20 rounded bg-slate-100" />
                                </div>
                            </div>
                            <div className="text-right">
                                <Skeleton className="h-4 w-16 mb-1 rounded bg-slate-200" />
                                <Skeleton className="h-4 w-12 rounded bg-slate-100" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Infos logement Skeleton */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <Skeleton className="w-9 h-9 rounded-lg bg-white border border-slate-200" />
                    <div className="flex-1">
                        <Skeleton className="h-3 w-20 mb-1.5 rounded bg-slate-200" />
                        <Skeleton className="h-4 w-48 mb-2 rounded bg-slate-200" />
                        <Skeleton className="h-3 w-32 rounded bg-slate-100" />
                    </div>
                </div>
            </div>
        </div>
    );
}

