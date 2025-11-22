-- Script de test pour vérifier les notifications
-- Exécutez ce script dans Supabase SQL Editor

-- 1. Vérifier que la table existe
SELECT 
  'Table notifications:' as info,
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'notifications'
ORDER BY ordinal_position;

-- 2. Vérifier que Realtime est activé
SELECT 
  'Realtime activé:' as info,
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'notifications';

-- 3. Vérifier les policies RLS
SELECT 
  'Policies RLS:' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'notifications'
ORDER BY policyname;

-- 4. Compter les notifications par utilisateur
SELECT 
  'Notifications par utilisateur:' as info,
  user_id,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_read = false) as unread,
  COUNT(*) FILTER (WHERE is_read = true) as read
FROM public.notifications
GROUP BY user_id
ORDER BY total DESC;

-- 5. Voir les dernières notifications
SELECT 
  'Dernières notifications:' as info,
  id,
  user_id,
  type,
  title,
  is_read,
  created_at
FROM public.notifications
ORDER BY created_at DESC
LIMIT 10;

