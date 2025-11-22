-- Migration SQL pour créer la table leads
-- À exécuter dans Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  project_type TEXT NOT NULL, -- 'achat' ou 'location'
  availability TEXT, -- 'semaine-matin', 'semaine-apres-midi', 'weekend'
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'nouveau', -- 'nouveau', 'contacté', 'clos'
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  source TEXT, -- 'planifier-visite', 'contact', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ajouter la colonne source si elle n'existe pas (pour les tables existantes)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'leads' 
    AND column_name = 'source'
  ) THEN
    ALTER TABLE public.leads ADD COLUMN source TEXT;
  END IF;
END $$;

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_property_id ON public.leads(property_id);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) - Permettre la lecture/écriture pour les admins
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Supprimer les policies existantes si elles existent (pour éviter les erreurs)
DROP POLICY IF EXISTS "Admins can manage leads" ON public.leads;
DROP POLICY IF EXISTS "Anyone can create leads" ON public.leads;

-- Policy: Les admins peuvent tout faire (basé sur les rôles ou email fallback)
CREATE POLICY "Admins can manage leads"
  ON public.leads
  FOR ALL
  USING (
    -- Vérifier via les rôles
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
    OR
    -- Fallback sur l'email pour compatibilité
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND LOWER(auth.users.email) = 'barrymohamadou98@gmail.com'
    )
  );

-- Policy: Tout le monde peut créer des leads (pour le formulaire public)
CREATE POLICY "Anyone can create leads"
  ON public.leads
  FOR INSERT
  WITH CHECK (true);

-- Commentaires
COMMENT ON TABLE public.leads IS 'Table pour gérer les demandes de contact (CRM léger)';
COMMENT ON COLUMN public.leads.status IS 'Statut du lead: nouveau, contacté, clos';
COMMENT ON COLUMN public.leads.source IS 'Source du lead: planifier-visite, contact, etc.';

