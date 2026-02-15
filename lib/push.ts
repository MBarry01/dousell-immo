import webpush from 'web-push';
import { createAdminClient } from '@/utils/supabase/admin';

// Configure VAPID credentials
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${process.env.ADMIN_EMAIL || 'contact@dousell.com'}`,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

type SubscriptionRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

/**
 * Send push notification to an auth.users user (owner/admin).
 * No-op if VAPID keys are not configured or user has no subscriptions.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return;

  const supabase = createAdminClient();
  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId)
    .eq('subscriber_type', 'user');

  if (!subscriptions?.length) return;

  await sendToSubscriptions(supabase, subscriptions, payload);
}

/**
 * Send push notification to a tenant by lease_id.
 * Tenants have no auth.users record, so we look up by lease_id.
 */
export async function sendPushToTenant(leaseId: string, payload: PushPayload): Promise<void> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return;

  const supabase = createAdminClient();
  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('lease_id', leaseId)
    .eq('subscriber_type', 'tenant');

  if (!subscriptions?.length) return;

  await sendToSubscriptions(supabase, subscriptions, payload);
}

/**
 * Internal: send push to a list of subscriptions in parallel.
 * Automatically cleans up expired/invalid subscriptions (410/404).
 */
async function sendToSubscriptions(
  supabase: ReturnType<typeof createAdminClient>,
  subscriptions: SubscriptionRow[],
  payload: PushPayload
): Promise<void> {
  const jsonPayload = JSON.stringify(payload);
  const expiredIds: string[] = [];

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          jsonPayload
        );
      } catch (error: unknown) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 410 || statusCode === 404) {
          expiredIds.push(sub.id);
        } else {
          console.error(`Push send failed for ${sub.endpoint}:`, (error as Error).message);
        }
      }
    })
  );

  // Clean up expired subscriptions
  if (expiredIds.length > 0) {
    await supabase
      .from('push_subscriptions')
      .delete()
      .in('id', expiredIds);
  }
}
