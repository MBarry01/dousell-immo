import { Suspense } from "react";
import DashboardContent from "./dash-content";
import { getUserTeamContext } from "@/lib/team-context";
import { redirect } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

// Force dynamic rendering to prevent stale RSC cache on navigation
export const dynamic = "force-dynamic";

function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-lg" variant="luxury" />
                ))}
            </div>
            <Skeleton className="h-[400px] rounded-xl" variant="luxury" />
        </div>
    );
}

function DashboardError({ error }: { error: string }) {
    return (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center space-y-2">
            <p className="text-red-400 font-semibold">Erreur de chargement du dashboard</p>
            <p className="text-sm text-red-300/70">{error}</p>
            <p className="text-xs text-neutral-500">Consultez les logs serveur pour plus de détails.</p>
        </div>
    );
}

export default async function GestionLocativePage({
    searchParams,
}: {
    searchParams?: Promise<{ view?: string; upgrade?: string }>;
}) {
    const t0 = Date.now();
    console.log("[Gestion/page] ▶ Début chargement page /gestion");

    // 1. Initialisation - Essayer de récupérer le contexte rapidement
    let context;
    try {
        context = await getUserTeamContext();
        console.log("[Gestion/page] ✓ Contexte récupéré en", Date.now() - t0, "ms", {
            userId: context?.user?.id?.slice(0, 8),
            teamId: context?.teamId?.slice(0, 8),
            role: context?.role,
            tier: context?.subscription_tier,
            status: context?.subscription_status,
        });
    } catch (err) {
        console.error("[Gestion/page] ✗ Erreur getUserTeamContext:", err);
        redirect("/auth/login?reason=timeout");
    }

    if (!context) {
        console.warn("[Gestion/page] ✗ Contexte null, redirection login");
        redirect("/auth/login?reason=timeout");
    }

    return (
        <Suspense fallback={<DashboardSkeleton />}>
            <DashboardContent context={context} searchParams={searchParams} />
        </Suspense>
    );
}
