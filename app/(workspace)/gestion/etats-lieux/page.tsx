import { getInventoryReports } from './actions';
import { EtatsLieuxContent } from './components/EtatsLieuxContent';
import { getUserTeamContext } from "@/lib/team-permissions.server";
import { getActivationData } from "@/lib/activation/get-activation-stage";
import { ActivationInlineNotice } from "@/components/activation/ActivationInlineNotice";

export const metadata = {
    title: 'États des Lieux - Gestion Locative',
};

export default async function EtatsLieuxPage() {
    const [{ data: reports, error }, teamContext] = await Promise.all([
        getInventoryReports(),
        getUserTeamContext(),
    ]);

    const activation = teamContext ? await getActivationData(teamContext.team_id) : null;
    const isLocked = !activation || activation.stage < 3;
    const ctaHref = activation?.firstPropertyId
        ? `/gestion/biens/${activation.firstPropertyId}`
        : "/gestion/biens";

    return (
        <>
            {isLocked && (
                <ActivationInlineNotice
                    moduleLabel="les États des Lieux"
                    requiredAction="ajoutez d'abord un locataire"
                    ctaLabel="Ajouter un locataire →"
                    ctaHref={ctaHref}
                />
            )}
            <div className={isLocked ? "pointer-events-none opacity-40" : ""}>
                <EtatsLieuxContent reports={reports} error={error || null} />
            </div>
        </>
    );
}
