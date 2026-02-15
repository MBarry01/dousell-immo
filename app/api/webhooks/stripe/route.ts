
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe, handleRentWebhookEvent } from '@/lib/stripe-rent';
import { createClient } from '@supabase/supabase-js';
import ReactPDF from '@react-pdf/renderer';
import { createQuittanceDocument } from '@/components/pdf/QuittancePDF_v2';
import { storeDocumentInGED } from '@/lib/ged-utils';
import { sendOneSignalNotification } from '@/lib/onesignal';

export async function POST(req: Request) {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
        console.error('Missing STRIPE_WEBHOOK_SECRET');
        return NextResponse.json({ error: 'Config error' }, { status: 500 });
    }

    let event;

    try {
        if (!signature || !stripe) throw new Error('No signature or Stripe config');
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
        console.error(`Webhook signature verification failed: ${err instanceof Error ? err.message : 'Unknown'}`);
        return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
    }

    // Process event
    if (event.type === 'checkout.session.completed') {
        const result = await handleRentWebhookEvent(event);

        if (result.processed && result.data) {
            const paymentData = result.data;
            console.log('💰 Payment received for lease:', paymentData.leaseId);

            // Init Supabase Admin
            const supabaseAdmin = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            );

            try {
                // 1. Fetch Lease & Property Info
                const { data: lease, error: leaseError } = await supabaseAdmin
                    .from('leases')
                    .select(`
                        *,
                        properties (address),
                        profiles:owner_id (
                            first_name, last_name, email, 
                            company_name, company_address, company_ninea,
                            phone_number
                        )
                    `)
                    .eq('id', paymentData.leaseId)
                    .single();

                if (leaseError || !lease) {
                    console.error('Lease not found for payment:', paymentData.leaseId);
                    return NextResponse.json({ error: 'Lease not found' }, { status: 404 });
                }

                // 2. Create or Update Transaction
                // Check if transaction exists
                const { data: existingTx } = await supabaseAdmin
                    .from('rental_transactions')
                    .select('id')
                    .eq('lease_id', paymentData.leaseId)
                    .eq('period_month', paymentData.periodMonth)
                    .eq('period_year', paymentData.periodYear)
                    .single();

                let transactionId = existingTx?.id;

                const transactionData = {
                    lease_id: paymentData.leaseId,
                    period_month: paymentData.periodMonth,
                    period_year: paymentData.periodYear,
                    amount_due: paymentData.amountFcfa,
                    // amount_paid: paymentData.amountFcfa, // If column exists
                    status: 'paid',
                    paid_at: new Date().toISOString(),
                    tenant_id: lease.tenant_id, // If available
                    period_start: new Date(paymentData.periodYear, paymentData.periodMonth - 1, 1).toISOString(),
                    period_end: new Date(paymentData.periodYear, paymentData.periodMonth, 0).toISOString(),
                    // payment_method: 'stripe' // If column exists
                };

                if (existingTx) {
                    await supabaseAdmin
                        .from('rental_transactions')
                        .update(transactionData)
                        .eq('id', existingTx.id);
                    console.log('Updated existing transaction:', existingTx.id);
                } else {
                    const { data: newTx, error: createError } = await supabaseAdmin
                        .from('rental_transactions')
                        .insert(transactionData)
                        .select()
                        .single();

                    if (createError) throw createError;
                    transactionId = newTx.id;
                    console.log('Created new transaction:', transactionId);
                }

                // 3. Generate Receipt PDF
                const ownerProfile = lease.profiles;
                const receiptData = {
                    leaseId: lease.id,
                    tenantName: lease.tenant_name,
                    tenantEmail: lease.tenant_email,
                    tenantPhone: lease.tenant_phone,
                    tenantAddress: lease.property_address || lease.properties?.address,

                    amount: paymentData.amountFcfa,
                    periodMonth: `${String(paymentData.periodMonth).padStart(2, '0')}/${paymentData.periodYear}`,
                    periodStart: new Date(paymentData.periodYear, paymentData.periodMonth - 1, 1).toLocaleDateString('fr-FR'),
                    periodEnd: new Date(paymentData.periodYear, paymentData.periodMonth, 0).toLocaleDateString('fr-FR'),
                    receiptNumber: `QUITT-${Date.now().toString().slice(-6)}`,

                    ownerName: ownerProfile?.company_name || `${ownerProfile?.first_name} ${ownerProfile?.last_name}`,
                    ownerAddress: ownerProfile?.company_address,
                    ownerNinea: ownerProfile?.company_ninea,
                    ownerEmail: ownerProfile?.email,

                    propertyAddress: lease.property_address || lease.properties?.address
                };

                const pdfDocument = createQuittanceDocument(receiptData);
                const stream = await ReactPDF.renderToStream(pdfDocument);
                const chunks: Uint8Array[] = [];
                const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
                    stream.on('data', (chunk) => chunks.push(chunk));
                    stream.on('end', () => resolve(Buffer.concat(chunks)));
                    stream.on('error', reject);
                });

                // 4. Store in GED
                await storeDocumentInGED({
                    userId: lease.owner_id,
                    fileBuffer: new Uint8Array(pdfBuffer),
                    fileName: `Quittance_${receiptData.receiptNumber}_${paymentData.tenantName.replace(/\s+/g, '_')}.pdf`,
                    bucketName: 'receipts',
                    documentType: 'quittance',
                    metadata: {
                        leaseId: lease.id,
                        transactionId: transactionId,
                        tenantName: lease.tenant_name,
                        description: `Quittance - ${receiptData.periodMonth} - ${lease.tenant_name}`
                    }
                }, supabaseAdmin);

                console.log('✅ Receipt generated and stored in GED');

                // Notify Owner
                await sendOneSignalNotification({
                    userIds: [lease.owner_id],
                    title: "Loyer reçu ! 💰",
                    content: `Paiement de ${paymentData.amountFcfa.toLocaleString()} FCFA reçu de ${lease.tenant_name}.`,
                    url: `/gestion/locations/${lease.id}`,
                });

                // Notify Tenant (target by Lease ID)
                await sendOneSignalNotification({
                    userIds: [lease.id],
                    title: "Paiement confirmé ✅",
                    content: "Votre quittance de loyer est disponible.",
                    url: "/locataire/documents",
                });

            } catch (err) {
                console.error('Error processing payment:', err);
                return NextResponse.json({ error: 'Processing Failed' }, { status: 500 });
            }
        }
    }

    return NextResponse.json({ received: true });
}
