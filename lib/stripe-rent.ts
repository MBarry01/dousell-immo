import Stripe from 'stripe';

// Initialize Stripe
const stripeKey = process.env.STRIPE_SECRET_KEY;

if (!stripeKey) {
    console.warn('⚠️ STRIPE_SECRET_KEY is not defined');
}

export const stripe = stripeKey ? new Stripe(stripeKey, {
    apiVersion: '2024-06-20' as any,
    typescript: true,
}) : null;

/**
 * Create a Stripe Checkout Session for rent payment
 */
export async function createRentCheckoutSession({
    leaseId,
    amount,
    periodMonth,
    periodYear,
    tenantName,
    tenantEmail,
    propertyAddress,
    successUrl,
    cancelUrl,
}: {
    leaseId: string;
    amount: number; // Amount in FCFA
    periodMonth: number;
    periodYear: number;
    tenantName: string;
    tenantEmail: string;
    propertyAddress?: string;
    successUrl: string;
    cancelUrl: string;
}) {
    if (!stripe) {
        throw new Error('Stripe is not configured');
    }

    // Convert FCFA to EUR (approximate rate: 1 EUR = 656 FCFA)
    // For production, use a proper exchange rate API
    const FCFA_TO_EUR_RATE = 656;
    const amountInEur = Math.round((amount / FCFA_TO_EUR_RATE) * 100); // Stripe expects cents

    const monthNames = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    const periodLabel = `${monthNames[periodMonth - 1]} ${periodYear}`;

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        customer_email: tenantEmail,
        line_items: [
            {
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: `Loyer ${periodLabel}`,
                        description: propertyAddress
                            ? `Paiement loyer - ${propertyAddress}`
                            : `Paiement du loyer pour ${periodLabel}`,
                        metadata: {
                            lease_id: leaseId,
                            period_month: periodMonth.toString(),
                            period_year: periodYear.toString(),
                        },
                    },
                    unit_amount: amountInEur,
                },
                quantity: 1,
            },
        ],
        metadata: {
            type: 'rent_payment',
            lease_id: leaseId,
            period_month: periodMonth.toString(),
            period_year: periodYear.toString(),
            amount_fcfa: amount.toString(),
            tenant_name: tenantName,
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
        locale: 'fr',
    });

    return {
        sessionId: session.id,
        url: session.url,
    };
}

/**
 * Verify and process a completed Stripe payment
 */
export async function processStripeRentPayment(sessionId: string) {
    if (!stripe) {
        throw new Error('Stripe is not configured');
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['payment_intent', 'payment_intent.latest_charge'],
    });

    if (session.payment_status !== 'paid') {
        throw new Error('Payment not completed');
    }

    const metadata = session.metadata;
    if (!metadata || metadata.type !== 'rent_payment') {
        throw new Error('Invalid payment metadata');
    }

    // Extract card details from charge for traceability
    const paymentIntent = typeof session.payment_intent === 'string'
        ? null
        : session.payment_intent;
    const charge = paymentIntent?.latest_charge as Stripe.Charge | undefined;
    const cardDetails = charge?.payment_method_details?.card;

    const amountEurCents = session.amount_total || 0;
    const amountFcfa = parseInt(metadata.amount_fcfa);

    return {
        leaseId: metadata.lease_id,
        periodMonth: parseInt(metadata.period_month),
        periodYear: parseInt(metadata.period_year),
        amountFcfa,
        tenantName: metadata.tenant_name,
        paymentIntentId: paymentIntent?.id || (typeof session.payment_intent === 'string' ? session.payment_intent : undefined),
        // Rich traceability metadata
        traceMeta: {
            provider: 'stripe',
            stripe_session_id: sessionId,
            stripe_payment_intent_id: paymentIntent?.id || null,
            amount_eur_cents: amountEurCents,
            amount_eur: amountEurCents / 100,
            amount_fcfa: amountFcfa,
            exchange_rate: amountFcfa > 0 && amountEurCents > 0
                ? Math.round(amountFcfa / (amountEurCents / 100))
                : 656,
            card_brand: cardDetails?.brand || null,
            card_last4: cardDetails?.last4 || null,
            card_exp_month: cardDetails?.exp_month || null,
            card_exp_year: cardDetails?.exp_year || null,
            currency: 'eur',
            paid_at: new Date().toISOString(),
        },
    };
}

/**
 * Handle Stripe webhook event for rent payments
 */
export async function handleRentWebhookEvent(event: Stripe.Event) {
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session;

            // Only process rent payments
            if (session.metadata?.type !== 'rent_payment') {
                return { processed: false, reason: 'Not a rent payment' };
            }

            const paymentData = {
                leaseId: session.metadata.lease_id,
                periodMonth: parseInt(session.metadata.period_month),
                periodYear: parseInt(session.metadata.period_year),
                amountFcfa: parseInt(session.metadata.amount_fcfa),
                tenantName: session.metadata.tenant_name,
                stripeSessionId: session.id,
                stripePaymentIntentId: typeof session.payment_intent === 'string'
                    ? session.payment_intent
                    : null,
            };

            return {
                processed: true,
                data: paymentData,
            };
        }

        case 'payment_intent.payment_failed': {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            console.error('Payment failed:', paymentIntent.id, paymentIntent.last_payment_error?.message);
            return { processed: false, reason: 'Payment failed' };
        }

        default:
            return { processed: false, reason: `Unhandled event type: ${event.type}` };
    }
}
