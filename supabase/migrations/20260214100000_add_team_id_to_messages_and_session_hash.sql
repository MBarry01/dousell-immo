-- Add team_id to messages table for team-based filtering consistency
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_messages_team_id ON public.messages(team_id);

-- Ensure updated_at column exists (may be missing if table was created outside migrations)
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Temporarily disable the updated_at trigger during backfill to avoid errors
ALTER TABLE public.messages DISABLE TRIGGER messages_updated_at_trigger;

-- Backfill team_id from leases for existing messages
UPDATE public.messages m
SET team_id = l.team_id
FROM public.leases l
WHERE m.lease_id = l.id
  AND m.team_id IS NULL
  AND l.team_id IS NOT NULL;

-- Re-enable the trigger
ALTER TABLE public.messages ENABLE TRIGGER messages_updated_at_trigger;

-- Add tenant_session_hash to leases for single-use magic link + session separation
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS tenant_session_hash TEXT;
