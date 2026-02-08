import { redirect } from 'next/navigation';
import { CheckCircle2, ArrowLeft, Receipt } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { processStripeRentPayment } from '@/lib/stripe-rent';
import { createAdminClient } from '@/utils/supabase/admin';
import { invalidateCacheBatch } from '@/lib/cache/cache-aside';

// Force dynamic rendering - must process payment and write to DB
export const dynamic = 'force-dynamic';

interface PageProps {
    searchParams: Promise<{ session_id?: string }>;
}

/**
 * Save rent payment to database (fallback when webhook doesn't work)
 * This is idempotent - won't create duplicates if webhook already processed it
 *
 * Also fetches team_id/owner_id from lease to ensure /gestion dashboard visibility
 * and invalidates Redis cache so changes appear immediately.
 */
async function saveRentPaymentFallback(paymentDetails: {
    leaseId: string;
    periodMonth: number;
    periodYear: number;
    amountFcfa: number;
    paymentIntentId?: string;
    traceMeta?: Record<string, unknown>;
}, sessionId: string) {
    const adminClient = createAdminClient();

    // Get team_id and owner_id from lease (required for /gestion dashboard visibility)
    const { data: lease } = await adminClient
        .from('leases')
        .select('team_id, owner_id')
        .eq('id', paymentDetails.leaseId)
        .single();

    const teamId = lease?.team_id || null;
    const ownerId = lease?.owner_id || null;

    // Check if transaction already exists for this period (webhook may have already processed it)
    const { data: existingTx } = await adminClient
        .from('rental_transactions')
        .select('id')
        .eq('lease_id', paymentDetails.leaseId)
        .eq('period_month', paymentDetails.periodMonth)
        .eq('period_year', paymentDetails.periodYear)
        .eq('status', 'paid')
        .single();

    if (existingTx) {
        console.log(`✅ Payment already recorded (webhook processed): ${paymentDetails.leaseId}`);

        // Ensure team_id/owner_id are set (may be missing if webhook created it)
        if (teamId || ownerId) {
            await adminClient
                .from('rental_transactions')
                .update({ team_id: teamId, owner_id: ownerId })
                .eq('id', existingTx.id)
                .is('team_id', null);

            await invalidateRentalRedisCache(teamId || ownerId, paymentDetails.leaseId);
        }
        return { alreadyProcessed: true };
    }

    // Check if there's a pending transaction to update
    const { data: pendingTx } = await adminClient
        .from('rental_transactions')
        .select('id')
        .eq('lease_id', paymentDetails.leaseId)
        .eq('period_month', paymentDetails.periodMonth)
        .eq('period_year', paymentDetails.periodYear)
        .neq('status', 'paid')
        .single();

    const meta = paymentDetails.traceMeta || {
        provider: 'stripe',
        stripe_session_id: sessionId,
        paid_at: new Date().toISOString(),
    };

    if (pendingTx) {
        // Update existing pending transaction (include team_id/owner_id for /gestion visibility)
        const { error: updateError } = await adminClient
            .from('rental_transactions')
            .update({
                status: 'paid',
                paid_at: new Date().toISOString(),
                amount_paid: paymentDetails.amountFcfa,
                payment_method: 'stripe',
                payment_ref: sessionId,
                team_id: teamId,
                owner_id: ownerId,
                meta,
            })
            .eq('id', pendingTx.id);

        if (updateError) {
            console.error(`❌ Failed to update payment: ${updateError.message}`, updateError);
            throw new Error(`Failed to update payment: ${updateError.message}`);
        }

        console.log(`✅ Rent payment updated (fallback): ${paymentDetails.leaseId} [team=${teamId}]`);
    } else {
        // Create new transaction record with team_id for /gestion visibility
        const { data: insertedTx, error: insertError } = await adminClient
            .from('rental_transactions')
            .insert({
                lease_id: paymentDetails.leaseId,
                period_month: paymentDetails.periodMonth,
                period_year: paymentDetails.periodYear,
                amount_due: paymentDetails.amountFcfa,
                amount_paid: paymentDetails.amountFcfa,
                status: 'paid',
                paid_at: new Date().toISOString(),
                payment_method: 'stripe',
                payment_ref: sessionId,
                team_id: teamId,
                owner_id: ownerId,
                meta,
            })
            .select('id')
            .single();

        if (insertError) {
            console.error(`❌ Failed to insert payment: ${insertError.message}`, insertError);
            throw new Error(`Failed to insert payment: ${insertError.message}`);
        }

        console.log(`✅ Rent payment created (fallback): ${paymentDetails.leaseId} [team=${teamId}] id=${insertedTx?.id}`);
    }

    // Log for audit trail
    await adminClient
        .from('tenant_access_logs')
        .insert({
            lease_id: paymentDetails.leaseId,
            action: 'payment_completed',
            details: {
                amount: paymentDetails.amountFcfa,
                period: `${paymentDetails.periodMonth}/${paymentDetails.periodYear}`,
                method: 'stripe',
                stripe_session_id: sessionId,
                source: 'success_page_fallback',
            },
        });

    // Invalidate Redis cache (no revalidatePath - not allowed during render)
    if (ownerId || teamId) {
        await invalidateRentalRedisCache(teamId || ownerId, paymentDetails.leaseId);
    }

    return { alreadyProcessed: false };
}

/**
 * Send quittance (rent receipt) email after successful Stripe payment.
 * Reuses the same /api/send-receipt endpoint as the /gestion "encaisser" flow.
 */
async function sendQuittanceEmail(paymentDetails: {
    leaseId: string;
    periodMonth: number;
    periodYear: number;
    amountFcfa: number;
}) {
    const adminClient = createAdminClient();

    // Fetch lease details (tenant info + property address)
    const { data: lease } = await adminClient
        .from('leases')
        .select('tenant_name, tenant_email, property_address, owner_id')
        .eq('id', paymentDetails.leaseId)
        .single();

    if (!lease?.tenant_email) {
        console.log('[sendQuittance] No tenant email found, skipping quittance');
        return;
    }

    // Fetch owner/agency profile for quittance branding
    let profile = null;
    if (lease.owner_id) {
        const { data } = await adminClient
            .from('profiles')
            .select('company_name, company_address, company_email, company_ninea, signature_url, logo_url, full_name, email')
            .eq('id', lease.owner_id)
            .maybeSingle();
        profile = data;
    }

    // Build receipt data (same format as confirmPayment in gestion/actions.ts)
    // Handle guarantee (period_month = 0) vs regular rent
    const isGuarantee = paymentDetails.periodMonth === 0;
    const periodMonthLabel = isGuarantee
        ? 'Garantie'
        : new Date(paymentDetails.periodYear, paymentDetails.periodMonth - 1)
            .toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    const lastDay = isGuarantee
        ? new Date().getDate()
        : new Date(paymentDetails.periodYear, paymentDetails.periodMonth, 0).getDate();

    const receiptData = {
        tenantName: lease.tenant_name || 'Locataire',
        tenantEmail: lease.tenant_email,
        tenantAddress: lease.property_address || '',
        amount: paymentDetails.amountFcfa,
        periodMonth: periodMonthLabel,
        periodStart: isGuarantee
            ? new Date().toLocaleDateString('fr-FR')
            : `01/${String(paymentDetails.periodMonth).padStart(2, '0')}/${paymentDetails.periodYear}`,
        periodEnd: isGuarantee
            ? new Date().toLocaleDateString('fr-FR')
            : `${lastDay}/${String(paymentDetails.periodMonth).padStart(2, '0')}/${paymentDetails.periodYear}`,
        receiptNumber: isGuarantee
            ? `GARA-${Date.now().toString().slice(-8)}`
            : `QUITT-${Date.now().toString().slice(-8)}`,
        leaseId: paymentDetails.leaseId,
        ownerName: profile?.company_name || profile?.full_name || 'Propriétaire',
        ownerAddress: profile?.company_address || '',
        ownerNinea: profile?.company_ninea || '',
        ownerLogo: profile?.logo_url || undefined,
        ownerSignature: profile?.signature_url || undefined,
        ownerEmail: profile?.company_email || undefined,
        ownerAccountEmail: profile?.email || undefined,
        propertyAddress: lease.property_address || 'Adresse non renseignée',
        isGuarantee: isGuarantee,
    };

    // Call the same /api/send-receipt endpoint used by /gestion
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://doussell-immo.com';
    const response = await fetch(`${baseUrl}/api/send-receipt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(receiptData),
    });

    if (response.ok) {
        console.log(`[sendQuittance] Quittance sent to ${lease.tenant_email} for ${periodMonthLabel}`);
    } else {
        console.error('[sendQuittance] API error:', await response.text());
    }
}

/**
 * Invalidate Redis rental caches only (without revalidatePath).
 * revalidatePath cannot be called during page render in Next.js 16.
 */
async function invalidateRentalRedisCache(teamOrOwnerId: string, leaseId?: string) {
    const keys = [
        `rental_transactions:team:${teamOrOwnerId}`,
        `rental_stats:${teamOrOwnerId}`,
        `late_payments:${teamOrOwnerId}`,
        `advanced_stats:${teamOrOwnerId}`,
        `revenue_history:${teamOrOwnerId}:12`,
        `owner_profile:${teamOrOwnerId}`,
    ];

    if (leaseId) {
        keys.push(
            `rental_transactions:${leaseId}`,
            `lease_detail:${leaseId}`,
        );
    }

    await invalidateCacheBatch(keys, 'rentals');
    console.log(`🗑️ Rental caches invalidated for team/owner: ${teamOrOwnerId}`);
}

export default async function PaymentSuccessPage({ searchParams }: PageProps) {
    const { session_id } = await searchParams;

    if (!session_id) {
        redirect('/locataire');
    }

    let paymentDetails = null;
    let error = null;
    let quittanceSent = false;

    try {
        paymentDetails = await processStripeRentPayment(session_id);

        // Save to database as fallback (idempotent - won't duplicate if webhook worked)
        if (paymentDetails) {
            await saveRentPaymentFallback(paymentDetails, session_id);

            // Always send quittance email after Stripe payment
            // (webhooks and manual flows don't send quittances for Stripe payments)
            try {
                await sendQuittanceEmail(paymentDetails);
                quittanceSent = true;
            } catch (emailErr) {
                console.error('[sendQuittance] Failed (non-blocking):', emailErr);
            }
        }
    } catch (e) {
        console.error('Error verifying payment:', e);
        error = e instanceof Error ? e.message : 'Erreur de vérification';
    }

    const MONTH_NAMES = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    const formatPeriod = (month: number, year: number) => {
        return `${MONTH_NAMES[(month || 1) - 1]} ${year}`;
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR').format(amount);
    };

    return (
        <div className="w-full max-w-lg mx-auto px-4 py-12">
            <div className="text-center mb-8">
                {/* Success Animation */}
                <div className="relative inline-flex">
                    <div className="absolute inset-0 bg-emerald-400/20 rounded-full animate-ping" />
                    <div className="relative w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-10 h-10 text-white" />
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-zinc-900 mt-6">
                    Paiement confirmé !
                </h1>
                <p className="text-zinc-500 mt-2">
                    Votre paiement a été traité avec succès
                </p>
            </div>

            {/* Payment Details Card */}
            {paymentDetails && (
                <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-6">
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-zinc-100">
                        <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                            <Receipt className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-zinc-900">Récapitulatif</p>
                            <p className="text-xs text-zinc-500">Transaction confirmée</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-zinc-500">Période</span>
                            <span className="font-medium text-zinc-900">
                                {formatPeriod(paymentDetails.periodMonth, paymentDetails.periodYear)}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-zinc-500">Montant</span>
                            <span className="font-semibold text-zinc-900">
                                {formatCurrency(paymentDetails.amountFcfa)} FCFA
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-zinc-500">Méthode</span>
                            <span className="text-zinc-900">Carte bancaire (Stripe)</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-zinc-500">Statut</span>
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                                <CheckCircle2 className="w-4 h-4" />
                                Payé
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                    <p className="text-amber-800 text-sm">
                        <strong>Note :</strong> Votre paiement a été reçu. Si vous ne voyez pas
                        immédiatement la mise à jour, veuillez patienter quelques minutes.
                    </p>
                </div>
            )}

            {/* Info Card */}
            <div className="bg-zinc-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-zinc-600">
                    {quittanceSent
                        ? <>Votre quittance de loyer a été envoyée par <strong>email</strong>. Elle est également disponible dans la section <strong>Documents</strong>.</>
                        : <>Une quittance de loyer sera générée et disponible dans la section <strong>Documents</strong> sous 24h.</>
                    }
                </p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
                <Link href="/locataire" className="block">
                    <Button className="w-full h-12 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded-xl">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Retour à l'accueil
                    </Button>
                </Link>

                <Link href="/locataire/paiements" className="block">
                    <Button variant="outline" className="w-full h-12 rounded-xl">
                        Voir l'historique des paiements
                    </Button>
                </Link>
            </div>
        </div>
    );
}
