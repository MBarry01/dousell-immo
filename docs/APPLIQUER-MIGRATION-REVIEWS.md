# Comment appliquer la migration pour les avis (Reviews)

## 🎯 Objectif

Créer la table `reviews` dans Supabase pour permettre aux utilisateurs de laisser des avis sur les biens.

## 📋 Étapes

### Option 1 : Via Supabase Dashboard (Recommandé)

1. **Aller dans Supabase Dashboard**
   - Ouvrir https://supabase.com/dashboard
   - Sélectionner votre projet

2. **Ouvrir l'éditeur SQL**
   - Cliquer sur **SQL Editor** dans le menu de gauche
   - Cliquer sur **New Query**

3. **Copier la migration**
   - Ouvrir le fichier `supabase/migrations/create_reviews.sql`
   - Copier tout le contenu

4. **Exécuter la migration**
   - Coller le contenu dans l'éditeur SQL
   - Cliquer sur **Run** ou appuyer sur `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

5. **Vérifier la création**
   - Aller dans **Table Editor** dans le menu de gauche
   - Vérifier que la table `reviews` apparaît dans la liste

### Option 2 : Via Supabase CLI

```bash
# Dans le terminal, à la racine du projet
supabase db push
```

Ou si vous utilisez les migrations locales :

```bash
supabase migration up
```

## ✅ Vérification

Après avoir appliqué la migration, vous devriez voir :

1. **Dans Table Editor** :
   - Table `reviews` avec les colonnes :
     - `id` (UUID)
     - `property_id` (UUID, référence à properties)
     - `user_id` (UUID, référence à auth.users)
     - `rating` (INTEGER, 1-5)
     - `comment` (TEXT)
     - `user_name` (TEXT)
     - `user_photo` (TEXT, nullable)
     - `created_at` (TIMESTAMP)
     - `updated_at` (TIMESTAMP)

2. **Dans SQL Editor** :
   - Les fonctions `get_property_average_rating()` et `get_property_reviews_count()` sont créées

3. **Dans Authentication > Policies** :
   - Les politiques RLS (Row Level Security) sont activées

## 🧪 Tester

1. **Rafraîchir la page de détail d'un bien**
   - Les erreurs dans la console devraient disparaître

2. **Laisser un avis** :
   - Se connecter avec un compte
   - Aller sur une page de détail de bien
   - Remplir le formulaire "Laisser un avis"
   - Cliquer sur "Publier l'avis"

3. **Vérifier l'affichage** :
   - L'avis devrait s'afficher immédiatement
   - La note moyenne devrait se mettre à jour

## 🔧 Dépannage

Si la migration échoue :

1. **Vérifier les permissions** :
   - Assurez-vous d'être connecté au bon projet Supabase
   - Vérifiez que vous avez les droits administrateur

2. **Vérifier les dépendances** :
   - La table `properties` doit exister
   - La table `auth.users` doit exister (gérée automatiquement par Supabase)

3. **Vérifier les logs** :
   - Regarder les messages d'erreur dans Supabase Dashboard → Logs
   - Vérifier les erreurs dans la console du navigateur

## 📝 Notes

- La migration est idempotente (peut être exécutée plusieurs fois sans problème grâce aux `IF NOT EXISTS`)
- Les politiques RLS permettent à tous de lire les avis, mais seuls les utilisateurs connectés peuvent créer/modifier/supprimer leurs propres avis
- Un utilisateur ne peut laisser qu'un seul avis par bien (contrainte unique sur `property_id` + `user_id`)

