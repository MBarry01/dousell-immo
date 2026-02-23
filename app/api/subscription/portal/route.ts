import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/subscription/stripe';
import { getBaseUrl } from '@/lib/utils';
import { getUserTeamContext } from '@/lib/team-context';

export async function POST(_req: Request) {
    try {
        const context = await getUserTeamContext();
        if (!context) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        const { teamId, team } = context;
        const supabase = await createClient();

        // Get customer ID
        const { data: teamData } = await supabase
            .from('teams')
            .select('stripe_customer_id')
            .eq('id', teamId)
            .single();

        if (!team?.stripe_customer_id) {
            return NextResponse.json(
                { error: "Aucun abonnement trouvé pour cette équipe." },
                { status: 404 }
            );
        }

        const baseUrl = getBaseUrl();

        // Create Portal Session
        const session = await stripe.billingPortal.sessions.create({
            customer: team.stripe_customer_id,
            return_url: `${baseUrl}/gestion/abonnement`,
        });

        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        console.error('Stripe Portal Error:', error);
        return NextResponse.json(
            { error: error.message || 'Erreur lors de la création du portail.' },
            { status: 500 }
        );
    }
}
