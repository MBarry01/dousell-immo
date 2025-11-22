# ✅ Configuration Complète des Notifications

## 📋 Récapitulatif des Notifications

### Actions qui créent des notifications

| Action | Destinataire | Type | Fichier |
|--------|--------------|------|---------|
| **Dépôt d'annonce** | Admins + Modérateurs | `info` | `app/compte/deposer/actions.ts` |
| **Validation d'annonce** | Propriétaire | `success` | `app/admin/moderation/actions.ts` |
| **Refus d'annonce** | Propriétaire | `warning` | `app/admin/moderation/actions.ts` |
| **Nouveau lead** | Admins + Modérateurs | `info` | `app/planifier-visite/actions.tsx` |
| **Attribution de rôle** | Utilisateur concerné | `success` | `app/admin/roles/actions.ts` |
| **Retrait de rôle** | Utilisateur concerné | `warning` | `app/admin/roles/actions.ts` |

## 🔧 Scripts SQL à exécuter

### 1. Activer Realtime et corriger RLS

Exécutez ce script dans Supabase SQL Editor :

```sql
-- Activer Realtime pour la table notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Users can read their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Service role full access" ON public.notifications;

-- Politique : Les utilisateurs peuvent lire leurs propres notifications
CREATE POLICY "Users can read their own notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent mettre à jour leurs propres notifications
CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politique : Permettre l'insertion de notifications pour les utilisateurs authentifiés
CREATE POLICY "Authenticated users can insert notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Politique : Service role peut tout faire (pour bypasser RLS côté serveur)
CREATE POLICY "Service role full access"
  ON public.notifications
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

**Fichier** : `docs/fix-notifications-rls.sql`

## ✅ Vérifications

### 1. Variables d'environnement

Vérifiez que `.env.local` contient :
```env
SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key
```

### 2. Test des notifications

1. **Dépôt d'annonce** :
   - Connectez-vous en tant qu'utilisateur normal
   - Déposez une annonce
   - Vérifiez que les admins/moderateurs reçoivent une notification

2. **Validation d'annonce** :
   - Connectez-vous en tant qu'admin/moderateur
   - Validez une annonce
   - Vérifiez que le propriétaire reçoit une notification

3. **Nouveau lead** :
   - Soumettez un formulaire de contact
   - Vérifiez que les admins/moderateurs reçoivent une notification

4. **Attribution de rôle** :
   - Accordez un rôle à un utilisateur
   - Vérifiez que l'utilisateur reçoit une notification

## 🐛 Dépannage

### Le badge ne s'affiche pas

1. Vérifiez la console du navigateur (F12)
2. Cherchez les logs : `📬 Notifications récupérées:`
3. Vérifiez que Realtime est activé : `docs/enable-realtime-notifications.sql`
4. Vérifiez que les RLS policies sont correctes : `docs/fix-notifications-rls.sql`

### Les notifications ne sont pas créées

1. Vérifiez les logs serveur pour voir les erreurs
2. Vérifiez que `SUPABASE_SERVICE_ROLE_KEY` est défini
3. Vérifiez que la table `notifications` existe
4. Vérifiez que les RLS policies permettent l'insertion

### Le badge ne se met pas à jour

1. Vérifiez que Realtime est activé pour la table `notifications`
2. Vérifiez la console pour les erreurs Realtime
3. Rechargez la page pour forcer un refetch

## 📝 Fichiers modifiés

- `lib/notifications.ts` - Utilise service role pour bypasser RLS
- `lib/notifications-helpers.ts` - Nouvelle fonction `notifyModeratorsAndAdmins()` et `getUsersWithRoles()`
- `app/compte/deposer/actions.ts` - Notifie tous les modérateurs/admins au lieu de juste l'admin
- `app/planifier-visite/actions.tsx` - Notifie tous les modérateurs/admins pour nouveaux leads
- `app/admin/roles/actions.ts` - Utilise `notifyUser()` pour les notifications de rôle (attribution et retrait)
- `hooks/use-notifications.ts` - Logs de débogage ajoutés, debounced refetch pour mises à jour en masse
- `components/layout/notification-bell.tsx` - Refetch automatique au clic, animation pulse sur le badge

## ✅ Validation Utilisateur

### Notifications pour les utilisateurs

Les utilisateurs reçoivent des notifications pour :
- ✅ **Validation de leur annonce** → Type `success`, lien vers le bien
- ✅ **Refus de leur annonce** → Type `warning`, lien vers mes-biens
- ✅ **Attribution d'un rôle** → Type `success`, lien vers /admin
- ✅ **Retrait d'un rôle** → Type `warning`, lien vers /compte

### Vérification

Pour vérifier que les notifications utilisateur fonctionnent :

1. **Test validation** :
   - Déposez une annonce en tant qu'utilisateur normal
   - Connectez-vous en tant qu'admin/moderateur
   - Validez l'annonce
   - Reconnectez-vous en tant qu'utilisateur normal
   - Vérifiez que le badge affiche la notification

2. **Test attribution de rôle** :
   - Accordez un rôle à un utilisateur
   - Connectez-vous avec cet utilisateur
   - Vérifiez que le badge affiche la notification

3. **Test nouveau lead** :
   - Soumettez un formulaire de contact
   - Connectez-vous en tant qu'admin/moderateur
   - Vérifiez que le badge affiche la notification

