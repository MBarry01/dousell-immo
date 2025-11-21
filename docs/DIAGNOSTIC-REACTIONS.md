# Diagnostic du système de réactions (Likes/Dislikes)

## ⚠️ Message d'erreur actuel

Si vous voyez : **"La fonctionnalité de réactions n'est pas encore disponible. Veuillez contacter l'administrateur."**

Cela signifie que la table `review_reactions` n'existe **probablement pas encore** dans Supabase.

## 🔍 Vérification rapide

### Étape 1 : Vérifier si la table existe

1. **Ouvrir Supabase Dashboard**
   - Aller sur https://supabase.com/dashboard
   - Sélectionner votre projet

2. **Aller dans Table Editor**
   - Menu de gauche → **Table Editor**
   - Regarder dans la liste des tables

3. **Vérifier**
   - ✅ Si vous voyez `review_reactions` → La table existe, le problème est ailleurs
   - ❌ Si vous ne la voyez pas → Appliquer la migration (voir Étape 2)

### Étape 2 : Appliquer la migration (si la table n'existe pas)

1. **Ouvrir SQL Editor**
   - Menu de gauche → **SQL Editor**
   - Cliquer sur **New Query**

2. **Copier-coller la migration**
   - Ouvrir le fichier : `supabase/migrations/20251120191336_add_review_reactions.sql`
   - Copier **TOUT** le contenu (80 lignes)
   - Coller dans l'éditeur SQL

3. **Exécuter**
   - Cliquer sur **Run** ou `Ctrl+Enter`
   - Attendre le message "Success"

4. **Vérifier à nouveau**
   - Revenir dans **Table Editor**
   - La table `review_reactions` doit maintenant apparaître

### Étape 3 : Vérifier avec le script SQL

Utiliser le script de diagnostic dans `scripts/check-reactions-table.sql` :

1. **Ouvrir SQL Editor**
2. **Copier-coller le contenu** de `scripts/check-reactions-table.sql`
3. **Exécuter**
4. **Vérifier les résultats** :
   - `table_exists` doit être `true`
   - Les colonnes doivent être : `id`, `review_id`, `user_id`, `reaction_type`, `created_at`
   - Les politiques RLS doivent être actives (4 politiques)

## 🐛 Dépannage détaillé

### Problème 1 : La table n'existe pas

**Solution** : Appliquer la migration (voir Étape 2 ci-dessus)

**Vérification** :
```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'review_reactions'
);
```

Si retourne `false`, la table n'existe pas.

### Problème 2 : La table existe mais les politiques RLS bloquent

**Vérification** :
```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'review_reactions';
```

Vous devriez voir 4 politiques :
- `Review reactions are viewable by everyone` (SELECT)
- `Users can create their own reactions` (INSERT)
- `Users can update their own reactions` (UPDATE)
- `Users can delete their own reactions` (DELETE)

**Solution** : Si des politiques manquent, réexécuter la migration.

### Problème 3 : Erreur de permissions

**Vérification** :
- Vérifier que vous êtes connecté (utilisateur authentifié)
- Vérifier que l'utilisateur a bien un `user_id` valide
- Vérifier les logs dans Supabase Dashboard → Logs

### Problème 4 : La table `reviews` n'existe pas

**Vérification** :
```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'reviews'
);
```

**Solution** : Si `reviews` n'existe pas, appliquer d'abord `20251120190915_create_reviews.sql`

## 📋 Checklist complète

- [ ] La table `reviews` existe dans Supabase
- [ ] La table `review_reactions` existe dans Supabase
- [ ] Les colonnes sont correctes : `id`, `review_id`, `user_id`, `reaction_type`, `created_at`
- [ ] Les index sont créés : `idx_review_reactions_review_id`, `idx_review_reactions_user_id`, `idx_review_reactions_type`
- [ ] Les politiques RLS sont actives (4 politiques)
- [ ] Les fonctions SQL existent : `get_review_likes_count()`, `get_review_dislikes_count()`
- [ ] L'utilisateur est authentifié (connecté)
- [ ] Les variables d'environnement Supabase sont correctes

## 🔧 Commandes SQL utiles

### Vérifier la structure de la table
```sql
\d public.review_reactions
```

### Vérifier les contraintes
```sql
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public' 
AND table_name = 'review_reactions';
```

### Tester une insertion manuelle (avec votre user_id)
```sql
INSERT INTO public.review_reactions (review_id, user_id, reaction_type)
VALUES ('<review_id>', '<user_id>', 'like')
RETURNING *;
```

### Voir les réactions existantes
```sql
SELECT * FROM public.review_reactions LIMIT 10;
```

## 🆘 Si le problème persiste

1. **Vérifier les logs serveur**
   - Console du navigateur (F12)
   - Supabase Dashboard → Logs

2. **Vérifier les erreurs Supabase**
   - Regarder le message d'erreur exact
   - Code d'erreur (PGRST205, etc.)

3. **Tester avec curl ou Postman**
   - Appeler directement l'API Supabase
   - Vérifier les permissions

4. **Contacter le support**
   - Fournir les logs d'erreur
   - Fournir la structure de la table

