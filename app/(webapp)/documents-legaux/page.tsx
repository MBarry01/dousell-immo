import { getLegalStats, getLeaseAlerts, getAllActiveLeases } from "./actions";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { LegalPageClient } from "./LegalPageClient";
import { getOwnerProfileForReceipts } from "@/services/rentalService.cached";

export default async function LegalPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/auth');
    }

    // Récupérer les données en parallèle
    const [stats, alerts, leases, profile] = await Promise.all([
        getLegalStats(),
        getLeaseAlerts(),
        getAllActiveLeases(),
        getOwnerProfileForReceipts(user.id)
    ]);

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

