# ✅ Vérification Finale - Notifications

## ✅ Ce qui fonctionne maintenant

1. **Test de notification** : Les notifications créées directement dans la base de données apparaissent correctement dans le badge
2. **Affichage** : Le badge de notification s'affiche avec le bon nombre
3. **Realtime** : Les notifications se mettent à jour en temps réel

## 🔍 Vérification pour les nouvelles annonces

Lorsqu'une nouvelle annonce est déposée, les modérateurs doivent recevoir une notification. Pour vérifier que tout fonctionne :

### 1. Vérifier les logs serveur

Lors du dépôt d'une annonce, vérifiez les logs (Vercel ou terminal local). Vous devriez voir :

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

### 2. Si vous voyez "0 utilisateurs trouvés"

Cela signifie que `getUsersWithRoles` ne trouve pas les modérateurs. Vérifiez :

- Que `SUPABASE_SERVICE_ROLE_KEY` est bien défini dans Vercel
- Que les modérateurs ont bien un rôle dans `user_roles` (voir `/admin/roles`)

### 3. Si vous voyez des erreurs RLS

Exécutez `docs/create-notification-function.sql` pour créer la fonction RPC `create_notification` qui bypass RLS.

### 4. Test complet

1. Connectez-vous avec un compte qui n'est pas modérateur
2. Déposez une nouvelle annonce
3. Vérifiez que le modérateur reçoit bien la notification dans son badge

## 📋 Checklist

- [x] Test de notification fonctionne
- [x] Badge s'affiche correctement
- [x] Realtime fonctionne
- [ ] Notifications créées lors du dépôt d'annonce
- [ ] Modérateurs reçoivent les notifications

## 🐛 Si les notifications ne sont pas créées lors du dépôt

1. Vérifiez les logs serveur (voir section 1)
2. Vérifiez que `SUPABASE_SERVICE_ROLE_KEY` est défini
3. Exécutez `docs/create-notification-function.sql` pour le fallback RPC
4. Vérifiez que les modérateurs ont bien un rôle dans `user_roles`

