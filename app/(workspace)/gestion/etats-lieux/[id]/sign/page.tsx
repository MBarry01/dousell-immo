import { SignaturePage } from '../../components/SignaturePage';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function InventorySignPage({ params }: PageProps) {
    const { id } = await params;

    return <SignaturePage reportId={id} />;
}
