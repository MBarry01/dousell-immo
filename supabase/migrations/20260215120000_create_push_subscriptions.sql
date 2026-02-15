-- Push Subscriptions table for Web Push notifications (VAPID)
-- Supports both auth.users (owners/admins) and cookie-based tenants

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- For auth.users (owners/admins)
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  -- For tenants (cookie-based, no auth.users record)
  lease_id uuid REFERENCES public.leases(id) ON DELETE CASCADE,
  -- Subscription type
  subscriber_type text NOT NULL CHECK (subscriber_type IN ('user', 'tenant')),
  -- Web Push subscription fields
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  -- Prevent duplicate subscriptions per endpoint
  CONSTRAINT push_subscriptions_endpoint_unique UNIQUE (endpoint),
  -- Ensure correct identifier is set based on type
  CONSTRAINT push_subscriptions_identifier_check CHECK (
    (subscriber_type = 'user' AND user_id IS NOT NULL) OR
    (subscriber_type = 'tenant' AND lease_id IS NOT NULL)
  )
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id
  ON public.push_subscriptions(user_id) WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_lease_id
  ON public.push_subscriptions(lease_id) WHERE lease_id IS NOT NULL;

-- RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can manage their own subscriptions
CREATE POLICY "Users can insert own push subscriptions"
  ON public.push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id AND subscriber_type = 'user');

CREATE POLICY "Users can view own push subscriptions"
  ON public.push_subscriptions FOR SELECT
  USING (auth.uid() = user_id AND subscriber_type = 'user');

CREATE POLICY "Users can update own push subscriptions"
  ON public.push_subscriptions FOR UPDATE
  USING (auth.uid() = user_id AND subscriber_type = 'user');

CREATE POLICY "Users can delete own push subscriptions"
  ON public.push_subscriptions FOR DELETE
  USING (auth.uid() = user_id AND subscriber_type = 'user');

-- Tenant subscriptions are managed via service role (no RLS policy needed)
-- The API endpoint validates the tenant cookie and uses service role to insert/update
