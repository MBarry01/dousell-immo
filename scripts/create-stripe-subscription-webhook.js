const Stripe = require('stripe');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
    console.error('❌ Missing STRIPE_SECRET_KEY in .env.local');
    process.exit(1);
}

const stripe = new Stripe(stripeKey);

const DEFAULT_URL = 'https://doussel.immo/api/webhooks/stripe/subscriptions';
const url = process.argv[2] || DEFAULT_URL;

async function createWebhook() {
    console.log(`🚀 Creating Stripe Webhook for: ${url}`);

    try {
        const webhookEndpoint = await stripe.webhookEndpoints.create({
            url: url,
            enabled_events: [
                'checkout.session.completed',
                'customer.subscription.updated',
                'customer.subscription.deleted',
                'invoice.payment_failed',
                'invoice.payment_succeeded',
            ],
            description: 'Webhook for Doussel Immo Subscriptions',
        });

        console.log('✅ Webhook created successfully!');
        console.log(`🆔 ID: ${webhookEndpoint.id}`);
        console.log(`🔑 Signing Secret: ${webhookEndpoint.secret}`);

        // Update .env.local
        const envPath = path.join(__dirname, '../.env.local');
        let envContent = fs.readFileSync(envPath, 'utf8');

        const secretLine = `STRIPE_SUBSCRIPTION_WEBHOOK_SECRET=${webhookEndpoint.secret}`;

        if (envContent.includes('STRIPE_SUBSCRIPTION_WEBHOOK_SECRET=')) {
            envContent = envContent.replace(/STRIPE_SUBSCRIPTION_WEBHOOK_SECRET=.*/, secretLine);
        } else {
            envContent += `\n${secretLine}\n`;
        }

        fs.writeFileSync(envPath, envContent);
        console.log('📝 .env.local updated with STRIPE_SUBSCRIPTION_WEBHOOK_SECRET');

    } catch (error) {
        console.error('❌ Error creating webhook:', error.message);
        if (error.message.includes('already exists')) {
            console.log('💡 Tip: If you want to replace it, delete the old one in Stripe Dashboard first.');
        }
    }
}

createWebhook();
