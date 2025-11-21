# Comment appliquer la migration pour les réactions (Likes/Dislikes)

## ⚠️ Message d'erreur actuel

Si vous voyez le message **"La fonctionnalité de réactions n'est pas encore disponible. Veuillez contacter l'administrateur."**, cela signifie que la table `review_reactions` n'existe pas encore dans Supabase.

## ✅ Solution : Appliquer la migration SQL

### Étape 1 : Vérifier que la table `reviews` existe

Avant d'appliquer la migration des réactions, assurez-vous que la table `reviews` existe :

1. Aller dans **Supabase Dashboard** → **Table Editor**
2. Vérifier que la table `reviews` apparaît dans la liste

Si elle n'existe pas, appliquer d'abord la migration `20251120190915_create_reviews.sql`.

### Étape 2 : Appliquer la migration des réactions

#### Option A : Via Supabase Dashboard (Recommandé)

1. **Ouvrir Supabase Dashboard**
   - Aller sur https://supabase.com/dashboard
   - Sélectionner votre projet

2. **Ouvrir l'éditeur SQL**
   - Cliquer sur **SQL Editor** dans le menu de gauche
   - Cliquer sur **New Query**

3. **Copier la migration**
   - Ouvrir le fichier : `supabase/migrations/20251120191336_add_review_reactions.sql`
   - Copier tout le contenu (lignes 1-60)

4. **Exécuter la migration**
   - Coller le contenu dans l'éditeur SQL
   - Cliquer sur **Run** ou appuyer sur `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)
   - Vous devriez voir "Success" ou "Success. No rows returned"

5. **Vérifier la création**
   - Aller dans **Table Editor** dans le menu de gauche
   - Vérifier que la table `review_reactions` apparaît dans la liste
   - Vérifier les colonnes : `id`, `review_id`, `user_id`, `reaction_type`, `created_at`

#### Option B : Via Supabase CLI

```bash
# À la racine du projet
npx supabase db push
```

## ✅ Vérification après la migration

### 1. Dans Table Editor
- Table `review_reactions` visible
- Colonnes présentes : `id`, `review_id`, `user_id`, `reaction_type`, `created_at`

### 2. Dans SQL Editor
- Les fonctions `get_review_likes_count()` et `get_review_dislikes_count()` sont créées

### 3. Dans Authentication > Policies
- Les politiques RLS (Row Level Security) sont activées

### 4. Test fonctionnel
1. Aller sur une page de détail d'un bien avec des avis
2. Cliquer sur le bouton "Like" ou "Dislike" sous un avis
3. Vérifier que :
   - Le bouton change de couleur (active)
   - Le compteur se met à jour
   - Pas d'erreur affichée

## 🔧 Dépannage

### Erreur : "relation does not exist"
- Vérifier que la table `reviews` existe d'abord
- Appliquer la migration `20251120190915_create_reviews.sql` avant

### Erreur : "permission denied"
- Vérifier que vous êtes connecté au bon projet Supabase
- Vérifier que vous avez les droits administrateur

### Les boutons ne fonctionnent toujours pas
1. Vérifier les logs dans la console du navigateur
2. Vérifier les logs dans Supabase Dashboard → Logs
3. Vérifier que les politiques RLS sont activées
4. Vider le cache du navigateur et recharger

## 📋 Contenu de la migration

La migration crée :
- Table `review_reactions` avec les colonnes nécessaires
- Index pour améliorer les performances
- Fonctions SQL pour compter les likes/dislikes
- Politiques RLS pour la sécurité
- Contrainte unique : un utilisateur = une réaction par avis

## 📝 Note

Après avoir appliqué la migration :
- Le message d'erreur disparaîtra
- Les utilisateurs pourront liker/disliker les avis
- Les compteurs se mettront à jour automatiquement
- Les données seront synchronisées avec le serveur

