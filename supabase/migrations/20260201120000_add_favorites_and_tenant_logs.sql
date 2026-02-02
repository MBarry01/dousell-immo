-- Migration: Add favorites table + tenant access logs
-- Purpose:
--   1. Server-side favorites sync for registered users
--   2. Audit trail for tenant Magic Link access
-- Related: REMAINING_TASKS.md sections 2.2, 3.5.2, 3.5.4

-- ===========================================
-- 1. FAVORITES TABLE (Section 2.2)
-- ===========================================

-- Create favorites table for server-side persistence
CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Prevent duplicates
    UNIQUE(user_id, property_id)
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);

-- Index for property popularity analytics
CREATE INDEX IF NOT EXISTS idx_favorites_property_id ON favorites(property_id);

-- RLS: Users can only access their own favorites
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own favorites
CREATE POLICY "Users can view own favorites"
    ON favorites FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own favorites
CREATE POLICY "Users can add favorites"
    ON favorites FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own favorites
CREATE POLICY "Users can remove favorites"
    ON favorites FOR DELETE
    USING (auth.uid() = user_id);

-- Comments for documentation
COMMENT ON TABLE favorites IS 'Server-side storage for user property favorites (synced from localStorage)';
COMMENT ON COLUMN favorites.user_id IS 'References auth.users - only registered users have server favorites';
COMMENT ON COLUMN favorites.property_id IS 'References properties - validates property exists';

-- ===========================================
-- 2. FAVORITES SYNC LOGS (Section 3.5.4)
-- ===========================================

-- Track sync operations for abuse detection
CREATE TABLE IF NOT EXISTS favorites_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    attempted_count INTEGER NOT NULL,
    synced_count INTEGER NOT NULL,
    trimmed_to INTEGER,
    is_suspicious BOOLEAN DEFAULT false,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user abuse detection
CREATE INDEX IF NOT EXISTS idx_favorites_sync_logs_user_id ON favorites_sync_logs(user_id);

-- Index for suspicious activity monitoring
CREATE INDEX IF NOT EXISTS idx_favorites_sync_logs_suspicious ON favorites_sync_logs(is_suspicious) WHERE is_suspicious = true;

-- RLS: Only server can write, admins can read
ALTER TABLE favorites_sync_logs ENABLE ROW LEVEL SECURITY;

-- Policy: No direct user access (server-side only via service role)
-- Admins can view for monitoring (if admin role exists)

COMMENT ON TABLE favorites_sync_logs IS 'Audit trail for favorites sync operations - used to detect abuse';

-- ===========================================
-- 3. TENANT ACCESS LOGS (Section 3.5.2)
-- ===========================================

-- Comprehensive audit trail for tenant Magic Link access
CREATE TABLE IF NOT EXISTS tenant_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lease_id UUID REFERENCES leases(id) ON DELETE SET NULL,

    -- Access attempt details
    action TEXT NOT NULL CHECK (action IN (
        'token_generated',
        'token_validated',
        'token_validation_failed',
        'identity_verified',
        'identity_verification_failed',
        'token_revoked',
        'session_created',
        'session_expired'
    )),

    -- Metadata
    ip_address INET,
    user_agent TEXT,

    -- Failure tracking (for rate limiting)
    failure_reason TEXT,
    attempt_count INTEGER DEFAULT 1,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for lease-based queries (owner viewing tenant activity)
CREATE INDEX IF NOT EXISTS idx_tenant_access_logs_lease_id ON tenant_access_logs(lease_id);

-- Index for security monitoring (failed attempts)
CREATE INDEX IF NOT EXISTS idx_tenant_access_logs_failures
    ON tenant_access_logs(action, created_at)
    WHERE action IN ('token_validation_failed', 'identity_verification_failed');

-- Index for recent activity queries
CREATE INDEX IF NOT EXISTS idx_tenant_access_logs_created_at ON tenant_access_logs(created_at DESC);

-- RLS: Owners can view logs for their leases, service role can write
ALTER TABLE tenant_access_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Lease owners can view access logs for their properties
CREATE POLICY "Owners can view tenant access logs"
    ON tenant_access_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM leases l
            WHERE l.id = tenant_access_logs.lease_id
            AND l.owner_id = auth.uid()
        )
    );

-- Comments for documentation
COMMENT ON TABLE tenant_access_logs IS 'Audit trail for tenant Magic Link access attempts';
COMMENT ON COLUMN tenant_access_logs.action IS 'Type of access action: token_generated, token_validated, token_validation_failed, identity_verified, etc.';
COMMENT ON COLUMN tenant_access_logs.failure_reason IS 'Reason for failure if action is a failure type';
COMMENT ON COLUMN tenant_access_logs.attempt_count IS 'Number of attempts (for tracking repeated failures)';

-- ===========================================
-- 4. HELPER FUNCTION: Rate Limit Check
-- ===========================================

-- Function to check if user exceeded favorites sync rate limit
CREATE OR REPLACE FUNCTION check_favorites_sync_rate_limit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    hourly_count INTEGER;
    daily_count INTEGER;
BEGIN
    -- Count syncs in the last hour
    SELECT COUNT(*) INTO hourly_count
    FROM favorites_sync_logs
    WHERE user_id = p_user_id
    AND created_at > NOW() - INTERVAL '1 hour';

    -- Count syncs in the last day
    SELECT COUNT(*) INTO daily_count
    FROM favorites_sync_logs
    WHERE user_id = p_user_id
    AND created_at > NOW() - INTERVAL '1 day';

    -- Rate limits: 3/hour, 10/day
    RETURN hourly_count < 3 AND daily_count < 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_favorites_sync_rate_limit IS 'Returns true if user is within rate limits for favorites sync (3/hour, 10/day)';
