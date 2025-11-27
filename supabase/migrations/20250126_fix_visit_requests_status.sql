-- Correction du statut par défaut et des valeurs autorisées pour visit_requests

-- 1. Changer le statut par défaut de 'pending' à 'nouveau'
ALTER TABLE public.visit_requests 
  ALTER COLUMN status SET DEFAULT 'nouveau';

-- 2. Mettre à jour les anciens enregistrements avec status='pending' vers 'nouveau'
UPDATE public.visit_requests 
SET status = 'nouveau' 
WHERE status = 'pending';

-- Commentaire pour documentation
COMMENT ON COLUMN public.visit_requests.status IS 
  'Statut de la demande: nouveau (non traité), contacté (en cours), clos (terminé)';

