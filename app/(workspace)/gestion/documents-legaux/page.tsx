import { getLegalStats, getLeaseAlerts, getAllActiveLeases } from "./actions";
import { getOwnerProfileForReceipts } from "@/services/rentalService.cached";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { LegalPageClient } from "./LegalPageClient";

export const dynamic = 'force-dynamic';

export default async function LegalAssistantPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/auth');
    }

    const profile = await getOwnerProfileForReceipts(user.id);

    const stats = await getLegalStats();
    const alerts = await getLeaseAlerts();
    const leases = await getAllActiveLeases();

    return (
        <LegalPageClient
            stats={stats}
            alerts={alerts}
            leases={leases}
            userEmail={user.email}
            profile={profile}
        />
    );
}

