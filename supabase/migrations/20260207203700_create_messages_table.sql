-- Create messages table for tenant-owner communication
-- This table stores messages between property owners and tenants
-- Tenants don't have auth.users accounts, so we use 'tenant' as sender_id for tenant messages

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lease_id UUID NOT NULL REFERENCES public.leases(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL, -- 'tenant' for tenant messages, or owner's UUID for owner messages
    content TEXT NOT NULL,
    read_at TIMESTAMPTZ, -- When the message was read
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast queries by lease
CREATE INDEX IF NOT EXISTS idx_messages_lease_id ON public.messages(lease_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policy: Owners can read/write messages for their leases
CREATE POLICY "Owners can manage messages for their leases"
ON public.messages
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.leases l
        WHERE l.id = messages.lease_id
        AND l.owner_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.leases l
        WHERE l.id = messages.lease_id
        AND l.owner_id = auth.uid()
    )
);

-- Note: Tenant messages are inserted via service role (bypass RLS)
-- because tenants don't have auth.users accounts

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER messages_updated_at_trigger
    BEFORE UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION update_messages_updated_at();

-- Add comment for documentation
COMMENT ON TABLE public.messages IS 'Messages between property owners and tenants. Tenants use sender_id="tenant" since they have no auth account.';
COMMENT ON COLUMN public.messages.sender_id IS 'Owner UUID for owner messages, "tenant" string for tenant messages';
