import { NextRequest, NextResponse } from 'next/server';
import ReactPDF from '@react-pdf/renderer';
import { createQuittanceDocument } from '@/components/pdf/QuittancePDF_v2';
import { createClient } from '@/utils/supabase/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const transactionId = id;

        // 1. Vérifier l'authentification (plus souple pour les nouveaux onglets)
        let { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            const { data: { session } } = await supabase.auth.getSession();
            user = session?.user || null;
        }

        if (!user) {
            console.error("Auth failed for receipt API: No user session found");
            return NextResponse.json({ error: 'Session expirée ou non trouvée. Veuillez vous reconnecter.' }, { status: 401 });
        }

        // 2. Récupérer les détails de la transaction et du bail
        // On vérifie que l'utilisateur est soit le propriétaire soit le locataire (futur)
        // Pour l'instant on check owner_id via la relation lease
        const { data: transaction, error } = await supabase
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
                        email
                    )
                )
            `)
            .eq('id', transactionId)
            .single();

        if (error || !transaction) {
            return NextResponse.json({ error: 'Quittance introuvable' }, { status: 404 });
        }

        const lease = transaction.leases;
        // Sécurité: vérifier que l'user est le propriétaire
        // TODO: Ajouter check locataire si on ouvre l'accès locataire
        if (lease.owner_id !== user.id) {
            console.error(`Access denied: Lease owner is ${lease.owner_id}, requesting user is ${user.id}`);
            return NextResponse.json({ error: 'Accès interdit: Cette quittance ne vous appartient pas.' }, { status: 403 });
        }

        const ownerProfile = lease.profiles;
        const ownerName = ownerProfile?.full_name || 'Propriétaire';

        // 3. Préparer les données pour le PDF
        const periodDate = new Date(transaction.period_year, transaction.period_month - 1);
        const periodMonthStr = periodDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });

        // Calculer début/fin de période (ex: 01/01/2026 au 31/01/2026)
        const firstDay = new Date(transaction.period_year, transaction.period_month - 1, 1);
        const lastDay = new Date(transaction.period_year, transaction.period_month, 0);

        const pdfData = {
            tenantName: lease.tenant_name,
            tenantEmail: lease.tenant_email || '',
            tenantPhone: lease.tenant_phone || '',
            tenantAddress: lease.property_address, // Souvent l'adresse du bien
            amount: transaction.amount_paid || transaction.amount_due,
            periodMonth: periodMonthStr,
            periodStart: firstDay.toLocaleDateString('fr-FR'),
            periodEnd: lastDay.toLocaleDateString('fr-FR'),
            receiptNumber: `QUITT-${transaction.id.substring(0, 8).toUpperCase()}`,
            ownerName: ownerName,
            ownerAddress: "Adresse non renseignée", // A récupérer depuis le profil si dispo
            propertyAddress: lease.property_address
        };

        // 4. Générer le PDF
        const pdfDocument = createQuittanceDocument(pdfData);
        const stream = await ReactPDF.renderToStream(pdfDocument);

        // 5. Convertir en buffer pour la réponse
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
        console.error('Erreur génération PDF quittance:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la génération du PDF' },
            { status: 500 }
        );
    }
}
