import Stripe from 'stripe';

const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';

if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('STRIPE_SECRET_KEY is not defined, Stripe features will not work.');
}

export const stripe = new Stripe(stripeKey, {
    apiVersion: '2026-01-28.clover',
    typescript: true,
});
