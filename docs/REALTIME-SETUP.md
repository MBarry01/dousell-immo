# Configuration Supabase Realtime pour les Rôles

## Activation de Realtime dans Supabase

Pour que la synchronisation automatique des rôles fonctionne, vous devez activer Realtime dans Supabase :

### 1. Activer Realtime sur la table `user_roles`

1. Allez dans **Supabase Dashboard** → **Database** → **Replication**
2. Trouvez la table `user_roles`
3. Activez la réplication pour cette table
4. Ou exécutez cette commande SQL dans **SQL Editor** :

```sql
-- Activer Realtime pour la table user_roles
ALTER PUBLICATION supabase_realtime ADD TABLE user_roles;
```

### 2. Vérifier que Realtime est activé

Dans **Supabase Dashboard** → **Database** → **Replication**, vous devriez voir :
- ✅ `user_roles` dans la liste des tables répliquées

### 3. Vérifier les politiques RLS

Assurez-vous que les politiques RLS permettent aux utilisateurs de voir leurs propres rôles :

```sql
-- Vérifier que la politique existe
SELECT * FROM pg_policies 
WHERE tablename = 'user_roles' 
AND policyname = 'user_roles_select_own';
```

Si elle n'existe pas, créez-la :

```sql
CREATE POLICY "user_roles_select_own" ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
```

## Test de la synchronisation

1. Connectez-vous avec un compte utilisateur
2. Dans un autre onglet, accordez un rôle à cet utilisateur via `/admin/roles`
3. Le menu déroulant utilisateur devrait se mettre à jour automatiquement (sans rafraîchir la page)
4. L'option "Panel Admin" devrait apparaître automatiquement

## Dépannage

### Les rôles ne se synchronisent pas

1. Vérifiez la console du navigateur pour les erreurs
2. Vérifiez que Realtime est activé dans Supabase Dashboard
3. Vérifiez que les politiques RLS permettent la lecture des rôles
4. Vérifiez la connexion WebSocket dans l'onglet Network des DevTools

### Erreur "CHANNEL_ERROR"

- Vérifiez que Realtime est activé sur la table `user_roles`
- Vérifiez que les politiques RLS sont correctement configurées
- Vérifiez que l'utilisateur est bien authentifié




