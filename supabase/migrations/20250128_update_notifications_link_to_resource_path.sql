-- Migration: Renommer la colonne link en resource_path
-- Date: 2025-01-28

-- Vérifier si la colonne link existe et la renommer
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications' 
    AND column_name = 'link'
  ) THEN
    ALTER TABLE public.notifications RENAME COLUMN link TO resource_path;
  END IF;
END $$;

