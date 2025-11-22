# Création des tables pour les alertes

Ce guide explique comment créer les tables nécessaires pour le système d'alertes et de préférences de notifications.

## 📋 Tables à créer

1. **`search_alerts`** : Stocke les alertes de recherche créées par les utilisateurs
2. **`notification_preferences`** : Stocke les préférences de notifications de chaque utilisateur

## 🚀 Instructions

### Option 1 : Via le Dashboard Supabase (Recommandé)

1. Allez sur [supabase.com](https://supabase.com) et connectez-vous à votre projet
2. Cliquez sur **SQL Editor** dans la barre latérale
3. Cliquez sur **New Query**
4. Copiez-collez le contenu du fichier `docs/supabase-migrations/create-alerts-tables.sql`
5. Cliquez sur **Run** (ou appuyez sur `Ctrl/Cmd + Enter`)
6. Vérifiez que les tables ont été créées dans **Table Editor**

### Option 2 : Via la ligne de commande (psql)

```bash
# Connectez-vous à votre base de données Supabase
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Exécutez le script
\i docs/supabase-migrations/create-alerts-tables.sql
```

## ✅ Vérification

Après avoir exécuté le script, vérifiez que :

1. ✅ La table `search_alerts` existe avec les colonnes suivantes :
   - `id` (UUID, Primary Key)
   - `user_id` (UUID, Foreign Key vers auth.users)
   - `name` (TEXT)
   - `filters` (JSONB)
   - `is_active` (BOOLEAN)
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)

2. ✅ La table `notification_preferences` existe avec les colonnes suivantes :
   - `id` (UUID, Primary Key)
   - `user_id` (UUID, Unique, Foreign Key vers auth.users)
   - `preferences` (JSONB)
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)

3. ✅ Les index ont été créés :
   - `idx_search_alerts_user_id`
   - `idx_search_alerts_user_active`
   - `idx_search_alerts_created_at`
   - `idx_notification_preferences_user_id`

4. ✅ Les politiques RLS (Row Level Security) sont actives :
   - Les utilisateurs ne peuvent voir/modifier que leurs propres données

## 🔒 Sécurité (RLS)

Les politiques Row Level Security garantissent que :
- ✅ Chaque utilisateur ne peut voir que ses propres alertes et préférences
- ✅ Chaque utilisateur ne peut créer/modifier/supprimer que ses propres données
- ✅ Les données sont automatiquement filtrées par `auth.uid()`

## 📝 Notes importantes

- Les tables utilisent `ON DELETE CASCADE` : si un utilisateur est supprimé, ses alertes et préférences sont automatiquement supprimées
- Le trigger `updated_at` met automatiquement à jour le champ `updated_at` à chaque modification
- Les valeurs par défaut des préférences sont : toutes les notifications activées (`true`)

## 🐛 Dépannage

Si vous rencontrez une erreur :

1. **Erreur "relation already exists"** : Les tables existent déjà. Vous pouvez les supprimer et réexécuter le script si nécessaire.

2. **Erreur "permission denied"** : Assurez-vous d'être connecté en tant qu'administrateur ou avec les bonnes permissions.

3. **Erreur "function does not exist"** : Vérifiez que l'extension `uuid-ossp` est activée :
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```

## 📚 Prochaines étapes

Une fois les tables créées :
1. Testez la création d'une alerte depuis la page `/recherche?alert=create`
2. Testez la modification des préférences depuis `/compte/alertes`
3. Vérifiez que les données sont bien sauvegardées dans Supabase

