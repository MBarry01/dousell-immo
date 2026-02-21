'use client';

import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

interface SkeletonProps {
    className?: string;
}

export function KPICardSkeleton({ className }: SkeletonProps) {
    const { isDark } = useTheme();
    return (
        <div className={cn(
            "p-6 rounded-xl border animate-pulse",
            isDark ? "bg-slate-900/50 border-slate-800" : "bg-white border-gray-100",
            className
        )}>
            <div className="flex items-center gap-2 mb-4">
                <Skeleton className={cn("w-4 h-4 rounded", isDark ? "bg-slate-800" : "bg-gray-200")} />
                <Skeleton className={cn("h-3 w-24 rounded", isDark ? "bg-slate-800" : "bg-gray-200")} />
            </div>
            <div className="space-y-2">
                <Skeleton className={cn("h-8 w-16 rounded", isDark ? "bg-slate-800" : "bg-gray-200")} />
                <Skeleton className={cn("h-3 w-32 rounded", isDark ? "bg-slate-800" : "bg-gray-200")} />
            </div>
        </div>
    );
}

export function ChartSkeleton({ className }: SkeletonProps) {
    const { isDark } = useTheme();
    return (
        <div className={cn(
            "p-6 rounded-2xl border animate-pulse",
            isDark ? "bg-slate-900/50 border-slate-800" : "bg-white border-gray-100",
            className
        )}>
            <div className="flex items-center justify-between mb-8">
                <div className="space-y-2">
                    <Skeleton className={cn("h-4 w-48 rounded", isDark ? "bg-slate-800" : "bg-gray-200")} />
                    <Skeleton className={cn("h-3 w-32 rounded", isDark ? "bg-slate-800" : "bg-gray-200")} />
                </div>
                <Skeleton className={cn("h-8 w-32 rounded", isDark ? "bg-slate-800" : "bg-gray-200")} />
            </div>
            <div className="flex items-end gap-2 h-64 h-full">
                {[...Array(12)].map((_, i) => (
                    <Skeleton
                        key={i}
                        className={cn(
                            "flex-1 rounded-t-sm",
                            isDark ? "bg-slate-800/50" : "bg-gray-100"
                        )}
                        style={{ height: `${20 + Math.random() * 80}%` }}
                    />
                ))}
            </div>
        </div>
    );
}

export function ListSkeleton({ count = 5, className }: { count?: number } & SkeletonProps) {
    const { isDark } = useTheme();
    return (
        <div className={cn("space-y-4", className)}>
            {[...Array(count)].map((_, i) => (
                <div key={i} className={cn(
                    "p-4 rounded-xl border flex items-center justify-between",
                    isDark ? "bg-slate-900/30 border-slate-800" : "bg-white border-gray-200"
                )}>
                    <div className="flex items-center gap-4">
                        <Skeleton className={cn("w-10 h-10 rounded-lg", isDark ? "bg-slate-800" : "bg-gray-200")} />
                        <div className="space-y-2">
                            <Skeleton className={cn("h-4 w-32 md:w-48 rounded", isDark ? "bg-slate-800" : "bg-gray-200")} />
                            <Skeleton className={cn("h-3 w-24 rounded", isDark ? "bg-slate-800" : "bg-gray-200")} />
                        </div>
                    </div>
                    <Skeleton className={cn("h-8 w-8 rounded-full", isDark ? "bg-slate-800" : "bg-gray-200")} />
                </div>
            ))}
        </div>
    );
}

export function DocumentGridSkeleton({ count = 6 }: { count?: number }) {
    const { isDark } = useTheme();
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(count)].map((_, i) => (
                <div key={i} className={cn(
                    "p-4 rounded-xl border space-y-4",
                    isDark ? "bg-slate-900/50 border-slate-800" : "bg-white border-gray-200"
                )}>
                    <div className="flex items-start justify-between">
                        <Skeleton className={cn("w-10 h-10 rounded-lg", isDark ? "bg-slate-800" : "bg-gray-200")} />
                        <div className="flex gap-2">
                            <Skeleton className={cn("w-7 h-7 rounded", isDark ? "bg-slate-800" : "bg-gray-200")} />
                            <Skeleton className={cn("w-7 h-7 rounded", isDark ? "bg-slate-800" : "bg-gray-200")} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Skeleton className={cn("h-5 w-full rounded", isDark ? "bg-slate-800" : "bg-gray-200")} />
                        <Skeleton className={cn("h-3 w-2/3 rounded", isDark ? "bg-slate-800" : "bg-gray-200")} />
                    </div>
                    <div className="pt-4 border-t border-slate-800 flex justify-between">
                        <Skeleton className={cn("h-3 w-20 rounded", isDark ? "bg-slate-800" : "bg-gray-200")} />
                        <Skeleton className={cn("h-3 w-16 rounded", isDark ? "bg-slate-800" : "bg-gray-200")} />
                    </div>
                </div>
            ))}
        </div>
    );
}
