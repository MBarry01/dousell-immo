-- Fix: Ajout de la colonne property_id manquante sur maintenance_requests
-- Date: 2026-02-04
-- Erreur: "Could not find the 'property_id' column of 'maintenance_requests'"

ALTER TABLE public.maintenance_requests
ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL;

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_property_id ON public.maintenance_requests(property_id);
