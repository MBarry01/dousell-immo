import { NextRequest, NextResponse } from 'next/server';
import ReactPDF from '@react-pdf/renderer';
import { createQuittanceDocument } from '@/components/pdf/QuittancePDF_v2';
import { createAdminClient } from '@/utils/supabase/admin';
import { getTenantSessionFromCookie } from '@/lib/tenant-magic-link';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // 1. Vérifier la session tenant via cookie
        const session = await getTenantSessionFromCookie();
        if (!session) {
            return NextResponse.json({ error: 'Session expirée' }, { status: 401 });
        }

        const { id: transactionId } = await params;
        const adminClient = createAdminClient();

        // 2. Récupérer la transaction (vérifier qu'elle appartient au bail du tenant)
        const { data: transaction, error } = await adminClient
            .from('rental_transactions')
            .select(`
                *,
                leases (
                    id,
                    tenant_name,
                    tenant_email,
                    tenant_phone,
                    property_address,
                    owner_id,
                    profiles:owner_id (
                        full_name,
                        company_name,
                        company_address,
                        company_ninea,
                        logo_url,
                        signature_url
                    )
                )
            `)
            .eq('id', transactionId)
            .single();

        if (error || !transaction) {
            return NextResponse.json({ error: 'Quittance introuvable' }, { status: 404 });
        }

        // 3. Sécurité : vérifier que la transaction appartient au bail du tenant
        if (transaction.lease_id !== session.lease_id) {
            return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
        }

        const lease = transaction.leases as any;
        const ownerProfile = lease.profiles;

        // 4. Préparer les données pour le PDF
        const isGuarantee = transaction.period_month === 0;
        const periodDate = isGuarantee
            ? new Date()
            : new Date(transaction.period_year, transaction.period_month - 1);
        const periodMonthStr = isGuarantee
            ? 'Garantie'
            : periodDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });

        const firstDay = isGuarantee
            ? new Date()
            : new Date(transaction.period_year, transaction.period_month - 1, 1);
        const lastDay = isGuarantee
            ? new Date()
            : new Date(transaction.period_year, transaction.period_month, 0);

        const pdfData = {
            tenantName: lease.tenant_name,
            tenantEmail: lease.tenant_email || '',
            tenantPhone: lease.tenant_phone || '',
            tenantAddress: lease.property_address,
            amount: transaction.amount_paid || transaction.amount_due,
            periodMonth: periodMonthStr,
            periodStart: firstDay.toLocaleDateString('fr-FR'),
            periodEnd: lastDay.toLocaleDateString('fr-FR'),
            receiptNumber: `QUITT-${transaction.id.substring(0, 8).toUpperCase()}`,
            ownerName: ownerProfile?.company_name || ownerProfile?.full_name || 'Propriétaire',
            ownerAddress: ownerProfile?.company_address || '',
            ownerNinea: ownerProfile?.company_ninea || '',
            ownerLogo: ownerProfile?.logo_url || undefined,
            ownerSignature: ownerProfile?.signature_url || undefined,
            propertyAddress: lease.property_address,
            isGuarantee,
        };

        // 5. Générer le PDF
        const pdfDocument = createQuittanceDocument(pdfData);
        const stream = await ReactPDF.renderToStream(pdfDocument);

        const chunks: Uint8Array[] = [];
        for await (const chunk of stream) {
            chunks.push(chunk as Uint8Array);
        }
        const pdfBuffer = Buffer.concat(chunks);

        // 6. Retourner le PDF
        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="Quittance_${pdfData.receiptNumber}.pdf"`,
            },
        });

    } catch (error) {
        console.error('Erreur génération PDF quittance tenant:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la génération du PDF' },
            { status: 500 }
        );
    }
}
