-- Migration: Messaging System
-- Date: 2025-12-31
-- Description: Creates messages table for internal communication linked to leases.

-- 1. Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id), -- Le sender est toujours un utilisateur authentifié
    content TEXT NOT NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies

-- Policy: Users can view messages if they are the Owner OR the Tenant of the lease
CREATE POLICY "Users can view messages for their leases"
    ON messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM leases
            WHERE leases.id = messages.lease_id
            AND (
                leases.owner_id = auth.uid() -- Est le propriétaire
                OR 
                leases.tenant_email = (select auth.jwt() ->> 'email') -- Est le locataire (via email du token)
            )
        )
    );

-- Policy: Users can send messages if they are part of the lease
CREATE POLICY "Users can insert messages for their leases"
    ON messages
    FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id -- Doit être l'expediteur
        AND
        EXISTS (
            SELECT 1 FROM leases
            WHERE leases.id = messages.lease_id
            AND (
                leases.owner_id = auth.uid()
                OR 
                leases.tenant_email = (select auth.jwt() ->> 'email')
            )
        )
    );

-- Policy: Users can update message (only to mark as read, ideally constrained but simple update for now)
CREATE POLICY "Users can update usage for read status"
    ON messages
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM leases
            WHERE leases.id = messages.lease_id
            AND (
                leases.owner_id = auth.uid()
                OR 
                leases.tenant_email = (select auth.jwt() ->> 'email')
            )
        )
    );

-- 4. Indexes
CREATE INDEX idx_messages_lease_id ON messages(lease_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
