-- Migration SQL pour créer la table user_roles
-- À exécuter dans Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'moderateur', 'agent')),
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_user_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer le trigger s'il existe avant de le créer
DROP TRIGGER IF EXISTS update_user_roles_updated_at ON public.user_roles;

CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_roles_updated_at();

-- RLS (Row Level Security)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Supprimer les policies existantes si elles existent
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Policy: Les admins peuvent gérer tous les rôles
-- Cette politique permet INSERT, UPDATE, DELETE pour les admins
-- IMPORTANT: Vérifie d'abord l'email (pour le premier admin) puis le rôle
-- Utilise (SELECT auth.uid()) pour une meilleure compatibilité
CREATE POLICY "Admins can manage roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (
    (
      -- Autoriser si l'utilisateur a l'email du super-admin
      (SELECT LOWER(u.email) FROM auth.users u WHERE u.id = (SELECT auth.uid())) = 'barrymohamadou98@gmail.com'
    )
    OR
    (
      -- Ou si l'utilisateur a déjà le rôle admin dans user_roles
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = (SELECT auth.uid())
          AND ur.role = 'admin'
      )
    )
  )
  WITH CHECK (
    (
      (SELECT LOWER(u.email) FROM auth.users u WHERE u.id = (SELECT auth.uid())) = 'barrymohamadou98@gmail.com'
    )
    OR
    (
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = (SELECT auth.uid())
          AND ur.role = 'admin'
      )
    )
  );

-- Policy: Les utilisateurs peuvent voir leurs propres rôles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (user_id = auth.uid());

-- Fonction helper pour vérifier si un utilisateur a un rôle
CREATE OR REPLACE FUNCTION public.user_has_role(user_id_param UUID, role_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = user_id_param
    AND user_roles.role = role_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour récupérer les utilisateurs avec leurs rôles (accessible aux admins uniquement)
CREATE OR REPLACE FUNCTION public.get_users_with_roles()
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  roles TEXT[],
  created_at TIMESTAMP WITH TIME ZONE
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Vérifier que l'utilisateur est admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  ) AND NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND LOWER(auth.users.email) = 'barrymohamadou98@gmail.com'
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  RETURN QUERY
  SELECT 
    u.id,
    u.email::TEXT,
    COALESCE((u.raw_user_meta_data->>'full_name')::TEXT, NULL) as full_name,
    COALESCE((u.raw_user_meta_data->>'phone')::TEXT, NULL) as phone,
    COALESCE(
      ARRAY_AGG(ur.role) FILTER (WHERE ur.role IS NOT NULL),
      ARRAY[]::TEXT[]
    ) as roles,
    u.created_at
  FROM auth.users u
  LEFT JOIN public.user_roles ur ON ur.user_id = u.id
  GROUP BY u.id, u.email, u.raw_user_meta_data, u.created_at
  ORDER BY u.created_at DESC;
END;
$$;

-- Commentaires
COMMENT ON TABLE public.user_roles IS 'Table pour gérer les rôles des utilisateurs (admin, modérateur, agent)';
COMMENT ON COLUMN public.user_roles.role IS 'Rôle: admin, moderateur, agent';
COMMENT ON COLUMN public.user_roles.granted_by IS 'ID de l''utilisateur qui a accordé ce rôle';
COMMENT ON FUNCTION public.get_users_with_roles() IS 'Fonction pour récupérer les utilisateurs avec leurs rôles (admin uniquement)';

-- Initialiser le premier admin (barrymohamadou98@gmail.com) si pas déjà fait
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE LOWER(email) = 'barrymohamadou98@gmail.com'
  LIMIT 1;

  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role, granted_by)
    VALUES (admin_user_id, 'admin', admin_user_id)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;

