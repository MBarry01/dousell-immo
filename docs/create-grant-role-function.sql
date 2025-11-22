-- Fonction SQL pour accorder un rôle (bypass RLS)
-- Cette fonction utilise SECURITY DEFINER pour contourner les politiques RLS

CREATE OR REPLACE FUNCTION public.grant_user_role(
  target_user_id UUID,
  role_to_grant TEXT
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
DECLARE
  current_user_id UUID;
  current_user_email TEXT;
BEGIN
  -- Récupérer l'utilisateur actuel
  current_user_id := auth.uid();
  
  -- Vérifier que l'utilisateur est admin
  SELECT LOWER(email) INTO current_user_email
  FROM auth.users
  WHERE id = current_user_id;
  
  IF current_user_email != 'barrymohamadou98@gmail.com' THEN
    -- Vérifier aussi via user_roles
    IF NOT EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = current_user_id
      AND role = 'admin'
    ) THEN
      RAISE EXCEPTION 'Access denied. Admin role required.';
    END IF;
  END IF;
  
  -- Insérer le rôle (bypass RLS grâce à SECURITY DEFINER)
  INSERT INTO public.user_roles (user_id, role, granted_by)
  VALUES (target_user_id, role_to_grant, current_user_id)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN TRUE;
END;
$$;

-- Fonction pour retirer un rôle
CREATE OR REPLACE FUNCTION public.revoke_user_role(
  target_user_id UUID,
  role_to_revoke TEXT
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
DECLARE
  current_user_id UUID;
  current_user_email TEXT;
BEGIN
  -- Récupérer l'utilisateur actuel
  current_user_id := auth.uid();
  
  -- Vérifier que l'utilisateur est admin
  SELECT LOWER(email) INTO current_user_email
  FROM auth.users
  WHERE id = current_user_id;
  
  IF current_user_email != 'barrymohamadou98@gmail.com' THEN
    -- Vérifier aussi via user_roles
    IF NOT EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = current_user_id
      AND role = 'admin'
    ) THEN
      RAISE EXCEPTION 'Access denied. Admin role required.';
    END IF;
  END IF;
  
  -- Supprimer le rôle (bypass RLS grâce à SECURITY DEFINER)
  DELETE FROM public.user_roles
  WHERE user_id = target_user_id
  AND role = role_to_revoke;
  
  RETURN TRUE;
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION public.grant_user_role(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_user_role(UUID, TEXT) TO authenticated;

