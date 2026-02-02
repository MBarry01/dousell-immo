import { EtatsLieuxContent } from "./components/EtatsLieuxContent";
import { getInventoryReports } from "./actions";

export default async function EtatsLieuxPage() {
    const { data: reports, error } = await getInventoryReports();
    return <EtatsLieuxContent reports={reports || []} error={error || null} />;
}

