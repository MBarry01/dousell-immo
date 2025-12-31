-- Enable RLS for tenants to view their own leases
-- Currently only owners can view leases. This blocks the dashboard from checking if a user is a tenant.

CREATE POLICY "Tenants can view their own leases"
    ON leases
    FOR SELECT
    USING (
        tenant_email = (select auth.jwt() ->> 'email')
    );
