
import { NextRequest, NextResponse } from 'next/server';
import ReactPDF from '@react-pdf/renderer';
import { createQuittanceDocument } from '@/components/pdf/QuittancePDF_v2';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
    try {
        const data = await request.json();

        console.log('💾 Sauvegarde de la quittance pour:', data.tenantName);

        // Validation
        if (!data.leaseId) {
            return NextResponse.json(
                { success: false, error: 'ID du bail manquant pour la sauvegarde' },
                { status: 400 }
            );
        }

        // Générer le PDF
        const pdfDocument = createQuittanceDocument(data);
        const stream = await ReactPDF.renderToStream(pdfDocument);
        const chunks: Uint8Array[] = [];
        const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
            stream.on('data', (chunk) => chunks.push(chunk));
            stream.on('end', () => resolve(Buffer.concat(chunks)));
            stream.on('error', reject);
        });

        // Sauvegarder dans Supabase
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Récupérer owner_id
        const { data: lease } = await supabaseAdmin
            .from('leases')
            .select('owner_id')
            .eq('id', data.leaseId)
            .single();

        if (!lease?.owner_id) {
            return NextResponse.json({ success: false, error: 'Propriétaire introuvable' }, { status: 404 });
        }

        // Utiliser l'utilitaire centralisé pour le stockage
         
        const { storeDocumentInGED } = require('@/lib/ged-utils');

        const result = await storeDocumentInGED({
            userId: lease.owner_id,
            fileBuffer: new Uint8Array(pdfBuffer),
            fileName: `Quittance_${data.receiptNumber.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`,
            bucketName: 'receipts', // On utilise le bucket dédié
            documentType: 'quittance',
            metadata: {
                leaseId: data.leaseId,
                tenantName: data.tenantName,
                description: `Quittance - ${data.periodMonth} - ${data.tenantName}`
            }
        });

        if (!result.success) {
            throw new Error(result.error);
        }

        return NextResponse.json({
            success: true,
            message: 'Quittance sauvegardée avec succès',
            fileName: result.filePath
        });

    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Erreur inconnue',
            },
            { status: 500 }
        );
    }
}
