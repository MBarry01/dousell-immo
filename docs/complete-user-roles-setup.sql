-- ============================================================================
-- SCRIPT COMPLET : Configuration user_roles avec audit et fonctions SECURITY DEFINER
-- À exécuter dans Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. Contrainte UNIQUE sur (user_id, role) si elle n'existe pas
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE c.contype = 'u'
      AND n.nspname = 'public'
      AND t.relname = 'user_roles'
      AND array_to_string(ARRAY(
        SELECT attname FROM unnest(c.conkey) i
        JOIN pg_attribute a ON a.attnum = i AND a.attrelid = t.oid
        ORDER BY a.attnum
      ), ',') = 'user_id,role'
  ) THEN
    ALTER TABLE public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);
  END IF;
END
$$;

-- ============================================================================
-- 2. Ajouter 'superadmin' au CHECK constraint sur role
-- ============================================================================
DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT con.conname INTO constraint_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE nsp.nspname = 'public'
    AND rel.relname = 'user_roles'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) LIKE '%role = ANY%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.user_roles DROP CONSTRAINT %I', constraint_name);
  END IF;

  -- Recréer le CHECK avec 'superadmin'
  ALTER TABLE public.user_roles
    ADD CONSTRAINT user_roles_role_check CHECK (
      role = ANY (ARRAY['admin'::text, 'moderateur'::text, 'agent'::text, 'superadmin'::text])
    );
END
$$;

-- ============================================================================
-- 3. Table d'audit pour enregistrer les grants/revokes
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_roles_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_role_id uuid NULL,
  target_user uuid NOT NULL,
  role text NOT NULL,
  action text NOT NULL CHECK (action IN ('grant', 'revoke', 'update')),
  performed_by uuid NULL,
  performed_at timestamptz DEFAULT now(),
  details jsonb DEFAULT '{}'::jsonb
);

-- Index pour l'audit
CREATE INDEX IF NOT EXISTS idx_user_roles_audit_target_user ON public.user_roles_audit(target_user);
CREATE INDEX IF NOT EXISTS idx_user_roles_audit_performed_at ON public.user_roles_audit(performed_at DESC);

-- Trigger function pour l'audit
CREATE OR REPLACE FUNCTION public.user_roles_audit_trigger()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.user_roles_audit(user_role_id, target_user, role, action, performed_by, details)
    VALUES (NEW.id, NEW.user_id, NEW.role, 'grant', NEW.granted_by, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.user_roles_audit(user_role_id, target_user, role, action, performed_by, details)
    VALUES (OLD.id, OLD.user_id, OLD.role, 'revoke', OLD.granted_by, to_jsonb(OLD));
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.user_roles_audit(user_role_id, target_user, role, action, performed_by, details)
    VALUES (NEW.id, NEW.user_id, NEW.role, 'update', NEW.granted_by, jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW)));
    RETURN NEW;
  END IF;
END;
$$;

-- Attacher le trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' AND c.relname = 'user_roles' AND t.tgname = 'user_roles_audit_trigger'
  ) THEN
    CREATE TRIGGER user_roles_audit_trigger
      AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
      FOR EACH ROW EXECUTE FUNCTION public.user_roles_audit_trigger();
  END IF;
END
$$;

-- ============================================================================
-- 4. Trigger pour mettre à jour updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION public.set_timestamp_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' AND c.relname = 'user_roles' AND t.tgname = 'user_roles_set_updated_at'
  ) THEN
    CREATE TRIGGER user_roles_set_updated_at
      BEFORE UPDATE ON public.user_roles
      FOR EACH ROW EXECUTE FUNCTION public.set_timestamp_updated_at();
  END IF;
END
$$;

-- ============================================================================
-- 5. Fonctions SECURITY DEFINER pour grant/revoke (bypass RLS)
-- ============================================================================

-- Fonction helper pour vérifier si un utilisateur est superadmin ou admin
CREATE OR REPLACE FUNCTION public.is_superadmin_or_admin(u uuid)
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = u AND ur.role IN ('superadmin', 'admin')
  )
  OR EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = u AND LOWER(email) = 'barrymohamadou98@gmail.com'
  );
$$;

-- Fonction pour accorder un rôle (bypass RLS)
CREATE OR REPLACE FUNCTION public.grant_role(target_user uuid, role text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER 
SET search_path = public, auth
AS $$
DECLARE
  caller uuid;
BEGIN
  -- Récupérer l'utilisateur appelant
  SELECT (auth.uid())::uuid INTO caller;

  -- Vérification de sécurité : doit être superadmin, admin, ou barrymohamadou98@gmail.com
  IF caller IS NOT NULL AND NOT public.is_superadmin_or_admin(caller) THEN
    RAISE EXCEPTION 'permission denied: must be superadmin, admin, or barrymohamadou98@gmail.com';
  END IF;

  -- Insérer le rôle si n'existe pas
  INSERT INTO public.user_roles(user_id, role, granted_by)
  VALUES (target_user, role, caller)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- L'audit est géré par le trigger automatiquement
END;
$$;

-- Fonction pour retirer un rôle (bypass RLS)
CREATE OR REPLACE FUNCTION public.revoke_role(target_user uuid, role text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER 
SET search_path = public, auth
AS $$
DECLARE
  caller uuid;
  ur_id uuid;
BEGIN
  -- Récupérer l'utilisateur appelant
  SELECT (auth.uid())::uuid INTO caller;

  -- Vérification de sécurité
  IF caller IS NOT NULL AND NOT public.is_superadmin_or_admin(caller) THEN
    RAISE EXCEPTION 'permission denied: must be superadmin, admin, or barrymohamadou98@gmail.com';
  END IF;

  -- Récupérer l'ID du rôle à supprimer
  SELECT id INTO ur_id 
  FROM public.user_roles 
  WHERE user_id = target_user AND role = role 
  LIMIT 1;

  -- Supprimer le rôle
  IF ur_id IS NOT NULL THEN
    DELETE FROM public.user_roles WHERE id = ur_id;
    -- L'audit est géré par le trigger automatiquement
  END IF;
END;
$$;

-- Permissions : permettre aux utilisateurs authentifiés d'exécuter
GRANT EXECUTE ON FUNCTION public.grant_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_superadmin_or_admin(uuid) TO authenticated;

-- ============================================================================
-- 6. Politiques RLS mises à jour
-- ============================================================================

-- S'assurer que RLS est activé
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_select_own" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_select_superadmin" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_service_full_access" ON public.user_roles;

-- Politique : Les utilisateurs peuvent voir leurs propres rôles
CREATE POLICY "user_roles_select_own" ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Politique : Les superadmins/admins peuvent voir tous les rôles
CREATE POLICY "user_roles_select_admin" ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur2
      WHERE ur2.user_id = (SELECT auth.uid()) 
      AND ur2.role IN ('superadmin', 'admin')
    )
    OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = (SELECT auth.uid())
      AND LOWER(email) = 'barrymohamadou98@gmail.com'
    )
  );

-- Note: Les INSERT/UPDATE/DELETE sont gérés par les fonctions SECURITY DEFINER
-- qui bypassent RLS. Pas besoin de politiques pour ces opérations.

-- ============================================================================
-- 7. Indexes pour les performances
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles (role);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role ON public.user_roles (user_id, role);

-- ============================================================================
-- 8. Accorder le rôle admin à barrymohamadou98@gmail.com
-- ============================================================================
INSERT INTO public.user_roles (user_id, role, granted_by)
SELECT 
  u.id,
  'admin',
  u.id
FROM auth.users u
WHERE LOWER(u.email) = 'barrymohamadou98@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- ============================================================================
-- 9. Vérification finale
-- ============================================================================
SELECT 
  'Politiques RLS créées:' as info,
  COUNT(*) as count
FROM pg_policies 
WHERE tablename = 'user_roles';

SELECT 
  'Fonctions créées:' as info,
  COUNT(*) as count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN ('grant_role', 'revoke_role', 'is_superadmin_or_admin');

SELECT 
  'Rôle admin accordé à:' as info,
  u.email,
  ur.role,
  ur.created_at
FROM public.user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE LOWER(u.email) = 'barrymohamadou98@gmail.com'
AND ur.role = 'admin';

