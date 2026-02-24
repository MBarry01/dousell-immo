import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/subscription/stripe';
import { createClient } from '@supabase/supabase-js';
import type { SubscriptionStatus, SubscriptionTier } from '@/lib/subscription/plans-config';

const webhookSecret = process.env.STRIPE_SUBSCRIPTION_WEBHOOK_SECRET;

/**
 * Map Stripe subscription status to our DB-allowed statuses.
 * DB CHECK constraint: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete'
 */
function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
    const mapping: Partial<Record<Stripe.Subscription.Status, SubscriptionStatus>> = {
        active: 'active',
        trialing: 'trialing',
        past_due: 'past_due',
        canceled: 'canceled',
        unpaid: 'unpaid',
        incomplete: 'incomplete',
        incomplete_expired: 'canceled',
        paused: 'past_due',
    };
    return mapping[status] ?? 'past_due';
}

/**
 * Resolve subscription tier from metadata (preferred) or price ID (fallback).
 * Subscription metadata.plan_id is set during checkout (subscription_data.metadata).
 */
function resolveTier(
    metadata: Stripe.Metadata | null,
    priceId?: string
): SubscriptionTier | null {
    const planId = metadata?.plan_id;
    if (planId && ['starter', 'pro', 'enterprise'].includes(planId)) {
        return planId as SubscriptionTier;
    }

    if (!priceId) return null;

    // Fallback: price ID → tier via env vars
    const priceToTier: Array<[string | undefined, SubscriptionTier]> = [
        [process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY_XOF, 'starter'],
        [process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_ANNUAL_XOF, 'starter'],
        [process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY_EUR, 'starter'],
        [process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_ANNUAL_EUR, 'starter'],
        [process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY_XOF, 'pro'],
        [process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL_XOF, 'pro'],
        [process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY_EUR, 'pro'],
        [process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL_EUR, 'pro'],
        [process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_MONTHLY_XOF, 'enterprise'],
        [process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_ANNUAL_XOF, 'enterprise'],
        [process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_MONTHLY_EUR, 'enterprise'],
        [process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_ANNUAL_EUR, 'enterprise'],
    ];

    for (const [envPriceId, tier] of priceToTier) {
        if (envPriceId && envPriceId === priceId) return tier;
    }

    return null;
}

export async function POST(req: Request) {
    if (!webhookSecret) {
        console.error('[SubscriptionWebhook] Missing STRIPE_SUBSCRIPTION_WEBHOOK_SECRET');
        return NextResponse.json({ error: 'Config error' }, { status: 500 });
    }

    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    let event: Stripe.Event;
    try {
        if (!signature) throw new Error('No stripe-signature header');
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
        console.error('[SubscriptionWebhook] Signature verification failed:', err instanceof Error ? err.message : err);
        return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log(`[SubscriptionWebhook] Event: ${event.type} (${event.id})`);

    try {
        switch (event.type) {
            // ── Checkout completed (subscription mode only) ──────────────────
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                if (session.mode !== 'subscription') break;

                const teamId = session.metadata?.team_id;
                const subscriptionId = session.subscription as string;
                const customerId = session.customer as string;

                if (!teamId) {
                    console.error('[SubscriptionWebhook] Missing team_id in checkout session metadata');
                    break;
                }

                // Retrieve full subscription to get status + price + interval
                const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                const priceId = subscription.items.data[0]?.price.id;
                const tier = resolveTier(subscription.metadata, priceId)
                    ?? resolveTier(session.metadata)
                    ?? 'starter';

                // Resolve billing cycle: prefer session metadata, fallback to Stripe interval
                const metadataInterval = session.metadata?.interval;
                const stripeInterval = subscription.items.data[0]?.price.recurring?.interval;
                const billingCycle: 'monthly' | 'annual' =
                    metadataInterval === 'annual' || stripeInterval === 'year'
                        ? 'annual'
                        : 'monthly';

                // Si Stripe démarre un nouveau trial (renouvellement avec période d'essai),
                // on stocke la vraie date de fin. Sinon on efface l'ancienne.
                const newTrialEndsAt = subscription.trial_end
                    ? new Date(subscription.trial_end * 1000).toISOString()
                    : null;

                const updateData: Record<string, unknown> = {
                    stripe_customer_id: customerId,
                    stripe_subscription_id: subscriptionId,
                    subscription_status: mapStripeStatus(subscription.status),
                    subscription_tier: tier,
                    subscription_trial_ends_at: newTrialEndsAt,
                    billing_cycle: billingCycle,
                    subscription_started_at: new Date().toISOString(),
                };
                // Marquer le trial comme utilisé (immuable) dès qu'un trial démarre
                if (subscription.status === 'trialing') {
                    updateData.trial_used = true;
                }

                const { error } = await supabase
                    .from('teams')
                    .update(updateData)
                    .eq('id', teamId);

                if (error) {
                    console.error('[SubscriptionWebhook] DB update failed (checkout.session.completed):', error);
                } else {
                    console.log(`[SubscriptionWebhook] ✅ Subscription activated — team=${teamId} tier=${tier} cycle=${billingCycle} status=${subscription.status}`);
                }
                break;
            }

            // ── Subscription updated (plan change, renewal, cancellation scheduled) ─
            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = subscription.customer as string;
                const priceId = subscription.items.data[0]?.price.id;
                const tier = resolveTier(subscription.metadata, priceId);

                const updatePayload: Record<string, unknown> = {
                    stripe_subscription_id: subscription.id,
                    subscription_status: mapStripeStatus(subscription.status),
                    // Synchronise la date de fin d'essai si Stripe la met à jour
                    subscription_trial_ends_at: subscription.trial_end
                        ? new Date(subscription.trial_end * 1000).toISOString()
                        : null,
                };
                if (tier) updatePayload.subscription_tier = tier;

                // Find team by metadata.team_id first, fall back to stripe_customer_id
                const teamId = subscription.metadata?.team_id;
                const { error } = teamId
                    ? await supabase.from('teams').update(updatePayload).eq('id', teamId)
                    : await supabase.from('teams').update(updatePayload).eq('stripe_customer_id', customerId);

                if (error) {
                    console.error('[SubscriptionWebhook] DB update failed (subscription.updated):', error);
                } else {
                    console.log(`[SubscriptionWebhook] ✅ Subscription updated — status=${subscription.status} tier=${tier ?? 'unchanged'}`);
                }
                break;
            }

            // ── Subscription deleted (user canceled or payment lapsed) ────────
            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = subscription.customer as string;
                const teamId = subscription.metadata?.team_id;

                const { error } = teamId
                    ? await supabase.from('teams').update({ subscription_status: 'canceled' }).eq('id', teamId)
                    : await supabase.from('teams').update({ subscription_status: 'canceled' }).eq('stripe_customer_id', customerId);

                if (error) {
                    console.error('[SubscriptionWebhook] DB update failed (subscription.deleted):', error);
                } else {
                    console.log(`[SubscriptionWebhook] ✅ Subscription canceled — customer=${customerId}`);
                }
                break;
            }

            // ── Invoice payment failed ────────────────────────────────────────
            case 'invoice.payment_failed': {
                const invoice = event.data.object as Stripe.Invoice;
                const customerId = invoice.customer as string;

                const { error } = await supabase
                    .from('teams')
                    .update({ subscription_status: 'past_due' })
                    .eq('stripe_customer_id', customerId);

                if (error) {
                    console.error('[SubscriptionWebhook] DB update failed (invoice.payment_failed):', error);
                } else {
                    console.warn(`[SubscriptionWebhook] ⚠️ Payment failed — customer=${customerId} → past_due`);
                }
                break;
            }

            // ── Invoice payment succeeded (renewal) ───────────────────────────
            case 'invoice.payment_succeeded': {
                const invoice = event.data.object as Stripe.Invoice;
                // 'subscription_create' is handled by checkout.session.completed
                if (invoice.billing_reason === 'subscription_create') break;

                const customerId = invoice.customer as string;

                const { error } = await supabase
                    .from('teams')
                    .update({ subscription_status: 'active' })
                    .eq('stripe_customer_id', customerId);

                if (error) {
                    console.error('[SubscriptionWebhook] DB update failed (invoice.payment_succeeded):', error);
                } else {
                    console.log(`[SubscriptionWebhook] ✅ Renewal payment succeeded — customer=${customerId}`);
                }
                break;
            }

            default:
                // Event not handled — no action needed
                break;
        }
    } catch (err) {
        console.error('[SubscriptionWebhook] Unhandled processing error:', err);
        return NextResponse.json({ error: 'Processing error' }, { status: 500 });
    }

    return NextResponse.json({ received: true });
}
