"use client";

import dynamic from "next/dynamic";
import { TrendingUp } from "lucide-react";

// Dynamically import the RevenueChart with SSR disabled
// This must be done in a Client Component to avoid the Vercel build error
const RevenueChart = dynamic(
    () => import("./RevenueChart").then((mod) => mod.RevenueChart),
    {
        ssr: false,
        loading: () => (
            <div className="h-[300px] w-full bg-muted/10 animate-pulse rounded-xl flex items-center justify-center text-xs text-muted-foreground">
                <div className="text-center space-y-2">
                    <TrendingUp className="w-5 h-5 text-primary mx-auto animate-pulse" />
                    <p>Initialisation du graphique...</p>
                </div>
            </div>
        ),
    }
);

interface RevenueChartSafeProps {
    data: any[];
}

export function RevenueChartSafe({ data }: RevenueChartSafeProps) {
    if (typeof window !== 'undefined') {
        // eslint-disable-next-line no-console
        console.log("[RevenueChartSafe] Rendering", { dataPoints: data?.length });
    }
    return <RevenueChart data={data} />;
}
