import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getTenantSessionFromCookie } from '@/lib/tenant-magic-link';
import { createAdminClient } from '@/utils/supabase/admin';

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

/**
 * Save a Web Push subscription for a tenant (cookie-based auth).
 * Uses service role since tenants have no auth.users record.
 */
export async function POST(req: Request) {
  const session = await getTenantSessionFromCookie();

  if (!session) {
    return NextResponse.json({ error: 'Session invalide' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = subscriptionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
  }

  const { endpoint, keys } = parsed.data;
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      {
        lease_id: session.lease_id,
        subscriber_type: 'tenant',
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'endpoint' }
    );

  if (error) {
    console.error('Tenant push subscription error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
