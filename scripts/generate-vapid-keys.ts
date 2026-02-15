/**
 * Generate VAPID key pair for Web Push notifications.
 * Run: npx tsx scripts/generate-vapid-keys.ts
 * Then add the output to your .env.local
 */
import webpush from 'web-push';

const vapidKeys = webpush.generateVAPIDKeys();

console.log('Add these to your .env.local:\n');
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
