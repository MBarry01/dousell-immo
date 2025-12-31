import { requireAnyRole } from "@/lib/permissions";
import { getActivationRequests } from "./actions";
import { ActivationRequestsList } from "./components/ActivationRequestsList";
import { Building2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ActivationRequestsPage() {
    await requireAnyRole();

    const requests = await getActivationRequests();
    const pendingCount = requests.filter(r => r.status === 'pending').length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Building2 className="w-7 h-7" />
                        Demandes d'activation
                    </h1>
                    <p className="text-zinc-400 mt-1">
                        Validez les demandes d'activation Gestion Locative
                    </p>
                </div>
                {pendingCount > 0 && (
                    <div className="bg-amber-500/20 text-amber-400 px-4 py-2 rounded-full text-sm font-medium">
                        {pendingCount} en attente
                    </div>
                )}
            </div>

            {/* Liste des demandes */}
            <ActivationRequestsList requests={requests} />
        </div>
    );
}
