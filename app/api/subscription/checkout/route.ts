import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { stripe, STRIPE_PLANS } from '@/lib/subscription/stripe';
import { getBaseUrl } from '@/lib/utils';
import { getUserTeamContext } from '@/lib/team-context';

export async function POST(req: Request) {
    try {
        const { planId } = await req.json();

        if (!planId || !STRIPE_PLANS[planId as keyof typeof STRIPE_PLANS]) {
            return NextResponse.json({ error: 'Plan invalide' }, { status: 400 });
        }

        const { teamId, team } = await getUserTeamContext();
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Non connecté' }, { status: 401 });
        }

        // 1. Récupérer ou créer le Stripe Customer ID dans la table teams
        const { data: teamData, error: teamError } = await supabase
            .from('teams')
            .select('stripe_customer_id, name')
            .eq('id', teamId)
            .single();

        if (teamError) throw teamError;

        let stripeCustomerId = teamData.stripe_customer_id;

        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                name: teamData.name || team.name,
                metadata: {
                    team_id: teamId,
                },
            });
            stripeCustomerId = customer.id;

            await supabase
                .from('teams')
                .update({ stripe_customer_id: stripeCustomerId })
                .eq('id', teamId);
        }

        // 2. Créer la session de checkout
        const baseUrl = getBaseUrl();
        const plan = STRIPE_PLANS[planId as keyof typeof STRIPE_PLANS];

        const session = await stripe.checkout.sessions.create({
            customer: stripeCustomerId,
            line_items: [
                {
                    price: plan.priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${baseUrl}/gestion/abonnement?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/gestion/abonnement?canceled=true`,
            metadata: {
                team_id: teamId,
                plan_id: planId,
            },
            subscription_data: {
                metadata: {
                    team_id: teamId,
                    plan_id: planId,
                },
            },
        });

        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        console.error('Stripe Checkout Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
