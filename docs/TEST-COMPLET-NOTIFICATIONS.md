# 🧪 Test Complet - Notifications pour Nouvelles Annonces

## ✅ Étape 1 : Vérifier la configuration

### 1.1 Vérifier que la fonction RPC existe (recommandé)

Exécutez dans Supabase SQL Editor :

```sql
SELECT proname, proargnames 
FROM pg_proc 
WHERE proname = 'create_notification';
```

Si aucun résultat, exécutez `docs/create-notification-function.sql`

### 1.2 Vérifier que Realtime est activé

Exécutez dans Supabase SQL Editor :

```sql
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'notifications';
```

Si aucun résultat, exécutez `docs/fix-notifications-rls-idempotent.sql`

### 1.3 Vérifier que les modérateurs ont un rôle

Allez sur `/admin/roles` et vérifiez que les modérateurs ont bien le rôle "Modérateur" activé.

## 🧪 Étape 2 : Test complet

### 2.1 Préparer le test

1. **Compte 1** : Connectez-vous avec un compte modérateur (celui qui doit recevoir les notifications)
2. **Compte 2** : Connectez-vous avec un autre compte (celui qui va déposer l'annonce)
   - Ou utilisez un navigateur en navigation privée

### 2.2 Déposer une annonce

1. Avec le **Compte 2**, allez sur `/compte/deposer`
2. Remplissez le formulaire et déposez une annonce
3. Notez l'heure exacte du dépôt

### 2.3 Vérifier les logs serveur

**Vercel** : Dashboard → Deployments → Logs  
**Local** : Terminal où `npm run dev` tourne

Recherchez ces logs dans les 30 secondes suivant le dépôt :

```
📬 Tentative d'envoi de notification aux modérateurs/admins...
🔍 notifyModeratorsAndAdmins appelé avec: {...}
🔑 Utilisation du service role client pour getUsersWithRoles
✅ X utilisateurs trouvés avec les rôles: admin, moderateur, superadmin
📬 Notification à X modérateurs/admins
📤 Envoi de notification à {userId}...
✅ Notification envoyée à {userId}
✅ notifyModeratorsAndAdmins terminé: X/X notifications envoyées
✅ X notifications créées avec succès
```

### 2.4 Vérifier dans le navigateur (Compte 1 - Modérateur)

1. Rechargez la page (ou attendez quelques secondes pour Realtime)
2. Vérifiez que le badge de notification affiche "1" (ou le nombre correct)
3. Cliquez sur le badge pour voir la notification
4. Vérifiez la console (F12) pour voir :
   ```
   📬 Notifications récupérées: {userId: '...', total: 1, unread: 1, ...}
   ```

## 🔍 Diagnostic si ça ne fonctionne pas

### Problème 1 : "0 utilisateurs trouvés"

**Symptôme** : Les logs montrent `✅ 0 utilisateurs trouvés avec les rôles`

**Solution** :
1. Vérifiez que `SUPABASE_SERVICE_ROLE_KEY` est défini dans Vercel
2. Vérifiez que les modérateurs ont bien un rôle dans `user_roles` (voir `/admin/roles`)
3. Exécutez `docs/diagnostic-notifications-complet.sql` pour voir les modérateurs

### Problème 2 : "Error creating user notification: permission denied"

**Symptôme** : Les logs montrent `❌ Error creating user notification: permission denied`

**Solution** :
1. Exécutez `docs/create-notification-function.sql` pour créer la fonction RPC
2. Le code utilisera automatiquement cette fonction en fallback

### Problème 3 : Les notifications sont créées mais n'apparaissent pas

**Symptôme** : Les logs montrent `✅ X notifications créées avec succès` mais le badge ne se met pas à jour

**Solution** :
1. Vérifiez que Realtime est activé (voir Étape 1.2)
2. Vérifiez la console du navigateur pour des erreurs Realtime
3. Rechargez la page manuellement

### Problème 4 : Aucun log n'apparaît

**Symptôme** : Aucun log `📬 Tentative d'envoi de notification` n'apparaît

**Solution** :
1. Vérifiez que l'annonce a bien été créée (allez sur `/compte/mes-biens`)
2. Vérifiez que le code dans `app/compte/deposer/actions.ts` est bien déployé
3. Redéployez l'application si nécessaire

## ✅ Checklist finale

- [ ] Fonction RPC `create_notification` existe
- [ ] Realtime activé pour `notifications`
- [ ] Modérateurs ont un rôle dans `user_roles`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` défini dans Vercel
- [ ] Logs serveur montrent que les notifications sont créées
- [ ] Badge se met à jour automatiquement (ou après rechargement)
- [ ] Notification visible dans le dropdown

## 📝 Notes

- Les notifications peuvent prendre quelques secondes à apparaître grâce à Realtime
- Si Realtime ne fonctionne pas, rechargez la page pour voir les nouvelles notifications
- Les logs serveur sont essentiels pour diagnostiquer les problèmes

