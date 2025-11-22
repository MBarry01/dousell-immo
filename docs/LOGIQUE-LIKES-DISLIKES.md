# Logique du système de Likes/Dislikes

## 🔄 Architecture

### 1. **Base de données (Supabase)**

#### Table `review_reactions`
```sql
CREATE TABLE public.review_reactions (
  id UUID PRIMARY KEY,
  review_id UUID REFERENCES reviews(id),
  user_id UUID REFERENCES auth.users(id),
  reaction_type TEXT CHECK (reaction_type IN ('like', 'dislike')),
  created_at TIMESTAMP,
  UNIQUE(review_id, user_id) -- Un utilisateur = une réaction par avis
);
```

#### Politiques RLS (Row Level Security)
- **SELECT** : Tout le monde peut lire les réactions
- **INSERT** : Les utilisateurs authentifiés peuvent créer leurs propres réactions
- **UPDATE** : Les utilisateurs peuvent modifier leurs propres réactions
- **DELETE** : Les utilisateurs peuvent supprimer leurs propres réactions

### 2. **Services**

#### `reviewReactionService.ts` (Server Action)
- `toggleReviewReaction(reviewId, reactionType)` : Gère les réactions
  - Vérifie l'authentification
  - Vérifie l'existence de l'avis
  - Récupère la réaction existante de l'utilisateur
  - **Logique** :
    - Si même réaction → Supprime la réaction
    - Si réaction différente → Met à jour la réaction
    - Si pas de réaction → Crée une nouvelle réaction
  - Revalide la page après succès

#### `reviewService.ts` (Server Function)
- `getPropertyReviews(propertyId, currentUserId)` : Récupère les avis avec leurs stats
  - Récupère tous les avis du bien
  - Récupère toutes les réactions pour ces avis
  - Compte les likes/dislikes pour chaque avis
  - Identifie la réaction de l'utilisateur courant
  - Combine les données pour retourner des `Review` avec stats

### 3. **Composants**

#### `ReviewItem.tsx` (Client Component)
- Affiche un avis avec ses informations
- Boutons Like/Dislike avec compteurs
- **Optimistic Updates** : Met à jour l'UI immédiatement
- **Rollback** : Annule les changements en cas d'erreur
- **Synchronisation** : Rafraîchit la page après succès

## 🎯 Logique de fonctionnement

### Scénario 1 : Utilisateur clique sur Like (première fois)
1. **Client** : Optimistic update → `likes_count + 1`, `user_reaction = "like"`
2. **Serveur** : 
   - Vérifie authentification
   - Vérifie existence de l'avis
   - Vérifie si réaction existe (non)
   - Crée nouvelle réaction `INSERT INTO review_reactions`
   - Revalide la page
3. **Client** : Reçoit succès → Rafraîchit la page pour synchroniser

### Scénario 2 : Utilisateur clique sur Like (déjà liké)
1. **Client** : Optimistic update → `likes_count - 1`, `user_reaction = null`
2. **Serveur** :
   - Vérifie authentification
   - Récupère réaction existante (trouve "like")
   - Supprime la réaction `DELETE FROM review_reactions`
   - Revalide la page
3. **Client** : Reçoit succès → Rafraîchit la page

### Scénario 3 : Utilisateur clique sur Dislike (déjà liké)
1. **Client** : Optimistic update → `likes_count - 1`, `dislikes_count + 1`, `user_reaction = "dislike"`
2. **Serveur** :
   - Vérifie authentification
   - Récupère réaction existante (trouve "like")
   - Met à jour la réaction `UPDATE review_reactions SET reaction_type = "dislike"`
   - Revalide la page
3. **Client** : Reçoit succès → Rafraîchit la page

### Scénario 4 : Erreur (table n'existe pas)
1. **Client** : Optimistic update → Met à jour l'UI
2. **Serveur** :
   - Détecte que la table n'existe pas (code PGRST205)
   - Retourne erreur avec message informatif
3. **Client** : 
   - Reçoit erreur → Rollback (annule les changements)
   - Affiche message d'erreur à l'utilisateur

## 🔒 Sécurité

### Authentification
- Seuls les utilisateurs authentifiés peuvent réagir
- Vérification via `auth.uid()` dans les politiques RLS

### Validation
- Vérification que l'avis existe avant de créer une réaction
- Vérification que l'utilisateur est propriétaire de la réaction avant modification/suppression
- Contrainte unique : un utilisateur = une réaction par avis

### Gestion d'erreurs
- Détection de table inexistante
- Messages d'erreur informatifs
- Rollback des changements en cas d'erreur
- Logging des erreurs pour debugging

## 📊 Flux de données

```
[Client] ReviewItem Component
    ↓ (click like/dislike)
    ↓ Optimistic Update (UI immédiate)
    ↓
[Server] toggleReviewReaction Server Action
    ↓ (vérifie auth, avis, réaction existante)
    ↓
[Database] Supabase review_reactions table
    ↓ (INSERT/UPDATE/DELETE)
    ↓
[Server] revalidatePath (refresh cache)
    ↓
[Client] router.refresh() (synchronise avec serveur)
    ↓
[Server] getPropertyReviews (récupère données à jour)
    ↓
[Client] Affiche données synchronisées
```

## 🚀 Performance

### Optimistic Updates
- L'UI se met à jour immédiatement (pas d'attente serveur)
- Meilleure expérience utilisateur

### Revalidation
- Utilise `revalidatePath` de Next.js pour mettre à jour le cache
- Évite les requêtes inutiles

### Rollback
- Annule les changements en cas d'erreur
- État cohérent même en cas d'échec

## 🛠️ Maintenance

### Pour ajouter de nouvelles réactions
1. Modifier le type `ReactionType` dans `reviewReactionService.ts`
2. Modifier la contrainte CHECK dans la migration SQL
3. Mettre à jour la logique de comptage dans `reviewService.ts`
4. Ajouter le bouton dans `ReviewItem.tsx`

### Pour déboguer
1. Vérifier les logs serveur pour les erreurs Supabase
2. Vérifier que la table `review_reactions` existe
3. Vérifier les politiques RLS dans Supabase Dashboard
4. Vérifier l'authentification de l'utilisateur


