-- Enable RLS on visit_requests table
-- This allows public submissions while keeping data confidential

-- 1. Enable RLS
ALTER TABLE public.visit_requests ENABLE ROW LEVEL SECURITY;

-- 2. Allow anyone (anonymous or authenticated) to insert visit requests
CREATE POLICY "Allow anyone to insert visit requests"
  ON public.visit_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 3. Allow admins and moderators to view visit requests
CREATE POLICY "Allow admins and moderators to view visit requests"
  ON public.visit_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'moderateur', 'superadmin')
    )
  );

-- 4. Allow admins and moderators to update visit requests
CREATE POLICY "Allow admins and moderators to modify visit requests"
  ON public.visit_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'moderateur', 'superadmin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'moderateur', 'superadmin')
    )
  );

-- 5. Allow admins and moderators to delete visit requests
CREATE POLICY "Allow admins and moderators to delete visit requests"
  ON public.visit_requests
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'moderateur', 'superadmin')
    )
  );

-- Comments for documentation
COMMENT ON POLICY "Allow anyone to insert visit requests" ON public.visit_requests IS 
  'Permet aux visiteurs anonymes et authentifiés de soumettre des demandes de visite. Protégé par Turnstile côté client.';

COMMENT ON POLICY "Allow admins and moderators to view visit requests" ON public.visit_requests IS 
  'Seuls les admins, modérateurs et superadmins peuvent voir les demandes de visite.';

