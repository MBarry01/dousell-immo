import { getInventoryReports } from './actions';
import { EtatsLieuxContent } from './components/EtatsLieuxContent';

export const metadata = {
    title: 'États des Lieux - Gestion Locative',
};

export default async function EtatsLieuxPage() {
    const { data: reports, error } = await getInventoryReports();

    return <EtatsLieuxContent reports={reports} error={error || null} />;
}
