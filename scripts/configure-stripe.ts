import { loadEnvConfig } from '@next/env';
import Stripe from 'stripe';

// Load environment variables from .env.local, .env, etc. (Next.js standard)
loadEnvConfig(process.cwd());

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
    console.error("❌ ERREUR: STRIPE_SECRET_KEY manquant dans le fichier .env");
    process.exit(1);
}

const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2025-01-27.acacia', // Latest or matching package.json
    appInfo: { name: 'dousell-immo-setup-script' }
});

async function configureStripe() {
    console.log("🚀 Démarrage de la configuration automatique Stripe...");

    try {
        // 1. Create Product "Frais Transaction Mobile Money"
        console.log("📦 Création du produit 'Frais Transaction Mobile Money'...");

        const product = await stripe.products.create({
            name: 'Frais Transaction Mobile Money',
            description: 'Frais variables pour les transactions via Wave/Orange Money (Metered Billing)',
        });

        console.log(`✅ Produit créé: ${product.id}`);

        // 2. Create Price (200 XOF / unit, Metered)
        console.log("💰 Création du prix (200 XOF - Metered)...");

        const price = await stripe.prices.create({
            product: product.id,
            unit_amount: 200, // 200 FCFA
            currency: 'xof',
            recurring: {
                interval: 'month',
                usage_type: 'metered',
                aggregate_usage: 'sum',
            },
            nickname: 'Commission Fixe Mobile Money (200F)',
        });

        console.log("\n🎉 SUCCÈS ! Voici l'ID à copier dans votre .env :\n");
        console.log(`STRIPE_METERED_PRICE_ID=${price.id}`);
        console.log("\n------------------------------------------------\n");

    } catch (error) {
        console.error("❌ Erreur lors de la configuration :", error);
    }
}

configureStripe();
