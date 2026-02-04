import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/subscription/stripe';
import { createClient } from '@/utils/supabase/server';
import Stripe from 'stripe';

export async function POST(req: Request) {
    const body = await req.text();
    const signature = (await headers()).get('Stripe-Signature') as string;

    let event: Stripe.Event;

    try {
        if (!process.env.STRIPE_WEBHOOK_SECRET) {
            throw new Error('STRIPE_WEBHOOK_SECRET is not defined');
        }
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err: any) {
        console.error(`Webhook Signature Error: ${err.message}`);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    const supabase = await createClient(); // WARNING: Webhooks might need service role if RLS is tight

    // Use admin client to bypass RLS for background updates
    const { createAdminClient } = await import('@/utils/supabase/admin');
    const adminClient = createAdminClient();

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const teamId = session.metadata?.team_id;
                const planId = session.metadata?.plan_id;
                const subscriptionId = session.subscription as string;

                if (teamId && planId) {
                    await adminClient
                        .from('teams')
                        .update({
                            subscription_tier: planId,
                            subscription_status: 'active',
                            stripe_subscription_id: subscriptionId,
                            subscription_trial_ends_at: null, // End trial on paid sub
                        })
                        .eq('id', teamId);

                    console.log(`✅ Subscription activated for team ${teamId}`);
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                const teamId = subscription.metadata?.team_id;

                if (teamId) {
                    await adminClient
                        .from('teams')
                        .update({
                            subscription_status: 'canceled',
                        })
                        .eq('id', teamId);

                    console.log(`❌ Subscription canceled for team ${teamId}`);
                }
                break;
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object as any;
                const subscriptionId = invoice.subscription as string;

                if (subscriptionId) {
                    await adminClient
                        .from('teams')
                        .update({
                            subscription_status: 'past_due',
                        })
                        .eq('stripe_subscription_id', subscriptionId);

                    console.log(`⚠️ Payment failed for subscription ${subscriptionId}`);
                }
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                const teamId = subscription.metadata?.team_id;
                const status = subscription.status;

                if (teamId) {
                    await adminClient
                        .from('teams')
                        .update({
                            subscription_status: status === 'active' ? 'active' : (status === 'past_due' ? 'past_due' : 'canceled'),
                            subscription_tier: subscription.metadata?.plan_id,
                        })
                        .eq('id', teamId);

                    console.log(`🔄 Subscription updated for team ${teamId}: ${status}`);
                }
                break;
            }

            case 'invoice.payment_succeeded':
            case 'invoice.paid': {
                const invoice = event.data.object as any;
                const subscriptionId = invoice.subscription as string;

                if (subscriptionId) {
                    await adminClient
                        .from('teams')
                        .update({
                            subscription_status: 'active',
                        })
                        .eq('stripe_subscription_id', subscriptionId);

                    console.log(`✅ Payment succeeded for subscription ${subscriptionId}`);
                }
                break;
            }
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error('Webhook processing failed:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
