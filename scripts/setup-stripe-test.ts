import Stripe from 'stripe';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

const stripeKey = process.env.STRIPE_SECRET_KEY;

if (!stripeKey || stripeKey.startsWith('sk_test_placeholder')) {
    console.error('❌ STRIPE_SECRET_KEY is missing or invalid in .env.local');
    process.exit(1);
}

const stripe = new Stripe(stripeKey, {
    apiVersion: '2024-06-20' as any,
});

async function setup() {
    console.log('🚀 Setting up Stripe test products and prices...');

    try {
        // 1. Create Starter Product
        const starterProduct = await stripe.products.create({
            name: 'Dousell Starter',
            description: 'Gestion locative jusqu\'à 10 biens',
        });

        const starterPrice = await stripe.prices.create({
            product: starterProduct.id,
            unit_amount: 15000,
            currency: 'xof',
            recurring: { interval: 'month' },
        });

        console.log(`✅ Starter Price Created: ${starterPrice.id}`);

        // 2. Create Pro Product
        const proProduct = await stripe.products.create({
            name: 'Dousell Pro',
            description: 'Gestion locative - Biens illimités',
        });

        const proPrice = await stripe.prices.create({
            product: proProduct.id,
            unit_amount: 35000,
            currency: 'xof',
            recurring: { interval: 'month' },
        });

        console.log(`✅ Pro Price Created: ${proPrice.id}`);

        // Update .env.local
        const envPath = path.join(process.cwd(), '.env.local');
        let envContent = fs.readFileSync(envPath, 'utf8');

        envContent = envContent.replace(
            /NEXT_PUBLIC_STRIPE_PRICE_STARTER=.*/,
            `NEXT_PUBLIC_STRIPE_PRICE_STARTER=${starterPrice.id}`
        );
        envContent = envContent.replace(
            /NEXT_PUBLIC_STRIPE_PRICE_PRO=.*/,
            `NEXT_PUBLIC_STRIPE_PRICE_PRO=${proPrice.id}`
        );

        fs.writeFileSync(envPath, envContent);
        console.log('✅ .env.local updated with real Price IDs!');

    } catch (error: any) {
        console.error('❌ Error setting up Stripe:', error.message);
    }
}

setup();
