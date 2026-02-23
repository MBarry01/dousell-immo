'use client';

import { useTheme } from "@/components/theme-provider";
import { KPICardSkeleton, ChartSkeleton, ListSkeleton } from "./components/PremiumSkeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingClient() {
    const { isDark } = useTheme();

    return (
        <div className={`min-h-screen p-6 md:p-8 pt-safe pb-safe no-select ${isDark ? 'bg-slate-950' : 'bg-gray-50'}`}>
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Skeleton */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-2">
                        <Skeleton className={`h-10 w-64 rounded-xl ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-gray-200'}`} />
                        <Skeleton className={`h-4 w-96 rounded-lg ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-gray-200'}`} />
                    </div>
                    <Skeleton className={`h-10 w-40 rounded-xl ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-gray-200'}`} />
                </div>

                {/* Tabs Skeleton */}
                <Skeleton className={`h-12 w-80 rounded-xl ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-gray-200'}`} />

                {/* KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <KPICardSkeleton />
                    <KPICardSkeleton />
                    <KPICardSkeleton />
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <ChartSkeleton className="h-[450px]" />
                    </div>
                    <div className="space-y-6">
                        <Skeleton className={`h-10 w-full rounded-xl ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-gray-200'}`} />
                        <ListSkeleton count={4} />
                    </div>
                </div>
            </div>
        </div>
    );
}
