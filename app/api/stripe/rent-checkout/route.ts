import { NextRequest, NextResponse } from 'next/server';
import { createRentCheckoutSession } from '@/lib/stripe-rent';
import { getTenantSessionFromCookie } from '@/lib/tenant-magic-link';

/**
 * POST /api/stripe/rent-checkout
 * Creates a Stripe Checkout session for rent payment
 *
 * Uses tenant session from cookie (magic link auth)
 */
export async function POST(req: NextRequest) {
    try {
        // Get tenant session from cookie
        const session = await getTenantSessionFromCookie();

        if (!session) {
            return NextResponse.json(
                { error: 'Session expirée. Veuillez vous reconnecter.' },
                { status: 401 }
            );
        }
        // Note: we don't check session.verified here because the session cookie
        // is ONLY created after successful identity verification. Having a valid
        // cookie is sufficient proof of identity.

        const body = await req.json();
        const { amount, periodMonth, periodYear, propertyAddress } = body;

        // Validate required fields
        if (!amount || amount <= 0) {
            return NextResponse.json(
                { error: 'Montant invalide' },
                { status: 400 }
            );
        }

        // DEBUG: Log received period
        console.log('📥 [rent-checkout] Received:', { amount, periodMonth, periodYear, propertyAddress });

        // Validate required fields
        // Note: periodMonth can be 0 for guarantee/deposit payments
        if (typeof periodMonth !== 'number' || typeof periodYear !== 'number') {
            console.error('❌ [rent-checkout] Invalid period:', { periodMonth, periodYear });
            return NextResponse.json(
                { error: 'Période de paiement requise' },
                { status: 400 }
            );
        }

        // Build success and cancel URLs
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const successUrl = `${baseUrl}/locataire/paiement-succes?session_id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = `${baseUrl}/locataire`;

        // Create Stripe checkout session
        const checkoutSession = await createRentCheckoutSession({
            leaseId: session.lease_id,
            amount,
            periodMonth,
            periodYear,
            tenantName: session.tenant_name || 'Locataire',
            tenantEmail: session.tenant_email || '',
            propertyAddress: propertyAddress || session.property_address,
            successUrl,
            cancelUrl,
        });

        return NextResponse.json({
            sessionId: checkoutSession.sessionId,
            url: checkoutSession.url,
        });

    } catch (error) {
        console.error('Error creating Stripe checkout session:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la création de la session de paiement' },
            { status: 500 }
        );
    }
}
