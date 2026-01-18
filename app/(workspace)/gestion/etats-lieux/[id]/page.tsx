import { InventoryEditor } from '../components/InventoryEditor';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function InventoryReportDetailPage({ params }: PageProps) {
    const { id } = await params;

    return <InventoryEditor reportId={id} />;
}
