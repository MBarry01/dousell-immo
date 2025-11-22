# 🔧 Guide de Résolution - Notifications Non Affichées

## Problème
Les modérateurs ne reçoivent pas de notifications lorsqu'une annonce est déposée, et le badge ne s'affiche pas.

## Solutions par ordre de priorité

### ✅ Solution 1 : Vérifier que `SUPABASE_SERVICE_ROLE_KEY` est défini

**C'est la solution la plus probable !**

1. **Vercel** :
   - Allez dans Vercel Dashboard → Votre projet → Settings → Environment Variables
   - Vérifiez que `SUPABASE_SERVICE_ROLE_KEY` existe
   - Si absent :
     - Allez dans Supabase Dashboard → Settings → API
     - Copiez la `service_role` key (⚠️ gardez-la secrète)
     - Ajoutez-la dans Vercel comme `SUPABASE_SERVICE_ROLE_KEY`
     - Redéployez l'application

2. **Local (.env.local)** :
   ```env
   SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key_ici
   ```

### ✅ Solution 2 : Activer Realtime pour `notifications`

Exécutez ce script dans Supabase SQL Editor :

```sql
-- Activer Realtime pour la table notifications (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
END $$;
```

Ou exécutez directement : `docs/fix-notifications-rls-idempotent.sql`

### ✅ Solution 3 : Créer la fonction RPC `create_notification`

Si `SUPABASE_SERVICE_ROLE_KEY` n'est pas disponible, créez une fonction SQL qui bypass RLS :

Exécutez `docs/create-notification-function.sql` dans Supabase SQL Editor.

Cette fonction permet de créer des notifications même sans `SUPABASE_SERVICE_ROLE_KEY`.

### ✅ Solution 4 : Test direct de création de notification

Pour vérifier que tout fonctionne, créez une notification de test :

1. Exécutez `docs/test-create-notification-direct.sql` dans Supabase SQL Editor
2. Vérifiez que la notification apparaît dans le badge
3. Si oui, le problème vient de la création lors du dépôt d'annonce

### ✅ Solution 5 : Vérifier les logs serveur

Lors du dépôt d'une annonce, vérifiez les logs :

**Vercel** : Dashboard → Deployments → Logs  
**Local** : Terminal où `npm run dev` tourne

Vous devriez voir :
```
📬 Tentative d'envoi de notification aux modérateurs/admins...
🔍 notifyModeratorsAndAdmins appelé avec: {...}
🔑 Utilisation du service role client pour getUsersWithRoles
✅ X utilisateurs trouvés avec les rôles: admin, moderateur, superadmin
📬 Notification à X modérateurs/admins
📤 Envoi de notification à {userId}...
✅ Notification envoyée à {userId}
```

**Si vous voyez** :
- `⚠️ SUPABASE_SERVICE_ROLE_KEY non défini` → Solution 1
- `0 utilisateurs trouvés` → Vérifiez que les modérateurs ont bien un rôle dans `user_roles`
- `❌ Error creating user notification: permission denied` → Solution 3

## Diagnostic complet

Exécutez `docs/diagnostic-notifications-complet.sql` pour voir :
- Les modérateurs dans `user_roles`
- Les notifications existantes
- Si Realtime est activé
- Les policies RLS

## Checklist de vérification

- [ ] `SUPABASE_SERVICE_ROLE_KEY` est défini dans Vercel
- [ ] Realtime est activé pour `notifications` (voir Solution 2)
- [ ] Les modérateurs ont bien un rôle dans `user_roles` (voir `/admin/roles`)
- [ ] La fonction `create_notification` existe (voir Solution 3)
- [ ] Les logs serveur montrent que les notifications sont créées

## Test rapide

1. Exécutez `docs/test-create-notification-direct.sql`
2. Vérifiez que le badge se met à jour
3. Si oui, le problème vient de la création lors du dépôt d'annonce
4. Vérifiez les logs serveur lors du dépôt d'une annonce

