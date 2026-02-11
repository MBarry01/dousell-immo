// Dousell Immo - Stripe Connect Configuration

export const CONNECT_CONFIG = {
    // Commission Platform (1% by default, adjust per business needs)
    PLATFORM_COMMISSION_PERCENT: 0.01,

    // Commission Cap (e.g. max 5000 FCFA -> ~7.62 EUR)
    PLATFORM_COMMISSION_CAP_EUR: 7.62,

    // Diaspora Model Commission (3.5% + 0.50€ for Connect payments)
    DIASPORA_COMMISSION_PERCENT: 0.035,
    DIASPORA_FIXED_FEE_EUR: 0.50,

    // Currencies
    DEFAULT_CURRENCY: 'eur', // Stripe transactions processing
    DISPLAY_CURRENCY: 'xof', // Dashboard display

    // Limits
    MIN_AMOUNT_EUR: 1.00, // Stripe minimum
};

export const STRIPE_EVENTS_TO_LOG = [
    'account.updated',
    'account.application.deauthorized',
    'payment_intent.succeeded',
    'payment_intent.payment_failed',
    'payout.failed'
];
