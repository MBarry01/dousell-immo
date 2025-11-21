# 🔧 Troubleshooting - Notifications

## ❌ Problème : L'admin ne reçoit pas de notifications ni d'emails

### 🔍 Diagnostic rapide

Exécutez le script de diagnostic :

```bash
npx tsx scripts/test-notifications.ts
```

Ce script vérifie :
- ✅ Les variables d'environnement
- ✅ La connexion Supabase
- ✅ L'existence de la table `notifications`
- ✅ L'existence de la fonction `get_admin_user_id`
- ✅ La présence de l'admin dans `auth.users`
- ✅ La configuration Resend

### 📋 Checklist de vérification

#### 1. Migrations SQL appliquées ?

Vérifiez dans Supabase Dashboard → SQL Editor que ces migrations ont été exécutées :

- ✅ `20250128_create_notifications.sql` - Crée la table notifications
- ✅ `20250128_get_admin_user_id.sql` - Crée la fonction pour trouver l'admin
- ✅ `20250128_update_notifications_link_to_resource_path.sql` - (Si nécessaire)

**Comment vérifier :**

1. Allez dans Supabase Dashboard → SQL Editor
2. Exécutez cette requête :
   ```sql
   SELECT EXISTS (
     SELECT FROM information_schema.tables 
     WHERE table_schema = 'public' 
     AND table_name = 'notifications'
   );
   ```
3. Si retourne `false`, la table n'existe pas → Appliquez la migration

#### 2. L'admin existe-t-il dans auth.users ?

Vérifiez que l'email admin (`barrymohamadou98@gmail.com`) existe dans Supabase :

1. Supabase Dashboard → Authentication → Users
2. Cherchez `barrymohamadou98@gmail.com`
3. Si absent, créez-le ou connectez-vous avec cet email au moins une fois

#### 3. Variables d'environnement

Vérifiez votre `.env.local` :

```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key
ADMIN_EMAIL=barrymohamadou98@gmail.com

# Optionnel mais recommandé :
SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key
NEXT_PUBLIC_ADMIN_ID=uuid-de-l-admin
RESEND_API_KEY=votre-clé-resend
```

**Important :** Redémarrez le serveur après modification de `.env.local`

#### 4. Logs serveur

Regardez les logs du serveur Next.js lors du dépôt d'une annonce. Vous devriez voir :

```
📬 Tentative d'envoi de notification à l'admin...
🔍 Recherche de l'admin avec l'email: barrymohamadou98@gmail.com
✅ Admin trouvé via...
📝 Création de la notification pour l'admin: [uuid]
✅ Notification créée avec succès: [notification-id]
📧 Tentative d'envoi d'email à l'admin: barrymohamadou98@gmail.com
✅ Email admin envoyé avec succès
```

Si vous voyez des erreurs, notez-les.

### 🛠️ Solutions courantes

#### Solution 1 : La table n'existe pas

**Symptôme :** Erreur `relation "notifications" does not exist`

**Solution :**
1. Allez dans Supabase Dashboard → SQL Editor
2. Copiez-collez le contenu de `supabase/migrations/20250128_create_notifications.sql`
3. Exécutez la requête
4. Vérifiez que la table est créée : Table Editor → `notifications`

#### Solution 2 : La fonction get_admin_user_id n'existe pas

**Symptôme :** Erreur `function get_admin_user_id does not exist`

**Solution :**
1. Allez dans Supabase Dashboard → SQL Editor
2. Copiez-collez le contenu de `supabase/migrations/20250128_get_admin_user_id.sql`
3. Exécutez la requête

#### Solution 3 : L'admin n'est pas trouvé

**Symptôme :** `Admin user with email ... not found`

**Solutions :**

**Option A : Utiliser NEXT_PUBLIC_ADMIN_ID**

1. Trouvez l'ID de l'admin dans Supabase Dashboard → Authentication → Users
2. Copiez l'UUID de l'utilisateur `barrymohamadou98@gmail.com`
3. Ajoutez dans `.env.local` :
   ```env
   NEXT_PUBLIC_ADMIN_ID=uuid-de-l-admin
   ```
4. Redémarrez le serveur

**Option B : Utiliser SUPABASE_SERVICE_ROLE_KEY**

1. Récupérez la clé service role dans Supabase Dashboard → Settings → API
2. Ajoutez dans `.env.local` :
   ```env
   SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key
   ```
3. Redémarrez le serveur

#### Solution 4 : Les emails ne sont pas envoyés

**Symptôme :** `RESEND_API_KEY is not set`

**Solution :**
1. Créez un compte sur [resend.com](https://resend.com)
2. Récupérez votre clé API
3. Ajoutez dans `.env.local` :
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   ```
4. Redémarrez le serveur

**Note :** Les notifications in-app fonctionnent même sans Resend. Seuls les emails nécessitent Resend.

### 🧪 Test manuel

Pour tester manuellement la création d'une notification :

1. Allez dans Supabase Dashboard → SQL Editor
2. Exécutez cette requête (remplacez `ADMIN_USER_ID` par l'UUID de l'admin) :

```sql
INSERT INTO public.notifications (user_id, type, title, message, resource_path)
VALUES (
  'ADMIN_USER_ID',
  'info',
  'Test de notification',
  'Ceci est un test de notification',
  '/admin/moderation'
);
```

3. Vérifiez que la notification apparaît dans la cloche de l'admin

### 📞 Support

Si le problème persiste après avoir suivi ces étapes :

1. Exécutez `npx tsx scripts/test-notifications.ts`
2. Copiez la sortie complète
3. Vérifiez les logs serveur lors du dépôt d'une annonce
4. Partagez ces informations pour un diagnostic plus approfondi

