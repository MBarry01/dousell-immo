# 🔧 Fix RLS Recursion - user_roles

## 🐛 Problème

**Erreur** : `infinite recursion detected in policy for relation "user_roles"`

**Code** : `42P17`

**Cause** : Les politiques RLS sur `properties` ou `leads` vérifient les rôles via `user_roles`, mais les politiques sur `user_roles` elles-mêmes créent une récursion infinie.

## ✅ Solution

Migration SQL qui :
1. Supprime les politiques problématiques sur `user_roles`
2. Crée une fonction RPC `get_user_roles()` avec `SECURITY DEFINER` (bypass RLS)
3. Crée une fonction helper `user_has_admin_role()` pour éviter la récursion
4. Recrée des politiques simples sur `user_roles` sans récursion

## 📋 Application de la migration

### Option 1 : Via Supabase Dashboard (Recommandé)

1. Allez dans **Supabase Dashboard** → **SQL Editor**
2. Ouvrez le fichier `supabase/migrations/20250124_fix_user_roles_rls_recursion.sql`
3. Copiez tout le contenu
4. Collez dans l'éditeur SQL
5. Cliquez sur **Run**

### Option 2 : Via CLI Supabase

```bash
supabase db push
```

## 🔍 Vérification

Après avoir appliqué la migration :

1. Rechargez la page `/admin`
2. Vérifiez la console navigateur
3. Les erreurs `infinite recursion` devraient disparaître
4. Les données devraient s'afficher correctement

## 📝 Détails techniques

### Fonction `get_user_roles(UUID)`

```sql
SELECT public.get_user_roles('user-id-here');
-- Retourne: ['admin', 'superadmin']
```

**Caractéristiques** :
- `SECURITY DEFINER` : Bypass RLS
- Pas de récursion : Ne vérifie pas les rôles dans la fonction
- Utilisable dans les politiques RLS

### Fonction `user_has_admin_role(UUID)`

```sql
SELECT public.user_has_admin_role('user-id-here');
-- Retourne: true ou false
```

**Caractéristiques** :
- `SECURITY DEFINER` : Bypass RLS
- `STABLE` : Optimisé pour les requêtes répétées
- Vérifie si l'utilisateur a un rôle admin/modérateur/superadmin

### Politiques RLS sur `user_roles`

**Avant** (problématique) :
```sql
-- Créait une récursion si vérifiait les rôles dans la politique
CREATE POLICY "Admins can view all roles"
  USING (EXISTS (
    SELECT 1 FROM user_roles  -- ❌ Récursion !
    WHERE user_id = auth.uid()
    AND role = 'admin'
  ));
```

**Après** (corrigé) :
```sql
-- Simple, pas de récursion
CREATE POLICY "Users can view own roles"
  USING (auth.uid() = user_id);  -- ✅ Pas de récursion
```

## 🚨 Si le problème persiste

1. Vérifiez que la migration a bien été appliquée :
   ```sql
   SELECT proname FROM pg_proc WHERE proname = 'get_user_roles';
   -- Doit retourner: get_user_roles
   ```

2. Vérifiez les politiques existantes :
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'user_roles';
   ```

3. Vérifiez les logs Supabase :
   - Dashboard → **Logs** → **Postgres Logs**
   - Cherchez les erreurs `42P17`

4. Si nécessaire, désactivez temporairement RLS pour tester :
   ```sql
   ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
   -- Tester, puis réactiver
   ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
   ```

## 📚 Ressources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL SECURITY DEFINER](https://www.postgresql.org/docs/current/sql-createfunction.html)

