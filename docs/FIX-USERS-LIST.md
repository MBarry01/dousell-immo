# 🔧 Fix : Récupérer la liste des utilisateurs

## Problème

La page `/admin/users` n'affiche pas les utilisateurs car la fonction SQL `get_users_with_roles()` n'existe pas ou échoue.

## Solution

### Option 1 : Exécuter le script complet (Recommandé)

1. Ouvrez **Supabase Dashboard** → **SQL Editor**
2. Copiez-collez le contenu de `docs/user-roles-table-schema.sql`
3. Cliquez sur **Run** ou **Exécuter**

Ce script crée :
- ✅ La table `user_roles`
- ✅ La fonction `get_users_with_roles()` qui accède à `auth.users`
- ✅ Les politiques RLS nécessaires

### Option 2 : Exécuter uniquement la fonction

Si la table `user_roles` existe déjà :

1. Ouvrez **Supabase Dashboard** → **SQL Editor**
2. Copiez-collez le contenu de `docs/create-users-function.sql`
3. Cliquez sur **Run**

## Vérification

Après avoir exécuté le script :

1. Rafraîchissez la page `/admin/users`
2. Vous devriez voir tous vos utilisateurs (Google + Formulaire)
3. Les logs dans la console ne devraient plus afficher d'erreur

## Notes

- Les utilisateurs sont stockés dans `auth.users` (table système Supabase)
- On ne peut pas accéder directement à `auth.users` avec le client Supabase standard
- La fonction SQL `get_users_with_roles()` utilise `SECURITY DEFINER` pour contourner cette limitation
- La fonction vérifie que vous êtes admin avant de retourner les données

