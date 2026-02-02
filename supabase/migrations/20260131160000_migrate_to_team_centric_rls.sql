-- =====================================================
-- MIGRATION: Migration vers l'Architecture "Team-Centric" (V5)
-- Dousell Immo - Gestion Locative SaaS
-- Date: 2026-01-31
-- =====================================================

BEGIN;

-- =====================================================
-- 1. MISE À JOUR DU SCHÉMA : MAINTENANCE REQUESTS
-- =====================================================

-- Ajout team_id à maintenance_requests s'il manque
ALTER TABLE public.maintenance_requests 
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE;

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_team_id ON public.maintenance_requests(team_id);

-- 2. AUTO-PROVISIONING D'ÉQUIPES (DATA COMPLIANCE)
-- Pour chaque utilisateur (profile) qui n'a pas d'équipe active, en créer une.
DO $$ 
DECLARE 
    r_profile RECORD;
    new_team_id UUID;
    v_slug TEXT;
    v_team_name TEXT;
BEGIN
    FOR r_profile IN 
        SELECT id, email, full_name, company_name 
        FROM public.profiles 
        WHERE id NOT IN (SELECT user_id FROM public.team_members WHERE status = 'active')
    LOOP
        -- Déterminer le nom de l'équipe
        v_team_name := COALESCE(r_profile.company_name, 'Espace de ' || COALESCE(r_profile.full_name, split_part(r_profile.email, '@', 1)));
        v_slug := lower(regexp_replace(v_team_name, '[^a-zA-Z0-9]', '-', 'g')) || '-' || substr(r_profile.id::text, 1, 8);

        -- Créer l'équipe
        INSERT INTO public.teams (name, slug, created_by, company_email)
        VALUES (v_team_name, v_slug, r_profile.id, r_profile.email)
        RETURNING id INTO new_team_id;

        -- Ajouter l'utilisateur comme Owner
        INSERT INTO public.team_members (team_id, user_id, role, status)
        VALUES (new_team_id, r_profile.id, 'owner', 'active');
    END LOOP;
END $$;

-- 2.1 BACKFILL GLOBAL (Après provisioning)
-- On met à jour toutes les données orphelines vers l'équipe de leur propriétaire
UPDATE public.properties p SET team_id = tm.team_id FROM public.team_members tm WHERE p.owner_id = tm.user_id AND tm.role = 'owner' AND p.team_id IS NULL;
UPDATE public.leases l SET team_id = tm.team_id FROM public.team_members tm WHERE l.owner_id = tm.user_id AND tm.role = 'owner' AND l.team_id IS NULL;
UPDATE public.expenses e SET team_id = tm.team_id FROM public.team_members tm WHERE e.owner_id = tm.user_id AND tm.role = 'owner' AND e.team_id IS NULL;

-- Backfill basé sur les baux (leases) pour les transactions et maintenance
UPDATE public.rental_transactions rt SET team_id = l.team_id FROM public.leases l WHERE rt.lease_id = l.id AND rt.team_id IS NULL;
UPDATE public.maintenance_requests mr SET team_id = l.team_id FROM public.leases l WHERE mr.lease_id = l.id AND mr.team_id IS NULL;

-- Nettoyage des orphelins absolus (sans bail ou sans propriétaire valide)
DELETE FROM public.maintenance_requests WHERE team_id IS NULL;
DELETE FROM public.rental_transactions WHERE team_id IS NULL;

-- =====================================================
-- 3. MISE À JOUR DES POLITIQUES RLS (TEAM-BASED)
-- =====================================================

-- Fonction helper interne pour vérifier l'appartenance à l'équipe (Performance)
CREATE OR REPLACE FUNCTION public.is_team_member(p_team_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.team_members 
        WHERE team_id = p_team_id 
        AND user_id = auth.uid() 
        AND status = 'active'
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 3.1 LEASES
DROP POLICY IF EXISTS "Users can view their own leases" ON public.leases;
DROP POLICY IF EXISTS "Users can create their own leases" ON public.leases;
DROP POLICY IF EXISTS "Users can update their own leases" ON public.leases;
DROP POLICY IF EXISTS "Users can delete their own leases" ON public.leases;

CREATE POLICY "Team access for leases"
ON public.leases FOR ALL
USING (is_team_member(team_id))
WITH CHECK (is_team_member(team_id));

-- 3.2 RENTAL TRANSACTIONS
DROP POLICY IF EXISTS "Users can view transactions for their leases" ON public.rental_transactions;
DROP POLICY IF EXISTS "Users can create transactions for their leases" ON public.rental_transactions;
DROP POLICY IF EXISTS "Users can update transactions for their leases" ON public.rental_transactions;

CREATE POLICY "Team access for rental_transactions"
ON public.rental_transactions FOR ALL
USING (is_team_member(team_id))
WITH CHECK (is_team_member(team_id));

-- 3.3 EXPENSES
DROP POLICY IF EXISTS "Users can view own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can insert own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can update own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can delete own expenses" ON public.expenses;

CREATE POLICY "Team access for expenses"
ON public.expenses FOR ALL
USING (is_team_member(team_id))
WITH CHECK (is_team_member(team_id));

-- 3.4 MAINTENANCE REQUESTS
DROP POLICY IF EXISTS "Users can view maintenance requests for their leases" ON public.maintenance_requests;
DROP POLICY IF EXISTS "Users can create maintenance requests for their leases" ON public.maintenance_requests;
DROP POLICY IF EXISTS "Users can update maintenance requests for their leases" ON public.maintenance_requests;

CREATE POLICY "Team access for maintenance_requests"
ON public.maintenance_requests FOR ALL
USING (is_team_member(team_id))
WITH CHECK (is_team_member(team_id));

-- 3.5 PROPERTIES (UNIFICATION V5)
DROP POLICY IF EXISTS "Team members can view team properties" ON public.properties;
DROP POLICY IF EXISTS "Team owners and managers can insert properties" ON public.properties;
DROP POLICY IF EXISTS "Team owners and managers can update properties" ON public.properties;
DROP POLICY IF EXISTS "Team owners can delete properties" ON public.properties;

CREATE POLICY "Team access for properties"
ON public.properties FOR ALL
USING (is_team_member(team_id))
WITH CHECK (is_team_member(team_id));

-- =====================================================
-- 4. CONTRAINTES FINALES
-- =====================================================

-- Forcer team_id NOT NULL sur maintenance_requests après backfill
ALTER TABLE public.maintenance_requests ALTER COLUMN team_id SET NOT NULL;

COMMIT;
