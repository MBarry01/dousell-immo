# 🔍 Diagnostic des Notifications - Dousell Immo

## Problème : Les modérateurs ne reçoivent pas de notifications

### ✅ Vérifications à faire

#### 1. Vérifier que `SUPABASE_SERVICE_ROLE_KEY` est défini

**Côté serveur (Vercel/Production) :**
- Allez dans Vercel → Settings → Environment Variables
- Vérifiez que `SUPABASE_SERVICE_ROLE_KEY` est défini
- Si absent, ajoutez-le depuis Supabase Dashboard → Settings → API → `service_role` key

**Côté local (.env.local) :**
```env
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key_ici
```

⚠️ **IMPORTANT** : Ne jamais exposer cette clé côté client (ne pas mettre `NEXT_PUBLIC_` devant)

#### 2. Vérifier que les modérateurs ont bien un rôle dans `user_roles`

Exécutez ce SQL dans Supabase SQL Editor :

```sql
SELECT 
  user_id,
  role,
  created_at
FROM public.user_roles
WHERE role IN ('admin', 'moderateur', 'superadmin')
ORDER BY role, created_at DESC;
```

Si aucun résultat, les modérateurs n'ont pas de rôle assigné. Utilisez la page `/admin/roles` pour leur accorder un rôle.

#### 3. Vérifier que les notifications sont créées

Exécutez ce SQL pour voir les notifications récentes :

```sql
SELECT 
  n.id,
  n.user_id,
  n.type,
  n.title,
  n.is_read,
  n.created_at,
  ur.role as user_role
FROM public.notifications n
LEFT JOIN public.user_roles ur ON n.user_id = ur.user_id
WHERE ur.role IN ('admin', 'moderateur', 'superadmin')
   OR n.user_id IN (
     SELECT id FROM auth.users 
     WHERE email = 'barrymohamadou98@gmail.com'
   )
ORDER BY n.created_at DESC
LIMIT 20;
```

#### 4. Vérifier les logs serveur

Lors du dépôt d'une annonce, vérifiez les logs dans :
- **Vercel** : Dashboard → Deployments → Logs
- **Local** : Terminal où `npm run dev` tourne

Vous devriez voir :
```
🔍 notifyModeratorsAndAdmins appelé avec: {...}
🔑 Utilisation du service role client pour getUsersWithRoles
✅ X utilisateurs trouvés avec les rôles: admin, moderateur, superadmin
📬 Notification à X modérateurs/admins
📤 Envoi de notification à {userId}...
✅ Notification envoyée à {userId}
```

#### 5. Vérifier que Realtime est activé pour `notifications`

Exécutez ce SQL :

```sql
SELECT 
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'notifications';
```

Si aucun résultat, exécutez `docs/fix-notifications-rls-idempotent.sql`

### 🔧 Solutions

#### Solution 1 : Ajouter `SUPABASE_SERVICE_ROLE_KEY`

1. Allez dans Supabase Dashboard → Settings → API
2. Copiez la `service_role` key (⚠️ gardez-la secrète)
3. Ajoutez-la dans Vercel → Settings → Environment Variables
4. Redéployez l'application

#### Solution 2 : Vérifier les rôles des modérateurs

1. Allez sur `/admin/roles`
2. Vérifiez que les modérateurs ont bien le rôle "Modérateur" activé
3. Si non, activez-le

#### Solution 3 : Vérifier les RLS policies

Exécutez `docs/fix-notifications-rls-idempotent.sql` pour s'assurer que les policies sont correctes.

### 📊 Test rapide

Pour tester si les notifications fonctionnent :

1. Connectez-vous en tant que modérateur
2. Ouvrez la console du navigateur (F12)
3. Déposez une annonce depuis un autre compte
4. Vérifiez les logs serveur pour voir si `notifyModeratorsAndAdmins` est appelé
5. Vérifiez que le badge de notification se met à jour

### 🐛 Problèmes courants

**Problème** : `SUPABASE_SERVICE_ROLE_KEY non défini`
- **Solution** : Ajoutez la variable d'environnement

**Problème** : `0 utilisateurs trouvés avec les rôles`
- **Solution** : Vérifiez que les modérateurs ont bien un rôle dans `user_roles`

**Problème** : `Error fetching users with roles: permission denied`
- **Solution** : `SUPABASE_SERVICE_ROLE_KEY` n'est pas défini ou incorrect

**Problème** : Les notifications sont créées mais le badge ne se met pas à jour
- **Solution** : Vérifiez que Realtime est activé pour `notifications` (voir Solution 1)




