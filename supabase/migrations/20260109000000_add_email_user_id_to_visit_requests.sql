-- Migration: Ajouter email et user_id à visit_requests
-- Date: 2026-01-09
-- Description: Permet de lier les rendez-vous aux utilisateurs connectés

-- Ajouter la colonne email (optionnelle)
ALTER TABLE public.visit_requests
ADD COLUMN IF NOT EXISTS email text;

-- Ajouter la colonne user_id (optionnelle, référence vers auth.users)
ALTER TABLE public.visit_requests
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Index pour recherche par user_id
CREATE INDEX IF NOT EXISTS idx_visit_requests_user_id
ON public.visit_requests(user_id);

-- Index pour recherche par email
CREATE INDEX IF NOT EXISTS idx_visit_requests_email
ON public.visit_requests(email);

-- Politique RLS: Les utilisateurs connectés peuvent voir leurs propres rendez-vous
CREATE POLICY "visit_requests_user_view_own"
ON public.visit_requests
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Commenter les colonnes pour documentation
COMMENT ON COLUMN public.visit_requests.email IS 'Email du demandeur (optionnel, pour notifications)';
COMMENT ON COLUMN public.visit_requests.user_id IS 'ID utilisateur si connecté lors de la demande';
