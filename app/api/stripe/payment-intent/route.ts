import { NextResponse } from 'next/server';
import { stripe } from '@/lib/subscription/stripe';
import { getUserTeamContext } from '@/lib/team-context';
import { createClient } from '@/utils/supabase/server';
import { CONNECT_CONFIG } from '@/lib/config/stripe-config';

export async function POST(req: Request) {
    try {
        const { teamId, team } = await getUserTeamContext();

        // 1. Strict Security Checks (Audit Requirement)
        if (!team.stripe_account_id) {
            return NextResponse.json({ error: "Agence non connectée Stripe Connect." }, { status: 400 });
        }
        if (!team.stripe_charges_enabled) {
            return NextResponse.json({ error: "Compte agence invalide (KYC incomplet)." }, { status: 400 });
        }
        if (!team.stripe_payouts_enabled) {
            return NextResponse.json({ error: "Compte bancaire agence manquant." }, { status: 400 });
        }

        const body = await req.json();
        const { amount, currency = CONNECT_CONFIG.DEFAULT_CURRENCY, rentId, customerId } = body;

        // 2. Amount Validation
        if (!amount || amount <= 0) {
            return NextResponse.json({ error: "Montant invalide." }, { status: 400 });
        }

        // 3. Commission Calculation (Diaspora Model)
        // Formula: Amount * 3.5% + 0.50€
        // Note: Amount is in cents. Fixed fee must be converted to cents (0.50 * 100 = 50)
        const fixedFeeCents = Math.round(CONNECT_CONFIG.DIASPORA_FIXED_FEE_EUR * 100);
        const commissionAmount = Math.round((amount * CONNECT_CONFIG.DIASPORA_COMMISSION_PERCENT) + fixedFeeCents);

        // Safety check: Commission cannot exceed total amount
        if (commissionAmount >= amount) {
            console.error(`Commission Error: Amount ${amount}, Comm ${commissionAmount}`);
            return NextResponse.json({ error: "Configuration erreur: Commission supérieure au montant." }, { status: 500 });
        }

        // 4. Create PaymentIntent (Diaspora Flow: User pays Platform, Platform splits to Agency)
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: currency,
            customer: customerId, // Optional: if logged in user has a stripe customer ID
            automatic_payment_methods: { enabled: true },

            application_fee_amount: commissionAmount, // Platform Commission (Covers Stripe Fees + Profit)

            transfer_data: {
                destination: team.stripe_account_id, // Agency receives the rest
            },

            metadata: {
                team_id: teamId,
                rent_id: rentId,
                integration_type: 'connect_hybrid_v1'
            }
        });

        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        });

    } catch (error) {
        console.error('PaymentIntent Error:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown payment error' }, { status: 500 });
    }
}
