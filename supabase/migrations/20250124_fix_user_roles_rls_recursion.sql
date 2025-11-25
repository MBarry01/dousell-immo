-- Fix infinite recursion in user_roles RLS policies
-- The issue: Policies on properties/leads check user_roles, but user_roles policies themselves create recursion

-- Step 1: Drop existing problematic policies on user_roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view roles" ON public.user_roles;
DROP POLICY IF EXISTS "Public read access" ON public.user_roles;

-- Step 2: Create a SECURITY DEFINER function to get user roles (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_user_roles(target_user_id UUID)
RETURNS TEXT[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT role::TEXT
    FROM public.user_roles
    WHERE user_id = target_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_roles(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_roles(UUID) TO anon;

-- Step 3: Create a helper function to check if user has admin role (avoids recursion)
-- This MUST be created before policies that use it
CREATE OR REPLACE FUNCTION public.user_has_admin_role(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = check_user_id
    AND role IN ('admin', 'moderateur', 'superadmin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.user_has_admin_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_admin_role(UUID) TO anon;

-- Step 4: Create simple RLS policies on user_roles (no recursion)
-- Allow users to read their own roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow service_role to read all roles (for backend operations)
-- Note: service_role bypasses RLS by default, but we document it here

-- Step 5: Fix policies on properties that check user_roles (causes recursion)
-- IMPORTANT: This only drops ADMIN policies. Public read policies (if any) are NOT affected.
-- Drop all existing ADMIN policies that might check user_roles
DROP POLICY IF EXISTS "Admins can view all properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can manage properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can view properties" ON public.properties;
DROP POLICY IF EXISTS "Admin read access" ON public.properties;
DROP POLICY IF EXISTS "Admin full access" ON public.properties;

-- Recreate admin policies using the helper function (no recursion)
CREATE POLICY "Admins can view all properties"
  ON public.properties
  FOR SELECT
  TO authenticated
  USING (
    public.user_has_admin_role(auth.uid())
  );

CREATE POLICY "Admins can manage properties"
  ON public.properties
  FOR ALL
  TO authenticated
  USING (
    public.user_has_admin_role(auth.uid())
  )
  WITH CHECK (
    public.user_has_admin_role(auth.uid())
  );

-- Step 6: Fix policies on leads that check user_roles (causes recursion)
-- IMPORTANT: This only drops ADMIN policies. Public insert policies (if any) are NOT affected.
-- Drop all existing ADMIN policies that might check user_roles
DROP POLICY IF EXISTS "Admins can view all leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can manage leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can view leads" ON public.leads;
DROP POLICY IF EXISTS "Admin read access" ON public.leads;
DROP POLICY IF EXISTS "Admin full access" ON public.leads;

-- Recreate admin policies using the helper function (no recursion)
CREATE POLICY "Admins can view all leads"
  ON public.leads
  FOR SELECT
  TO authenticated
  USING (
    public.user_has_admin_role(auth.uid())
  );

CREATE POLICY "Admins can manage leads"
  ON public.leads
  FOR ALL
  TO authenticated
  USING (
    public.user_has_admin_role(auth.uid())
  )
  WITH CHECK (
    public.user_has_admin_role(auth.uid())
  );

-- Comments for documentation
COMMENT ON FUNCTION public.user_has_admin_role(UUID) IS 
  'Checks if a user has admin role. Uses SECURITY DEFINER to bypass RLS and prevent infinite recursion.';
COMMENT ON FUNCTION public.get_user_roles(UUID) IS 
  'Returns all roles for a user. Uses SECURITY DEFINER to bypass RLS and prevent infinite recursion.';

COMMENT ON POLICY "Users can view own roles" ON public.user_roles IS 
  'Allows authenticated users to view only their own roles. Prevents recursion by not checking roles within the policy.';

