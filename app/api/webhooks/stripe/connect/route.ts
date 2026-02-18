import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/subscription/stripe';
import { createClient } from '@/utils/supabase/server';
import Stripe from 'stripe';

// Using the generic Stripe Webhook Secret for Connect events
// Ensure this is configured in .env.local
const webhookSecret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET;

export async function POST(req: Request) {
    if (!webhookSecret) {
        console.error('Missing STRIPE_CONNECT_WEBHOOK_SECRET');
        return NextResponse.json({ error: 'Config error' }, { status: 500 });
    }

    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    let event: Stripe.Event;

    try {
        if (!signature) throw new Error('No signature');
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (_err) {
        console.error(`Webhook signature verification failed`);
        return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. LOGGING (Idempotent)
    try {
        const { error: logError } = await supabase
            .from('stripe_events_log')
            .insert({
                type: event.type,
                stripe_event_id: event.id,
                payload: event as any // Cast to JSON
            })
            // Ignore if duplicate (handled by UNIQUE constraint)
            .select()
            .single();

        if (logError && logError.code !== '23505') { // 23505 = unique_violation
            console.error('Failed to log webhook:', logError);
        } else if (logError?.code === '23505') {
            console.log(`Event ${event.id} already processed.`);
            return NextResponse.json({ received: true });
        }
    } catch (logEx) {
        console.error('Logging exception:', logEx);
    }

    // 2. EVENT PROCESSING
    try {
        switch (event.type) {
            case 'account.updated': {
                const account = event.data.object as Stripe.Account;
                const teamId = account.metadata?.team_id;

                if (teamId) {
                    await supabase.from('teams').update({
                        stripe_charges_enabled: account.charges_enabled,
                        stripe_payouts_enabled: account.payouts_enabled,
                        stripe_details_submitted: account.details_submitted,
                        stripe_account_status: (account.requirements?.disabled_reason) ? 'restricted' : (account.charges_enabled ? 'active' : 'pending'),
                        // Capture simplified status
                    }).eq('id', teamId);
                }
                break;
            }
            case 'account.application.deauthorized': {
                const accountId = (event.data.object as any).id;
                // Agency disconnected
                await supabase.from('teams').update({
                    stripe_account_id: null,
                    stripe_charges_enabled: false,
                    stripe_payouts_enabled: false,
                    stripe_account_status: 'disconnected'
                }).eq('stripe_account_id', accountId);
                break;
            }
            // Add other handlers (payment_intent.succeeded) here as needed for transaction tracking
            // Use 'transactions' table for that.
            default:
                // Just log (already done above)
                break;
        }
    } catch (error) {
        console.error('Webhook processing error:', error);
        return NextResponse.json({ error: 'Processing error' }, { status: 500 });
    }

    return NextResponse.json({ received: true });
}
