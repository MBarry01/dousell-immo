
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { storeDocumentInGED } from '@/lib/ged-utils';
import { generateLeasePDF } from '@/lib/pdf-generator';
import _ReactPDF, { renderToStream } from '@react-pdf/renderer';
import { createQuittanceDocument } from '@/components/pdf/QuittancePDF_v2';

export async function POST(req: Request) {
    // 1. Security Check — secret dédié, distinct du service role key
    const adminSecret = process.env.ADMIN_CATCH_UP_SECRET;
    if (!adminSecret) {
        console.error('[catch-up-ged] ADMIN_CATCH_UP_SECRET manquant');
        return NextResponse.json({ error: 'Config error' }, { status: 500 });
    }
    const secret = req.headers.get('x-admin-secret');
    if (secret !== adminSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const report = {
        leasesProcessed: 0,
        leasesGenerated: 0,
        receiptsProcessed: 0,
        receiptsGenerated: 0,
        errors: [] as string[]
    };

    try {
        // ==========================================
        // 2. CATCH-UP LEASES
        // ==========================================
        const { data: leases, error: leaseError } = await supabaseAdmin
            .from('leases')
            .select(`
                *,
                properties (location, title),
                profiles:owner_id (
                    full_name, email, 
                    company_name, company_address, company_ninea
                )
            `)
            .eq('status', 'active');

        if (leaseError) throw leaseError;

        for (const lease of (leases || [])) {
            report.leasesProcessed++;

            // Check if document exists
            const { data: existingDoc } = await supabaseAdmin
                .from('user_documents')
                .select('id')
                .eq('lease_id', lease.id)
                .or('file_type.eq.bail,category.eq.bail')
                .limit(1)
                .maybeSingle();

            if (existingDoc) {
                console.log(`Lease ${lease.id} already has doc ${existingDoc.id}`);
            } else {
                console.log(`Lease ${lease.id} NO DOC FOUND. Generating...`);
                try {
                    const ownerProfile = lease.profiles;
                    const propertyAddress = lease.property_address ||
                        (lease.properties?.location as any)?.address ||
                        lease.properties?.title ||
                        'Adresse non renseignée';

                    // Prepare Data
                    const ownerNameParts = (ownerProfile?.full_name || '').split(' ');
                    const firstName = ownerNameParts[0] || 'Propriétaire';
                    const lastName = ownerNameParts.slice(1).join(' ') || '';

                    const contractData = {
                        landlord: {
                            firstName: firstName,
                            lastName: lastName,
                            address: ownerProfile?.company_address || 'Adresse non renseignée',
                            phone: '', // Phone number column does not exist on profiles
                            email: ownerProfile?.email,
                            companyName: ownerProfile?.company_name,
                            ninea: ownerProfile?.company_ninea
                        },
                        tenant: {
                            firstName: lease.tenant_name?.split(' ')[0] || '',
                            lastName: lease.tenant_name?.split(' ').slice(1).join(' ') || '',
                            phone: lease.tenant_phone || '',
                            email: lease.tenant_email,
                            nationalId: '',
                            address: propertyAddress
                        },
                        property: {
                            address: propertyAddress,
                            description: propertyAddress || 'Bien immobilier',
                            propertyType: 'appartement' as any
                        },
                        lease: {
                            monthlyRent: Number(lease.monthly_amount),
                            securityDeposit: Number(lease.monthly_amount) * 2, // Assumption
                            depositMonths: 2,
                            startDate: new Date(lease.start_date),
                            duration: Number(lease.duration) || 12,
                            billingDay: Number(lease.billing_day) || 5,
                        },
                        signatures: {
                            signatureCity: 'Dakar',
                            signatureDate: new Date(lease.created_at)
                        }
                    };

                    const pdfResult = await generateLeasePDF(contractData);

                    if (pdfResult.success && pdfResult.pdfBytes) {
                        await storeDocumentInGED({
                            userId: lease.owner_id,
                            fileBuffer: pdfResult.pdfBytes,
                            fileName: `Bail - ${lease.tenant_name} - ${new Date().getFullYear()} (Rattrapage).pdf`,
                            bucketName: 'lease-contracts',
                            documentType: 'bail',
                            metadata: {
                                leaseId: lease.id,
                                propertyId: lease.property_id,
                                tenantName: lease.tenant_name,
                                description: `Contrat de bail pour ${lease.tenant_name}`
                            }
                        }, supabaseAdmin);
                        report.leasesGenerated++;
                    }
                } catch (err: any) {
                    report.errors.push(`Lease ${lease.id}: ${err.message}`);
                }
            }
        }

        // ==========================================
        // 3. CATCH-UP RECEIPTS
        // ==========================================
        const { data: transactions, error: txError } = await supabaseAdmin
            .from('rental_transactions')
            .select(`
                *,
                leases (
                    tenant_name, tenant_email, tenant_phone, property_address,
                    owner_id,
                    properties (location, title),
                    profiles:owner_id (
                        full_name, email, 
                        company_name, company_address, company_ninea,
                        logo_url, signature_url
                    )
                )
            `)
            .eq('status', 'paid');

        if (txError) throw txError;

        for (const tx of (transactions || [])) {
            report.receiptsProcessed++;

            // Check if receipt exists linked to this transaction
            // Note: user_documents schema might rely on metadata in JSON column OR explicit column
            // My implementation of `storeDocumentInGED` puts transactionId in metadata JSON.
            // But querying JSON metadata is slow/complex.
            // BUT, I can check by Description or Filename pattern?
            // Or better, check by `lease_id` and `file_name` containing period?

            // Wait, the new `user_documents` schema has `entity_id` and `entity_type`.
            // I should rely on that if I populated it.
            // But existing docs might not have `entity_type` set if created before migration?
            // If I created them via `storeDocumentInGED` in this session, they have it.
            // Older ones won't exist at all in `user_documents` if they were just emailed.
            // So checking if ANY receipt exists for this transaction ID is valid.

            const { data: existingReceipt } = await supabaseAdmin
                .from('user_documents')
                .select('id')
                .eq('entity_id', tx.id)
                .eq('entity_type', 'payment')
                .limit(1)
                .maybeSingle();

            if (!existingReceipt) {
                try {
                    const lease = tx.leases;
                    if (!lease) continue;
                    const ownerProfile = lease.profiles;

                    const propertyAddress = lease.property_address ||
                        (lease.properties?.location as any)?.address ||
                        lease.properties?.title ||
                        'Adresse non renseignée';

                    const receiptData = {
                        leaseId: tx.lease_id,
                        tenantName: lease.tenant_name,
                        tenantEmail: lease.tenant_email,
                        tenantPhone: lease.tenant_phone,
                        tenantAddress: propertyAddress,

                        amount: tx.amount_due,
                        periodMonth: `${String(tx.period_month).padStart(2, '0')}/${tx.period_year}`,
                        periodStart: new Date(tx.period_year, tx.period_month - 1, 1).toLocaleDateString('fr-FR'),
                        periodEnd: new Date(tx.period_year, tx.period_month, 0).toLocaleDateString('fr-FR'),
                        receiptNumber: `QUITT-${tx.id.slice(0, 8)}`,

                        ownerName: ownerProfile?.company_name || ownerProfile?.full_name,
                        ownerAddress: ownerProfile?.company_address,
                        ownerNinea: ownerProfile?.company_ninea,
                        ownerEmail: ownerProfile?.email,
                        ownerLogo: ownerProfile?.logo_url,
                        ownerSignature: ownerProfile?.signature_url,

                        propertyAddress: propertyAddress
                    };

                    const pdfDocument = createQuittanceDocument(receiptData);
                    const stream = await renderToStream(pdfDocument);
                    const chunks: Uint8Array[] = [];
                    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
                        stream.on('data', (chunk) => chunks.push(chunk));
                        stream.on('end', () => resolve(Buffer.concat(chunks)));
                        stream.on('error', reject);
                    });

                    await storeDocumentInGED({
                        userId: lease.owner_id,
                        fileBuffer: new Uint8Array(pdfBuffer),
                        fileName: `Quittance_${receiptData.periodMonth.replace('/', '-')}_${lease.tenant_name.replace(/\s+/g, '_')} (Rattrapage).pdf`,
                        bucketName: 'receipts',
                        documentType: 'quittance',
                        metadata: {
                            leaseId: tx.lease_id,
                            transactionId: tx.id,
                            tenantName: lease.tenant_name,
                            description: `Quittance - ${receiptData.periodMonth} - ${lease.tenant_name}`
                        }
                    }, supabaseAdmin);
                    report.receiptsGenerated++;

                } catch (err: any) {
                    report.errors.push(`Receipt Tx ${tx.id}: ${err.message}`);
                }
            }
        }

    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Unknown error', report }, { status: 500 });
    }

    return NextResponse.json({ success: true, report });
}
