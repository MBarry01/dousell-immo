
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

        const fileName = `${lease.owner_id}/quittances/${data.receiptNumber}_${Date.now()}.pdf`;

        // Upload Storage
        const { error: uploadError } = await supabaseAdmin.storage
            .from('verification-docs')
            .upload(fileName, pdfBuffer, {
                contentType: 'application/pdf',
                upsert: false
            });

        if (uploadError) {
            throw new Error(`Upload Storage failed: ${uploadError.message}`);
        }

        // Insert user_documents
        const { error: dbError } = await supabaseAdmin.from('user_documents').insert({
            user_id: lease.owner_id,
            file_name: `Quittance_${data.receiptNumber}.pdf`,
            file_path: fileName,
            file_type: 'quittance',
            file_size: pdfBuffer.length,
            mime_type: 'application/pdf',
            source: 'generated',
            lease_id: data.leaseId,
            category: 'quittance',
            description: `Quittance - ${data.periodMonth} - ${data.tenantName}`
        });

        if (dbError) {
            throw new Error(`Database insert failed: ${dbError.message}`);
        }

        return NextResponse.json({
            success: true,
            message: 'Quittance sauvegardée avec succès',
            fileName
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
