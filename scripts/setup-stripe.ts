
import Stripe from 'stripe';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: '.env.local' });

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
    console.error('❌ STRIPE_SECRET_KEY is missing in .env.local');
    process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20',
});

const CONSTANTS = {
    products: {
        starter: {
            name: 'Starter Plan',
            prices: {
                xof: { monthly: 15000, annual: 144000 },
                eur: { monthly: 2300, annual: 22000 }, // in cents: 23.00€ and 220.00€ (approx -20%)
            },
        },
        pro: {
            name: 'Professional Plan',
            prices: {
                xof: { monthly: 35000, annual: 336000 },
                eur: { monthly: 5300, annual: 51000 }, // in cents
            },
        },
        enterprise: {
            name: 'Enterprise Plan',
            prices: {
                xof: { monthly: 75000, annual: 720000 },
                eur: { monthly: 11500, annual: 110000 }, // in cents
            },
        },
    },
};

async function main() {
    console.log('🚀 Starting Stripe setup (Idempotent & Multi-currency)...');

    const envUpdates: string[] = [];

    // Helper to find existing product by name
    const findProduct = async (name: string) => {
        const products = await stripe.products.search({
            query: `name:'${name}' AND active:'true'`,
        });
        return products.data[0];
    };

    // Helper to find existing price
    const findPrice = async (productId: string, currency: string, interval: 'month' | 'year', amount: number) => {
        const prices = await stripe.prices.list({
            product: productId,
            currency,
            lookup_keys: [`${productId}_${currency}_${interval}`], // Optional: use lookup keys if you set them
            active: true,
            limit: 100,
        });
        // Fallback: search by characteristics if lookup key not used previously
        return prices.data.find(p => p.recurring?.interval === interval && p.unit_amount === amount);
    };

    // Create Products and Prices
    for (const [key, config] of Object.entries(CONSTANTS.products)) {
        const tier = key.toUpperCase(); // STARTER, PRO, ENTERPRISE
        console.log(`\n📦 Processing ${config.name}...`);

        // 1. Get or Create Product
        let product = await findProduct(config.name);
        if (!product) {
            product = await stripe.products.create({
                name: config.name,
                description: `Dousell Immo ${config.name}`,
            });
            console.log(`   ✅ Created Product: ${product.id}`);
        } else {
            console.log(`   ℹ️  Found Existing Product: ${product.id}`);
        }

        // Process each currency
        for (const currency of ['xof', 'eur'] as const) {
            const prices = config.prices[currency];
            const curUpper = currency.toUpperCase();

            // 2. Monthly Price
            let priceMonthly = await findPrice(product.id, currency, 'month', prices.monthly);
            if (!priceMonthly) {
                priceMonthly = await stripe.prices.create({
                    product: product.id,
                    unit_amount: prices.monthly,
                    currency: currency,
                    recurring: { interval: 'month' },
                    nickname: `${config.name} Monthly (${curUpper})`,
                    metadata: { tier: key, interval: 'month', currency },
                });
                console.log(`   ✅ Created Monthly Price (${curUpper}): ${priceMonthly.id}`);
            } else {
                console.log(`   ℹ️  Found Monthly Price (${curUpper}): ${priceMonthly.id}`);
            }
            envUpdates.push(`NEXT_PUBLIC_STRIPE_PRICE_${tier}_MONTHLY_${curUpper}=${priceMonthly.id}`);

            // 3. Annual Price
            let priceAnnual = await findPrice(product.id, currency, 'year', prices.annual);
            if (!priceAnnual) {
                priceAnnual = await stripe.prices.create({
                    product: product.id,
                    unit_amount: prices.annual,
                    currency: currency,
                    recurring: { interval: 'year' },
                    nickname: `${config.name} Annual (${curUpper})`,
                    metadata: { tier: key, interval: 'year', currency },
                });
                console.log(`   ✅ Created Annual Price (${curUpper}): ${priceAnnual.id}`);
            } else {
                console.log(`   ℹ️  Found Annual Price (${curUpper}): ${priceAnnual.id}`);
            }
            envUpdates.push(`NEXT_PUBLIC_STRIPE_PRICE_${tier}_ANNUAL_${curUpper}=${priceAnnual.id}`);
        }
    }

    console.log('\n\n🎉 Setup Complete! Add these lines to your .env.local:');
    console.log('==================================================');
    const output = envUpdates.join('\n');
    console.log(output);
    console.log('==================================================');

    // Write to check
    fs.writeFileSync('stripe_env_output.txt', output);
}

main().catch((err) => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
