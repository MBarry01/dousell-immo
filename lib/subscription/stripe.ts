import Stripe from 'stripe';

const stripeKey = process.env.STRIPE_SECRET_KEY;

if (!stripeKey) {
    console.warn('STRIPE_SECRET_KEY is not defined, Stripe features will not work.');
}

// Le fallback 'sk_test_placeholder' empêche le crash au démarrage si la clé est absente
// (ex: build CI) mais Stripe retournera une erreur à la première vraie requête
export const stripe = new Stripe(stripeKey ?? 'sk_test_placeholder', {
    apiVersion: '2026-01-28.clover',
    typescript: true,
});
