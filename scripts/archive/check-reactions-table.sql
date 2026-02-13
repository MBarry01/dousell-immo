-- Script de vérification de la table review_reactions
-- Exécuter ce script dans Supabase Dashboard → SQL Editor pour vérifier si la table existe

-- Vérifier si la table existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'review_reactions'
) AS table_exists;

-- Si la table existe, afficher sa structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'review_reactions'
ORDER BY ordinal_position;

-- Vérifier les index
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
AND tablename = 'review_reactions';

-- Vérifier les politiques RLS
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'review_reactions';

-- Compter les réactions existantes (si la table existe)
SELECT 
  COUNT(*) as total_reactions,
  COUNT(*) FILTER (WHERE reaction_type = 'like') as total_likes,
  COUNT(*) FILTER (WHERE reaction_type = 'dislike') as total_dislikes
FROM public.review_reactions;

