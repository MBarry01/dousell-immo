-- Migration: Add tenant access control fields to leases
-- Purpose: Enable Magic Link authentication for tenants (without auth.users account)
-- Related: WORKFLOW_PROPOSAL.md section 0.7, section 5.1.1

-- 1. Add tenant access token for Magic Link
ALTER TABLE leases
ADD COLUMN IF NOT EXISTS tenant_access_token TEXT;

-- 2. Add token expiration (7 days by default)
ALTER TABLE leases
ADD COLUMN IF NOT EXISTS tenant_token_expires_at TIMESTAMPTZ;

-- 3. Add verification flag (first access validated)
ALTER TABLE leases
ADD COLUMN IF NOT EXISTS tenant_token_verified BOOLEAN DEFAULT false;

-- 4. Add last access timestamp for analytics
ALTER TABLE leases
ADD COLUMN IF NOT EXISTS tenant_last_access_at TIMESTAMPTZ;

-- 5. Create partial index for token lookups (only non-null tokens)
CREATE INDEX IF NOT EXISTS idx_leases_tenant_token
ON leases(tenant_access_token)
WHERE tenant_access_token IS NOT NULL;

-- 6. Create index for active leases with tokens (common query pattern)
CREATE INDEX IF NOT EXISTS idx_leases_active_with_token
ON leases(tenant_access_token, status, tenant_token_expires_at)
WHERE tenant_access_token IS NOT NULL AND status = 'active';

-- 7. Add comments for documentation
COMMENT ON COLUMN leases.tenant_access_token IS 'Secure token for tenant Magic Link access (hex, 64 chars)';
COMMENT ON COLUMN leases.tenant_token_expires_at IS 'Token expiration timestamp (default 7 days from generation)';
COMMENT ON COLUMN leases.tenant_token_verified IS 'True after tenant validates identity on first access';
COMMENT ON COLUMN leases.tenant_last_access_at IS 'Last time tenant accessed /locataire dashboard';
