import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not defined');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20' as any, // Use latest stable or the one you are comfortable with
    typescript: true,
});

export const STRIPE_PLANS = {
    starter: {
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER || 'price_starter_placeholder',
        name: 'Starter',
    },
    pro: {
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO || 'price_pro_placeholder',
        name: 'Professional',
    },
    enterprise: {
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE || 'price_enterprise_placeholder',
        name: 'Enterprise',
    },
};
