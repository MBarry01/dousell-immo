# 🧪 Tester les Notifications

## ✅ Checklist de vérification

### 1. Vérifier que vous êtes connecté en tant qu'admin

1. Allez sur la page d'accueil (`/`)
2. Vérifiez que vous voyez la cloche de notifications en haut à droite (mobile) ou dans le header (desktop)
3. Si vous ne voyez pas la cloche → Vous n'êtes pas connecté ou vous n'êtes pas l'admin

### 2. Vérifier les logs dans la console navigateur

1. Ouvrez DevTools (F12) → Console
2. Rechargez la page d'accueil
3. Vous devriez voir :
   ```
   🔍 Récupération des notifications pour userId: [votre-uuid]
   ✅ Notifications récupérées: X notifications
   📊 Notifications non lues: X
   🔔 NotificationBell - userId: [uuid] unreadCount: X notifications: X
   ```

### 3. Tester le dépôt d'une annonce

**Étape 1 : Déposer une annonce**
1. Connectez-vous avec un compte utilisateur (pas admin)
2. Allez sur `/compte/deposer`
3. Remplissez le formulaire et déposez une annonce

**Étape 2 : Vérifier les logs serveur**
Regardez la console du serveur Next.js, vous devriez voir :
```
📬 Tentative d'envoi de notification à l'admin...
🔍 Recherche de l'admin avec l'email: barrymohamadou98@gmail.com
✅ Admin trouvé via...
📝 Création de la notification pour l'admin: [uuid]
✅ Notification créée avec succès: [notification-id]
📧 Tentative d'envoi d'email à l'admin: barrymohamadou98@gmail.com
✅ Email admin envoyé avec succès
```

**Étape 3 : Vérifier la notification**
1. Connectez-vous en tant qu'admin (`barrymohamadou98@gmail.com`)
2. Allez sur la page d'accueil (`/`)
3. Regardez la cloche de notifications en haut à droite
4. Vous devriez voir un badge rouge avec le nombre de notifications non lues
5. Cliquez sur la cloche pour voir la liste des notifications

### 4. Vérifier dans Supabase

**Vérifier que la notification existe :**

1. Allez dans Supabase Dashboard → Table Editor → `notifications`
2. Vous devriez voir une notification avec :
   - `user_id` = UUID de l'admin
   - `type` = 'info'
   - `title` = "Nouvelle annonce en attente"
   - `is_read` = false
   - `resource_path` = "/admin/moderation?property=..."

### 5. Problèmes courants

#### ❌ La cloche n'apparaît pas

**Causes possibles :**
- Vous n'êtes pas connecté → Connectez-vous
- Vous n'êtes pas l'admin → Connectez-vous avec `barrymohamadou98@gmail.com`
- Le Header n'est pas visible → Vérifiez que vous êtes sur la page d'accueil

**Solution :**
1. Vérifiez que vous êtes connecté : `/compte`
2. Vérifiez votre email : Il doit être `barrymohamadou98@gmail.com`
3. Rechargez la page

#### ❌ Le badge ne s'affiche pas même s'il y a des notifications

**Causes possibles :**
- Les notifications ne sont pas récupérées
- Le `unreadCount` est à 0

**Solution :**
1. Ouvrez la console navigateur (F12)
2. Regardez les logs : `🔔 NotificationBell - userId: ... unreadCount: ...`
3. Si `unreadCount` est 0 mais qu'il y a des notifications dans Supabase :
   - Vérifiez que `is_read` = false dans Supabase
   - Vérifiez que `user_id` correspond à votre UUID admin

#### ❌ Les notifications ne sont pas créées

**Causes possibles :**
- La fonction `notifyAdmin` échoue
- L'admin n'est pas trouvé

**Solution :**
1. Regardez les logs serveur lors du dépôt d'une annonce
2. Si vous voyez "Admin user not found" :
   - Ajoutez `NEXT_PUBLIC_ADMIN_ID` dans `.env.local`
   - Ou appliquez la migration `20250128_get_admin_user_id.sql`
3. Si vous voyez une erreur SQL :
   - Vérifiez que la table `notifications` existe
   - Appliquez la migration `20250128_create_notifications.sql`

### 6. Test manuel rapide

Pour créer une notification de test directement dans Supabase :

1. Trouvez votre UUID admin dans Supabase Dashboard → Authentication → Users
2. Allez dans SQL Editor et exécutez :

```sql
INSERT INTO public.notifications (user_id, type, title, message, resource_path)
VALUES (
  'VOTRE_ADMIN_UUID',
  'info',
  'Test de notification',
  'Ceci est un test de notification',
  '/admin/moderation'
);
```

3. Rechargez la page d'accueil
4. Vous devriez voir le badge rouge sur la cloche
5. Cliquez sur la cloche pour voir la notification

### 7. Vérifier Realtime (optionnel)

Si Realtime est activé, les nouvelles notifications apparaissent automatiquement sans recharger la page.

Pour activer Realtime :
1. Supabase Dashboard → Database → Replication
2. Activez la réplication pour la table `notifications`

---

## 📝 Notes

- Les notifications sont visibles sur **toutes les pages** où le Header est présent
- Le badge rouge apparaît uniquement si `unreadCount > 0`
- Les notifications sont triées par date (plus récentes en premier)
- Cliquer sur une notification la marque comme lue et redirige vers `resource_path`

