import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/subscription/stripe';
import { getBaseUrl } from '@/lib/utils';
import { getUserTeamContext } from '@/lib/team-context';
import { getStripePriceId, SubscriptionTier, BillingCycle, Currency, PLANS } from '@/lib/subscription/plans-config';

export async function POST(req: Request) {
    try {
        const { planId, interval, currency } = await req.json();

        if (!planId || !interval || !currency) {
            return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
        }

        const validPlan = PLANS[planId as SubscriptionTier];
        if (!validPlan) {
            return NextResponse.json({ error: 'Plan invalide' }, { status: 400 });
        }

        const context = await getUserTeamContext();
        if (!context) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        const { teamId, team } = context;
        console.log('--- Checkout API Called ---');

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Non connecté' }, { status: 401 });
        }

        // Security Check: Anti-Double Subscription
        // Verify if the team already has an active subscription
        const { data: teamData, error: teamError } = await supabase
            .from('teams')
            .select('stripe_customer_id, stripe_subscription_id, subscription_tier, name, subscription_status')
            .eq('id', teamId)
            .single();

        if (teamError) throw teamError;

        // Block if already has a PAID active subscription (Prevent Double Sub)
        // Trial users CAN upgrade - this is standard SaaS behavior
        const BLOCKED_STATUSES = ['active', 'trialing', 'past_due', 'unpaid', 'incomplete'];
        if (teamData.subscription_status && BLOCKED_STATUSES.includes(teamData.subscription_status) && teamData.stripe_subscription_id) {
            return NextResponse.json({
                error: 'Vous avez déjà un abonnement actif. Gérez-le depuis votre espace abonnement.',
                redirect: '/gestion/abonnement'
            }, { status: 400 });
        }

        let stripeCustomerId = teamData.stripe_customer_id;

        // 1. Check for Currency Mismatch if customer exists
        if (stripeCustomerId) {
            try {
                const customer = await stripe.customers.retrieve(stripeCustomerId);
                // Check if customer is not deleted and has a currency set
                if (!customer.deleted && 'currency' in customer && customer.currency && customer.currency !== currency.toLowerCase()) {
                    console.log(`💱 Currency mismatch: Customer ${stripeCustomerId} is in ${customer.currency}, requested ${currency}. Creating new customer.`);
                    stripeCustomerId = null; // Force creation of new customer
                }
            } catch (err) {
                console.warn("⚠️ Could not retrieve Stripe customer:", err);
                // If we can't retrieve, maybe it's deleted? Safer to create new one if unsure, 
                // but let's assume it's fine unless we get an error later.
            }
        }

        // 2. Create Stripe Customer if missing or needed (due to currency swap)
        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                name: teamData.name || team.name, // Use team name for B2B usually, or User name
                metadata: {
                    team_id: teamId,
                    supabase_user_id: user.id
                },
            });
            stripeCustomerId = customer.id;

            await supabase
                .from('teams')
                .update({ stripe_customer_id: stripeCustomerId })
                .eq('id', teamId);
        }

        // 3. Resolve Price ID Server-Side (Secure)
        const priceId = getStripePriceId(
            planId as SubscriptionTier,
            interval as BillingCycle,
            currency as Currency
        );

        if (!priceId) {
            return NextResponse.json({ error: 'Configuration prix introuvable' }, { status: 500 });
        }

        // 4. Create Checkout Session
        const baseUrl = getBaseUrl();

        const session = await stripe.checkout.sessions.create({
            customer: stripeCustomerId,
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${baseUrl}/gestion/abonnement?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/gestion/abonnement?canceled=true`,
            metadata: {
                team_id: teamId,
                plan_id: planId,
                currency: currency,
                interval: interval
            },
            subscription_data: {
                metadata: {
                    team_id: teamId,
                    plan_id: planId,
                },
            },
            // Optional: Handle tax, address collection, etc. based on currency/region
            // payment_method_types: currency === 'xof' ? ['card'] : ['card', 'sepa_debit'], // Example
        });

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error('Stripe Checkout Error:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}
