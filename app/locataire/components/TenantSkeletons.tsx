import { Skeleton } from "@/components/ui/skeleton";

export function TerminalSkeleton() {
    return (
        <div className="relative overflow-hidden rounded-[2.5rem] bg-white border border-slate-200 shadow-xl p-6 md:p-8 space-y-6">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100" />
            <div className="flex flex-col md:flex-row md:items-stretch justify-between gap-6 md:gap-8">
                <div className="flex-1">
                    <header className="flex items-center gap-3 mb-6 pt-2">
                        <Skeleton className="w-12 h-12 rounded-xl" variant="luxury" />
                        <div className="space-y-2">
                            <Skeleton className="w-24 h-2" variant="text" />
                            <Skeleton className="w-40 h-6" variant="luxury" />
                        </div>
                    </header>
                    <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100 shadow-inner space-y-4">
                        <Skeleton className="w-20 h-2" variant="text" />
                        <div className="flex items-baseline gap-2">
                            <Skeleton className="w-48 h-16" variant="luxury" />
                            <Skeleton className="w-12 h-4" variant="text" />
                        </div>
                        <div className="flex justify-between items-center mt-4">
                            <Skeleton className="w-28 h-6 rounded-lg" variant="luxury" />
                            <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-200 animate-pulse" />
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-200 animate-pulse delay-75" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="md:w-64 flex flex-col gap-3 self-end">
                    <Skeleton className="w-full h-14 rounded-2xl" variant="luxury" />
                    <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-2">
                        <Skeleton className="w-16 h-2" variant="text" />
                        <Skeleton className="w-24 h-4" variant="luxury" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export function BentoGridSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-[2rem] border border-slate-200 p-6 space-y-4">
                    <div className="flex items-center gap-4">
                        <Skeleton className="w-14 h-14 rounded-2xl" variant="luxury" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="w-2/3 h-4" variant="luxury" />
                            <Skeleton className="w-1/3 h-3" variant="text" />
                        </div>
                    </div>
                    <Skeleton className="w-full h-12 rounded-xl" variant="default" />
                </div>
            ))}
        </div>
    );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="space-y-4">
            {[...Array(count)].map((_, i) => (
                <div key={i} className="w-full bg-white rounded-[2rem] border border-slate-200 p-5 flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <Skeleton className="w-14 h-14 rounded-2xl" variant="luxury" />
                        <div className="space-y-2">
                            <Skeleton className="w-32 h-4" variant="luxury" />
                            <Skeleton className="w-24 h-3" variant="text" />
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right space-y-2">
                            <Skeleton className="w-20 h-4" variant="luxury" />
                            <Skeleton className="w-16 h-4 rounded-full" variant="default" />
                        </div>
                        <Skeleton className="w-5 h-5 rounded-full" variant="default" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function PageHeaderSkeleton() {
    return (
        <div className="space-y-2 mb-8">
            <Skeleton className="w-64 h-8" variant="luxury" />
            <Skeleton className="w-48 h-3" variant="text" />
        </div>
    );
}
