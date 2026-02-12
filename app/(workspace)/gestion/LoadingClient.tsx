'use client';

import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/components/theme-provider";

export function LoadingClient() {
    const { isDark } = useTheme();

    return (
        <div className={`min-h-screen py-6 ${isDark ? 'bg-slate-950' : 'bg-gray-50'}`}>
            <div className="w-full mx-auto px-4 md:px-6 space-y-6">
                <div className="flex items-center justify-between">
                    <Skeleton className={`h-10 w-48 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-gray-200'}`} />
                    <Skeleton className={`h-10 w-32 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-gray-200'}`} />
                </div>
                <Skeleton className={`h-[400px] w-full rounded-xl ${isDark ? 'bg-slate-800' : 'bg-gray-200'}`} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Skeleton className={`h-64 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-gray-200'}`} />
                    <Skeleton className={`h-64 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-gray-200'}`} />
                </div>
            </div>
        </div>
    );
}
