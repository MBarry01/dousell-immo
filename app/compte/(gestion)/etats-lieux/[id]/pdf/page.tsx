import { PDFPreview } from './PDFPreview';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function InventoryPDFPage({ params }: PageProps) {
    const { id } = await params;

    return <PDFPreview reportId={id} />;
}
