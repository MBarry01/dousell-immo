-- Migration: Création de la table profiles et trigger automatique
-- Date: 2025-01-XX
-- Description: Système de profils publics pour afficher les informations des propriétaires

-- 1. Création de la table profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'particulier' CHECK (role IN ('particulier', 'agent', 'admin')),
  phone TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);

-- 3. RLS (Row Level Security) - Permettre la lecture publique des profils
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Politique : Tout le monde peut lire les profils (pour afficher les infos des propriétaires)
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles
  FOR SELECT
  USING (true);

-- Politique : Les utilisateurs peuvent mettre à jour leur propre profil
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Politique : Les utilisateurs peuvent insérer leur propre profil
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 4. Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 5. Fonction pour créer automatiquement un profil lors de la création d'un user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::text, 'particulier')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger pour créer automatiquement un profil
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 7. Mise à jour de la table properties pour référencer profiles au lieu de auth.users
-- D'abord, on vérifie si owner_id existe et on le modifie si nécessaire
DO $$
BEGIN
  -- Si owner_id référence auth.users, on doit le modifier pour référencer profiles
  -- Mais d'abord, on s'assure que tous les users ont un profil
  INSERT INTO public.profiles (id, full_name, phone, role)
  SELECT 
    u.id,
    COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', ''),
    COALESCE(u.raw_user_meta_data->>'phone', ''),
    COALESCE((u.raw_user_meta_data->>'role')::text, 'particulier')
  FROM auth.users u
  WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = u.id
  )
  ON CONFLICT (id) DO NOTHING;
END $$;

-- 8. Modification de la contrainte owner_id pour référencer profiles
-- On supprime l'ancienne contrainte si elle existe
ALTER TABLE properties
  DROP CONSTRAINT IF EXISTS properties_owner_id_fkey;

-- On ajoute la nouvelle contrainte qui référence profiles
ALTER TABLE properties
  ADD CONSTRAINT properties_owner_id_fkey
  FOREIGN KEY (owner_id)
  REFERENCES public.profiles(id)
  ON DELETE SET NULL;

-- 9. Commentaires pour documentation
COMMENT ON TABLE public.profiles IS 'Profils publics des utilisateurs (propriétaires, agents, admins)';
COMMENT ON COLUMN public.profiles.id IS 'ID de l''utilisateur (référence auth.users)';
COMMENT ON COLUMN public.profiles.full_name IS 'Nom complet de l''utilisateur';
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL de l''avatar (stockage Supabase)';
COMMENT ON COLUMN public.profiles.role IS 'Rôle: particulier, agent, ou admin';
COMMENT ON COLUMN public.profiles.phone IS 'Numéro de téléphone';
COMMENT ON COLUMN public.profiles.is_verified IS 'Indique si le profil est vérifié';










