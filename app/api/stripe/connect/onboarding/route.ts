import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/subscription/stripe';
import { getUserTeamContext } from '@/lib/team-context';
import { getBaseUrl } from '@/lib/utils';

export async function POST(_req: Request) {
    try {
        const { teamId, team } = await getUserTeamContext();
        const supabase = await createClient();

        // 1. Check if team already has a Connect Account
        let accountId = team.stripe_account_id;

        if (!accountId) {
            // Create a new Express account
            console.log('Creating new Stripe Express account for team:', teamId);
            const account = await stripe.accounts.create({
                type: 'express',
                country: 'SN', // Default to Senegal per business logic
                email: team.company_email || undefined, // Pre-fill if available
                capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true },
                },
                business_type: 'company', // Assume company/agency usually
                business_profile: {
                    url: getBaseUrl(), // Fallback URL
                    product_description: 'Gestion immobilière via Dousell Immo',
                },
                metadata: {
                    team_id: teamId
                }
            });

            accountId = account.id;

            // Save to DB immediately
            const { error: updateError } = await supabase
                .from('teams')
                .update({
                    stripe_account_id: accountId,
                    stripe_account_status: 'pending'
                })
                .eq('id', teamId);

            if (updateError) throw updateError;
        }

        // 2. Create Account Link (Onboarding flow)
        const baseUrl = getBaseUrl();
        const accountLink = await stripe.accountLinks.create({
            account: accountId,
            refresh_url: `${baseUrl}/gestion/comptabilite?connect_refresh=true`,
            return_url: `${baseUrl}/gestion/comptabilite?connect_success=true`,
            type: 'account_onboarding',
        });

        return NextResponse.json({ url: accountLink.url });

    } catch (error) {
        console.error('Stripe Connect Error:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}
