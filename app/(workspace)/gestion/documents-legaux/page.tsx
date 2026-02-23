import { getLegalStats, getLeaseAlerts, getAllActiveLeases } from "./actions";
import { getOwnerProfileForReceipts } from "@/services/rentalService.cached";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { LegalPageClient } from "./LegalPageClient";
import { getUserTeamContext } from "@/lib/team-context";
import { getActivationData } from "@/lib/activation/get-activation-stage";
import { ActivationInlineNotice } from "@/components/activation/ActivationInlineNotice";

export const dynamic = 'force-dynamic';

export default async function LegalAssistantPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/auth');
    }

    const [profile, stats, alerts, leases, teamContext] = await Promise.all([
        getOwnerProfileForReceipts(user.id),
        getLegalStats(),
        getLeaseAlerts(),
        getAllActiveLeases(),
        getUserTeamContext(),
    ]);

    const activation = teamContext ? await getActivationData(teamContext.team_id) : null;
    const isLocked = !activation || activation.stage < 4;
    const ctaHref = activation?.firstPropertyId
        ? `/gestion/biens/${activation.firstPropertyId}`
        : "/gestion/biens";

    return (
        <>
            {isLocked && (
                <ActivationInlineNotice
                    moduleLabel="le Juridique"
                    requiredAction="configurez d'abord un bail"
                    ctaLabel="Configurer maintenant →"
                    ctaHref={ctaHref}
                />
            )}
            <div className={isLocked ? "pointer-events-none opacity-40" : ""}>
                <LegalPageClient
                    stats={stats}
                    alerts={alerts}
                    leases={leases}
                    userEmail={user.email}
                    profile={profile}
                />
            </div>
        </>
    );
}
