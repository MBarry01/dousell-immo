-- Correction des politiques RLS pour visit_requests
-- Problème : Les insertions sont bloquées malgré la politique existante

-- 1. Supprimer toutes les anciennes politiques pour repartir proprement
DROP POLICY IF EXISTS "Allow anyone to insert visit requests" ON public.visit_requests;
DROP POLICY IF EXISTS "Allow admins and moderators to view visit requests" ON public.visit_requests;
DROP POLICY IF EXISTS "Allow admins and moderators to modify visit requests" ON public.visit_requests;
DROP POLICY IF EXISTS "Allow admins and moderators to delete visit requests" ON public.visit_requests;

-- 2. Désactiver puis réactiver RLS pour s'assurer de la configuration
ALTER TABLE public.visit_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_requests ENABLE ROW LEVEL SECURITY;

-- 3. Créer une politique d'insertion PERMISSIVE pour tous (anonymes ET authentifiés)
CREATE POLICY "visit_requests_insert_policy"
  ON public.visit_requests
  FOR INSERT
  WITH CHECK (true);

-- 4. Créer une politique de lecture pour les admins/modérateurs/agents
CREATE POLICY "visit_requests_select_policy"
  ON public.visit_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'moderateur', 'superadmin', 'agent')
    )
  );

-- 5. Créer une politique de mise à jour pour les admins/modérateurs/agents
CREATE POLICY "visit_requests_update_policy"
  ON public.visit_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'moderateur', 'superadmin', 'agent')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'moderateur', 'superadmin', 'agent')
    )
  );

-- 6. Créer une politique de suppression pour les admins/superadmins uniquement
CREATE POLICY "visit_requests_delete_policy"
  ON public.visit_requests
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'superadmin')
    )
  );

-- Commentaires pour la documentation
COMMENT ON POLICY "visit_requests_insert_policy" ON public.visit_requests IS 
  'Permet à TOUS (anonymes et authentifiés) de soumettre des demandes de visite. Protégé par Turnstile côté serveur.';

COMMENT ON POLICY "visit_requests_select_policy" ON public.visit_requests IS 
  'Seuls les admins, modérateurs, agents et superadmins peuvent lire les demandes.';

COMMENT ON POLICY "visit_requests_update_policy" ON public.visit_requests IS 
  'Seuls les admins, modérateurs, agents et superadmins peuvent modifier les demandes.';

COMMENT ON POLICY "visit_requests_delete_policy" ON public.visit_requests IS 
  'Seuls les admins et superadmins peuvent supprimer les demandes.';

